type Vec3 = { x: number; y: number; z: number };
type EulerLike = { x?: number; y?: number; z?: number };

export type ImageConfig = {
  src: string;
  width: number;
  position: Vec3;
  rotation?: EulerLike;
  group?: string;
  normalMapSrc?: string;
  displacementMapSrc?: string;
  normalScale?: number;
  displacementScale?: number;
  roughness?: number;
  metalness?: number;
};

const assets = {
  bg: '/bg.png',
  pin: '/pin.png',
  hat: '/hat.png',
  canvas: '/canvas.png',
  creative: '/creativec.png',
  design: '/design.png',
  math: '/math.png',
  motion: '/motion.png',
  threejs: '/threejs.png',
  webgl: '/webgl.png',
  name_card: '/name_card.png',
  meidi: '/meidi.png',
  screenshot: '/screenshot.png',
  area_title: '/area_title.png',
  edu_title: '/edu_title.png',
  projects_title: '/projects_title.png',
  techbox_title: '/techbox_title.png',
  work_title: '/work_title.png',
};

export const imageConfigs: ImageConfig[] = [
  {
    src: assets.bg,
    displacementMapSrc: '/textures/paper-displacement.png',
    normalMapSrc: '/textures/paper-normal.webp',
    width: 800,
    displacementScale: 100,
    normalScale: 2,
    position: { x: 0, y: 0, z: -60 },
    roughness: 0.7,
  },
  { src: assets.pin, width: 100, position: { x: -540, y: 850, z: 10 }, roughness: 0.4 },
  { src: assets.hat, width: 195, position: { x: 220, y: 860, z: 12 }, rotation: { z: -Math.PI / 16 }, group: 'shaking' },
  { src: assets.name_card, width: 500, position: { x: 380, y: 750, z: 10 }, roughness: 0.4, rotation: { z: Math.PI / 60 } },
  { src: assets.area_title, width: 220, position: { x: -450, y: 690, z: 8 } },
  { src: assets.edu_title, width: 230, position: { x: 455, y: 380, z: 8 } },
  { src: assets.work_title, width: 390, position: { x: -320, y: 50, z: 8 } },
  { src: assets.projects_title, width: 190, position: { x: 475, y: -170, z: 8 } },
  { src: assets.techbox_title, width: 295, position: { x: -390, y: -595, z: 8 } },
  { src: assets.screenshot, width: 300, position: { x: 390, y: -660, z: 10 } },
  { src: assets.meidi, width: 90, position: { x: 230, y: -200, z: 10 } },
  { src: assets.webgl, roughness: 0.4, width: 100, position: { x: -120, y: -50, z: -2 }, group: 'stickers' },
  {
    src: assets.threejs,
    width: 100,
    position: { x: 0, y: 0, z: 6 },
    rotation: { z: -Math.PI / 20 },
    group: 'stickers',
    roughness: 0.4,
  },
  {
    src: assets.canvas,
    width: 100,
    position: { x: 160, y: 10, z: 2 },
    rotation: { z: -Math.PI / 60 },
    roughness: 0.4,
    group: 'stickers',
  },
  {
    src: assets.motion,
    roughness: 0.4,
    width: 120,
    position: { x: 60, y: 100, z: 4 },
    rotation: { z: Math.PI / 60 },
    group: 'stickers',
  },
  {
    src: assets.creative,
    width: 120,
    position: { x: -120, y: 70, z: 0 },
    rotation: { z: -Math.PI / 60 },
    group: 'stickers',
  },
  {
    src: assets.design,
    width: 130,
    position: { x: -30, y: -130, z: 3 },
    roughness: 0.4,
    rotation: { z: 0.1 },
    group: 'stickers',
  },
  { src: assets.math, width: 120, position: { x: 130, y: -90, z: 5 }, roughness: 0.4, group: 'stickers' },
];

export const SCENE_CONFIG = {
  cameraZ: 1350,
  designCameraZ: 800,
  shadowMapSize: 2048,
  shadowAreaSize: 1000,
};