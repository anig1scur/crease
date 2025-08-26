import type * as THREE from 'three';
import type CameraControls from 'camera-controls';

export type ThreeState = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: CameraControls;
  cvGroup: THREE.Group;
  stickerGroup: THREE.Group;
  createdMeshes: THREE.Object3D[];
  animationFrameId?: number;
};
type Vec3 = { x: number; y: number; z: number };
type EulerLike = { x?: number; y?: number; z?: number };

export type assetConfig = {
  src: string;
  back?: string;
  href?: string;
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
  coverSrc?: string;
  castShadow?: boolean;
  cornerRadius?: number;
};