import * as THREE from 'three';
import CameraControls from 'camera-controls';
import { assets, assetsConfig, SCENE_CONFIG } from '$lib/config';
import { loadTexture } from './utils';


export function setupCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 0, SCENE_CONFIG.cameraZ);
  return camera;
}

export function setupRenderer(el: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: 'high-performance'
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  el.appendChild(renderer.domElement);
  return renderer;
}

export async function setupBackground(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  const bgTex = await loadTexture(assets.wood, true, renderer);
  scene.background = bgTex;
}

export function setupLights(scene: THREE.Scene) {
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x333333, 2.5);
  hemiLight.position.set(0, 1, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(100, 100, 600);
  dirLight.castShadow = true;
  const { shadowAreaSize, shadowMapSize } = SCENE_CONFIG;
  dirLight.shadow.camera.left = -shadowAreaSize;
  dirLight.shadow.camera.right = shadowAreaSize;
  dirLight.shadow.camera.top = shadowAreaSize;
  dirLight.shadow.camera.bottom = -shadowAreaSize;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 1500;
  dirLight.shadow.mapSize.width = shadowMapSize;
  dirLight.shadow.mapSize.height = shadowMapSize;
  dirLight.shadow.bias = -0.001;
  scene.add(dirLight);

  const dirLightBack = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLightBack.position.set(100, 100, -600);
  scene.add(dirLightBack);
}

export function setupControls(
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement
): CameraControls {

  CameraControls.install({ THREE: THREE });
  const controls = new CameraControls(camera, domElement);
  controls.dollyToCursor = true;
  controls.mouseButtons.left = CameraControls.ACTION.TRUCK;
  controls.mouseButtons.wheel = CameraControls.ACTION.ZOOM;
  controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_TRUCK;
  controls.mouseButtons.right = CameraControls.ACTION.ROTATE;
  controls.maxZoom = 100;
  controls.minZoom = 0.5;
  return controls;
}