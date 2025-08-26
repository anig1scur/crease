import * as THREE from 'three';
import type { ThreeState, assetConfig } from './types';
import { loadTexture, pxToWorldWidth } from './utils';
import { animateShakingElements } from './animations';
import { resolveAsset } from '$lib/config';


async function createPlaneFromConfig(
  config: assetConfig,
  state: ThreeState
): Promise<THREE.Object3D> {
  const { camera, renderer } = state;
  const isVideo = config.src.endsWith('.mp4') || config.src.endsWith('.webm');
  let colorMap: THREE.Texture;
  let naturalAspect = 1;
  let videoElement: HTMLVideoElement | undefined;
  let videoTexture: THREE.VideoTexture | undefined;

  if (isVideo) {
    const video = document.createElement('video');
    video.src = resolveAsset(config.src);
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    videoElement = video;
    await new Promise<void>((resolve) => {
      video.addEventListener('loadedmetadata', () => {
        naturalAspect = video.videoWidth / video.videoHeight;
        resolve();
      });
    });
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    if (config.coverSrc) {
      colorMap = await loadTexture(config.coverSrc, true, renderer);
    } else {
      video.play().catch((e) => console.error('Video playback failed on load:', e));
      colorMap = videoTexture;
    }
  } else {
    const texture = await loadTexture(config.src, true, renderer);
    colorMap = texture;
    const img = texture.image as HTMLImageElement;
    naturalAspect = img.width / img.height;
  }

  const worldW = pxToWorldWidth(config.width, config.position.z, camera);
  const worldX = pxToWorldWidth(config.position.x, config.position.z, camera);
  const worldY = pxToWorldWidth(config.position.y, config.position.z, camera);
  const worldH = worldW / naturalAspect;

  const segments = config.displacementMapSrc ? 256 : 1;
  const geometry = new THREE.PlaneGeometry(worldW, worldH, segments, segments);

  const materialParams: THREE.MeshStandardMaterialParameters = {
    map: colorMap,
    roughness: config.roughness ?? 0.6,
    metalness: config.metalness ?? 0.1,
    transparent: true,
    alphaTest: 0.001
  };
  if (config.normalMapSrc) {
    materialParams.normalMap = await loadTexture(config.normalMapSrc, false, renderer);
    materialParams.normalScale = new THREE.Vector2(config.normalScale ?? 0.6, config.normalScale ?? 0.6);
  }
  if (config.displacementMapSrc) {
    materialParams.displacementMap = await loadTexture(config.displacementMapSrc, false, renderer);
    materialParams.displacementScale = config.displacementScale ?? 50;
  }
  const frontMaterial = new THREE.MeshStandardMaterial(materialParams);
  if (config.cornerRadius && config.cornerRadius > 0) {
    frontMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uCornerRadius = { value: config.cornerRadius };
      shader.uniforms.uPlaneSize = { value: new THREE.Vector2(worldW, worldH) };
      shader.vertexShader = `
                varying vec2 vUv;
                ${ shader.vertexShader }
            `.replace(`#include <uv_vertex>`, `#include <uv_vertex>\nvUv = uv;`);
      shader.fragmentShader = `
                uniform float uCornerRadius;
                uniform vec2 uPlaneSize;
                varying vec2 vUv;
                float getRoundedAlpha() {
                    vec2 halfSize = uPlaneSize * 0.5;
                    vec2 pos = vUv * uPlaneSize - halfSize;
                    float radius = uCornerRadius * min(halfSize.x, halfSize.y);
                    vec2 d = abs(pos) - (halfSize - vec2(radius));
                    float dist = length(max(d, 0.0)) - radius;
                    return 1.0 - smoothstep(0.0, 2.0 / 1024.0, dist);
                }
                ${ shader.fragmentShader }
            `.replace(
        `#include <alphamap_fragment>`,
        `#include <alphamap_fragment>\ndiffuseColor.a *= getRoundedAlpha();`
      );
    };
  }

  if (config.back) {
    frontMaterial.side = THREE.FrontSide;
    const frontMesh = new THREE.Mesh(geometry, frontMaterial);
    const backTexture = await loadTexture(config.back, true, renderer);
    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: config.roughness ?? 0.5,
      metalness: config.metalness ?? 0.1,
      transparent: true
    });
    const backMesh = new THREE.Mesh(geometry, backMaterial);
    backMesh.rotation.y = Math.PI;

    const group = new THREE.Group();

    group.add(frontMesh, backMesh);
    group.position.set(worldX, worldY, config.position.z);
    if (config.rotation) {
      group.rotation.set(config.rotation.x ?? 0, config.rotation.y ?? 0, config.rotation.z ?? 0);
    }
    if (isVideo) {
      group.userData = {
        isVideo: true,
        isPlaying: !config.coverSrc,
        videoElement,
        videoTexture
      };
    }
    return group;
  } else {
    const mesh = new THREE.Mesh(geometry, frontMaterial);

    mesh.position.set(worldX, worldY, config.position.z);

    if (config.href) {
      mesh.userData.href = config.href;
    }

    if (config.rotation) {
      mesh.rotation.set(config.rotation.x ?? 0, config.rotation.y ?? 0, config.rotation.z ?? 0);
    }
    if (isVideo) {
      mesh.userData = {
        isVideo: true,
        isPlaying: !config.coverSrc,
        videoElement,
        videoTexture
      };
    }
    return mesh;
  }
}

export async function createAllPlanes(
  configs: assetConfig[],
  state: ThreeState
): Promise<THREE.Object3D[]> {
  const meshPromises = configs.map((cfg) => createPlaneFromConfig(cfg, state));
  const objects = await Promise.all(meshPromises);

  objects.forEach((obj, index) => {
    const cfg = configs[index];
    obj.castShadow = cfg.castShadow ?? true;
    obj.receiveShadow = index === 0;
    obj.renderOrder = cfg.position.z;
    if (cfg.group === 'stickers') {
      state.stickerGroup.add(obj);
    } else {
      state.cvGroup.add(obj);
    }
  });

  const shakingMeshes = objects.filter(
    (obj, index) => configs[index].group === 'shaking' && obj instanceof THREE.Mesh
  ) as THREE.Mesh[];

  if (shakingMeshes.length > 0) {
    animateShakingElements(shakingMeshes);
  }

  return objects;
}
