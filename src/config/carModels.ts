// Car model configurations
// Base URL for assets (handles GitHub Pages subdirectory)
const BASE = import.meta.env.BASE_URL || '/';

export interface CarModel {
  id: string;
  name: string;
  model: string;
  year: number;
  color: string;
  modelPath: string;
  fallbackImages: string;
  imageCount: number;
  active: boolean;
  scale: number;
  position: [number, number, number];
  rotationOffset: number; // Y-axis rotation offset to face camera correctly
}

export const CAR_MODELS: Record<string, CarModel> = {
  "mclaren-mcl38": {
    id: "mclaren-mcl38",
    name: "McLaren MCL38",
    model: "F1 2024",
    year: 2024,
    color: "Papaya Orange",
    modelPath: `${BASE}models/mclaren-mcl38/f1_2024_mclaren_mcl38.glb`,
    fallbackImages: `${BASE}car-images/`,
    imageCount: 11,
    active: true,
    scale: 2.5,
    position: [0, 0, 0],
    rotationOffset: 0,
  },
  "mercedes-w14": {
    id: "mercedes-w14",
    name: "Mercedes-AMG W14",
    model: "F1 2023",
    year: 2023,
    color: "Silver Arrow",
    modelPath: `${BASE}models/mercedes-w14/f1_2023_mercedes_amg_w14_e_performance_s1.glb`,
    fallbackImages: `${BASE}car-images/`,
    imageCount: 11,
    active: true,
    scale: 2.5,
    position: [0, 0, 0],
    rotationOffset: 0,
  },
  "mclaren-mcl36": {
    id: "mclaren-mcl36",
    name: "McLaren MCL36",
    model: "F1 2022",
    year: 2022,
    color: "Papaya Orange",
    modelPath: `${BASE}models/mclaren-mcl36/scene.gltf`,
    fallbackImages: `${BASE}car-images/`,
    imageCount: 11,
    active: false, // Disabled - GLTF model has loading issues
    scale: 2.5,
    position: [0, 0, 0],
    rotationOffset: 0,
  },
  "redbull-rb19": {
    id: "redbull-rb19",
    name: "Red Bull RB19",
    model: "F1 2023",
    year: 2023,
    color: "Oracle Blue",
    modelPath: `${BASE}models/mclaren-mcl38/f1_2024_mclaren_mcl38.glb`,
    fallbackImages: `${BASE}car-images/`,
    imageCount: 11,
    active: false, // Placeholder: no distinct Red Bull model is supplied yet.
    scale: 2.5,
    position: [0, 0, 0],
    rotationOffset: 0,
  },
  "ferrari-sf23": {
    id: "ferrari-sf23",
    name: "Ferrari SF-23",
    model: "F1 2023",
    year: 2023,
    color: "Rosso Corsa",
    modelPath: `${BASE}models/mercedes-w14/f1_2023_mercedes_amg_w14_e_performance_s1.glb`,
    fallbackImages: `${BASE}car-images/`,
    imageCount: 11,
    active: false, // Placeholder: no distinct Ferrari model is supplied yet.
    scale: 2.5,
    position: [0, 0, 0],
    rotationOffset: 0,
  },
};

export const getCarById = (id: string): CarModel | undefined => {
  return CAR_MODELS[id];
};

export const getAllCars = (): CarModel[] => {
  return Object.values(CAR_MODELS).filter(car => car.active);
};
