import * as THREE from 'three';
import { assetsConfig } from '$lib/config';
import type { ThreeState } from './types';
import { pxToWorldWidth } from './utils';
import { setupCamera, setupRenderer, setupBackground, setupLights, setupControls } from './setup';
import { createAllPlanes } from './meshFactory';

export function initializeScene(container: HTMLDivElement) {
  let threeState: ThreeState | null = null;
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const startAnimationLoop = () => {
    if (!threeState) return;
    const { renderer, scene, camera, controls } = threeState;
    const animate = () => {
      threeState!.animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      controls.update(delta);
      renderer.render(scene, camera);
    };
    animate();
  };

  const onResize = () => {
    if (!threeState) return;
    const { camera, renderer } = threeState;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  const handleCanvasClick = (event: MouseEvent) => {
    if (!threeState) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, threeState.camera);

    const interactiveObjects = threeState.createdMeshes.filter(
      (obj) => obj.userData.isVideo || obj.userData.href
    );
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      const firstObject = intersects[0].object as THREE.Mesh;
      const target = firstObject.parent?.userData.isVideo ? firstObject.parent : firstObject;

      if (target.userData.href) {
        window.open(target.userData.href, '_blank');
        return;
      }

      if (target.userData.isVideo && !target.userData.isPlaying) {
        const { videoElement, videoTexture } = target.userData;
        if (firstObject.material instanceof THREE.MeshStandardMaterial) {
          firstObject.material.map = videoTexture;
          firstObject.material.needsUpdate = true;
        }
        videoElement.play().catch((e: Error) => console.error('Video playback failed:', e));
        target.userData.isPlaying = true;
      }
    }

  };

  const handleCanvasHover = (event: MouseEvent) => {
    if (!threeState) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, threeState.camera);

    const interactiveObjects = threeState.createdMeshes.filter(
      (obj) => obj.userData.isVideo || obj.userData.href
    );
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      container.style.cursor = 'pointer';
    } else {
      container.style.cursor = 'default';
    }
  };


  const init = async () => {
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = setupCamera();
    const renderer = setupRenderer(container);
    const controls = setupControls(camera, renderer.domElement);
    await setupBackground(scene, renderer);
    setupLights(scene);

    const cvGroup = new THREE.Group();
    const cvGroupY = pxToWorldWidth(-40, 0, camera);
    cvGroup.position.set(0, cvGroupY, 0);
    scene.add(cvGroup);

    const stickerGroup = new THREE.Group();
    const stickerGroupX = pxToWorldWidth(-220, 10, camera);
    const stickerGroupY = pxToWorldWidth(250, 10, camera);
    stickerGroup.position.set(stickerGroupX, stickerGroupY, 10);

    stickerGroup.scale.set(1.3, 1.3, 1.3);
    cvGroup.add(stickerGroup);

    threeState = {
      scene,
      camera,
      renderer,
      controls,
      cvGroup,
      stickerGroup,
      createdMeshes: []
    };

    const meshes = await createAllPlanes(assetsConfig, threeState);
    threeState.createdMeshes = meshes;

    startAnimationLoop();
    window.addEventListener('resize', onResize);
    container.addEventListener('click', handleCanvasClick);
    container.addEventListener('mousemove', handleCanvasHover);

  };

  const destroy = () => {
    if (!threeState) return;
    window.removeEventListener('resize', onResize);
    container.removeEventListener('click', handleCanvasClick);
    container.removeEventListener('mousemove', handleCanvasHover);

    if (threeState.animationFrameId) {
      cancelAnimationFrame(threeState.animationFrameId);
    }
    threeState.controls?.dispose();
    threeState.createdMeshes.forEach((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material?.dispose();
        }
      }
    });
    threeState.renderer?.dispose();
  };

  init();

  return { destroy };
}