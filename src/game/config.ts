export const art = (name: string) => `${import.meta.env.BASE_URL}cartoon-pack/${name}.svg`;

export const GAME_CARS = [
  {
    id: 'mclaren-mcl38', name: 'McLaren MCL38', nickname: 'The firecracker', number: '01',
    description: 'Quick off the line. Light on its feet. Made for late braking and a little mischief.',
    path: 'models/mclaren-mcl38/f1_2024_mclaren_mcl38.glb',
    topSpeed: 48, acceleration: 15.5, grip: 7.5, steering: 1.65, braking: 24,
    color: '#e98254', character: 'wild-haired-driver',
  },
  {
    id: 'mercedes-w14', name: 'Mercedes-AMG W14', nickname: 'The mountain arrow', number: '02',
    description: 'Planted through the bends, with a longer stride on the straights. Find your flow.',
    path: 'models/mercedes-w14/f1_2023_mercedes_amg_w14_e_performance_s1.glb',
    topSpeed: 53, acceleration: 12.8, grip: 10.5, steering: 1.35, braking: 27,
    color: '#9aba97', character: 'eagle-perched',
  },
] as const;

export const PAINTS = [
  { name: 'Trail orange', hex: '#e98254' },
  { name: 'Alpine sage', hex: '#9aba97' },
  { name: 'River blue', hex: '#70b9c7' },
  { name: 'Butter yellow', hex: '#f7d674' },
  { name: 'Warm cream', hex: '#fff7e8' },
  { name: 'Dark pine', hex: '#334c41' },
];

export type GameCar = typeof GAME_CARS[number];
export function carById(id: string): GameCar {
  return GAME_CARS.find((car) => car.id === id) ?? GAME_CARS[0];
}

export function formatTime(seconds: number) {
  const centiseconds = Number.isFinite(seconds) ? Math.round(Math.max(0, seconds) * 100) : 0;
  const minutes = Math.floor(centiseconds / 6000);
  return `${String(minutes).padStart(2, '0')}:${((centiseconds % 6000) / 100).toFixed(2).padStart(5, '0')}`;
}
