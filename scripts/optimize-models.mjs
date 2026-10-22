import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, join, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { Matrix4 } from 'three';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const models = [
  { id: 'mclaren-mcl38', file: 'f1_2024_mclaren_mcl38.glb' },
  { id: 'mercedes-w14', file: 'f1_2023_mercedes_amg_w14_e_performance_s1.glb' },
];
const excluded = /tire|tyre|wheel|rim|rubber|floor|ground|plane|glass|window|visor|carbon|brake|disc|chrome|metal|steel|black|dark/i;
const wheelPattern = /^WHEEL_(LF|RF|LR|RR)_/i;
const steeringPattern = /^STEER_HR_/i;
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
  'meshopt.decoder': MeshoptDecoder,
});

async function measure(document, bytes) {
  const root = document.getRoot();
  let triangles = 0;
  let draws = 0;
  let texturePixels = 0;
  for (const node of root.listNodes()) {
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      draws++;
      if (primitive.getMode() === 4) {
        triangles += (primitive.getIndices() ?? primitive.getAttribute('POSITION')).getCount() / 3;
      }
    }
  }
  for (const texture of root.listTextures()) {
    const metadata = await sharp(texture.getImage()).metadata();
    texturePixels += (metadata.width ?? 0) * (metadata.height ?? 0);
  }
  return {
    bytes, triangles: Math.round(triangles), meshDraws: draws,
    materials: root.listMaterials().length,
    bounds: getBounds(root.listScenes()[0]),
    // RGBA8 + mip chain estimate; excludes driver overhead and geometry.
    textureMemoryMiB: +(texturePixels * 4 * 4 / 3 / 1048576).toFixed(2),
  };
}

function prepareParts(document) {
  const root = document.getRoot();
  const scene = root.listScenes()[0];
  if (root.listSkins().length || root.listAnimations().length) {
    throw new Error('This pipeline expects static source cars with separately named wheel groups.');
  }
  const parts = root.listNodes().filter((node) => wheelPattern.test(node.getName()) || steeringPattern.test(node.getName()));
  if (parts.filter((node) => wheelPattern.test(node.getName())).length !== 4) {
    throw new Error('Expected four wheel groups; refusing to bake away unknown wheel pivots.');
  }
  const partMatrices = new Map(parts.map((node) => [node, new Matrix4().fromArray(node.getWorldMatrix())]));
  const inverseMatrices = new Map([...partMatrices].map(([node, matrix]) => [node, matrix.clone().invert()]));
  const materialVariants = new Map();
  const meshNodes = root.listNodes().filter((node) => node.getMesh());
  // Snapshot world transforms before changing any parent relationships.
  const placements = meshNodes.map((node) => {
    let parent = node;
    while (parent && !partMatrices.has(parent)) parent = parent.getParentNode();
    return { node, part: parent, world: new Matrix4().fromArray(node.getWorldMatrix()) };
  });
  for (const { node, part } of placements) {
    const mesh = node.getMesh();
    for (const primitive of mesh.listPrimitives()) {
      const material = primitive.getMaterial();
      if (!material) continue;
      const color = material.getBaseColorFactor();
      const black = color[0] < 0.15 && color[1] < 0.15 && color[2] < 0.15;
      const paintable = !part && !black && !excluded.test(node.getName() + ' ' + mesh.getName());
      const key = material.getName() + ':' + root.listMaterials().indexOf(material) + ':' + paintable;
      if (!materialVariants.has(key)) {
        const variant = material.clone().setExtras({ ...material.getExtras(), paintable });
        materialVariants.set(key, variant);
      }
      primitive.setMaterial(materialVariants.get(key));
    }
  }
  for (const part of parts) {
    part.getParentNode()?.removeChild(part);
    scene.addChild(part);
    part.setMatrix(partMatrices.get(part).toArray());
    const wheel = part.getName().match(wheelPattern);
    part.setExtras({ ...part.getExtras(), part: wheel ? 'wheel' : 'steering', ...(wheel ? { corner: wheel[1].toLowerCase() } : {}) });
  }
  for (const { node, part, world } of placements) {
    if (node === part) continue;
    node.getParentNode()?.removeChild(node);
    (part ?? scene).addChild(node);
    node.setMatrix(part ? inverseMatrices.get(part).clone().multiply(world).toArray() : world.toArray());
  }
  return parts.map((part) => part.getName());
}

const reports = [];
for (const { id, file } of models) {
  const source = resolve(workspace, 'img/3d-Model', file);
  const output = resolve(workspace, 'public/models', id, file);
  const document = await io.read(source);
  const before = await measure(document, (await stat(source)).size);
  const preservedParts = prepareParts(document);
  await document.transform(
    dedup(),
    join({ keepNamed: false }),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.6, error: 0.0005 }),
    prune({ keepLeaves: false }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 88, effort: 80, slots: /^(?!normalTexture).*$/ }),
    // Normal data should remain lossless to avoid introducing lighting artifacts.
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], lossless: true, effort: 80, slots: /^normalTexture$/ }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );
  const bytes = await io.writeBinary(document);
  // Round-trip decode compressed bytes before replacing the delivery model.
  const decoded = await io.readBinary(bytes);
  for (const name of preservedParts) {
    if (!decoded.getRoot().listNodes().some((node) => node.getName() === name)) {
      throw new Error('Optimization lost a movable part: ' + name);
    }
  }
  const after = await measure(decoded, bytes.byteLength);
  const size = Math.max(...before.bounds.max.map((value, axis) => value - before.bounds.min[axis]));
  const boundError = Math.max(...['min', 'max'].flatMap((edge) =>
    before.bounds[edge].map((value, axis) => Math.abs(value - after.bounds[edge][axis]))));
  if (boundError > size * 0.002) {
    throw new Error('Optimization changed the model bounds unexpectedly for ' + id);
  }
  if (after.bytes >= before.bytes || after.meshDraws >= before.meshDraws) {
    throw new Error('Optimization did not improve delivery size and draw count for ' + id);
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, bytes);
  const report = { id, source: 'img/3d-Model/' + file, output: 'public/models/' + id + '/' + file, before, after, preservedParts };
  reports.push(report);
  console.log(JSON.stringify(report, null, 2));
}

// The wall images are non-interactive decoration, so cap their texture resolution too.
const wallImages = ['f1-from-left-far', 'from-right', 'from-right-close'];
const posters = [];
for (const name of wallImages) {
  const source = resolve(workspace, 'public/car-images/img', name + '.png');
  const output = resolve(workspace, 'public/optimized-images', name + '.webp');
  const bytes = await sharp(await readFile(source)).resize({ width: 1024, height: 768, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toBuffer();
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, bytes);
  posters.push({ file: name, beforeBytes: (await stat(source)).size, afterBytes: bytes.length });
}
const reportDirectory = resolve(workspace, 'docs');
await mkdir(reportDirectory, { recursive: true });
await writeFile(resolve(reportDirectory, 'model-optimization-report.json'), JSON.stringify({
  settings: { triangleRatioTarget: 0.6, maxRelativeError: 0.0005, maxTextureSize: 1024, geometryCompression: 'EXT_meshopt_compression', textureFormat: 'webp' },
  models: reports, posters,
}, null, 2) + '\n');
