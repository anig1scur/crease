<script lang="ts">
  import {onMount, onDestroy} from 'svelte';
  import * as THREE from 'three';
  import CameraControls from 'camera-controls';
  import {imageConfigs, SCENE_CONFIG, type ImageConfig} from '../config';
  import gsap from 'gsap';

  type ThreeState = {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: CameraControls;
    cvGroup: THREE.Group;
    stickerGroup: THREE.Group;
    createdMeshes: THREE.Mesh[];
    animationFrameId?: number;
  };

  let container: HTMLDivElement;
  let threeState: ThreeState | null = null;
  const clock = new THREE.Clock();

  onMount(() => {
    const init = async () => {
      if (!container) return;
      CameraControls.install({THREE: THREE});
      const scene = new THREE.Scene();
      const camera = setupCamera();
      const renderer = setupRenderer(container);
      const controls = setupControls(camera, renderer.domElement);
      await setupBackground(scene, renderer);
      setupLights(scene);

      const cvGroup = new THREE.Group();
      cvGroup.position.set(0, -60, 0);
      scene.add(cvGroup);

      const stickerGroup = new THREE.Group();
      stickerGroup.position.set(-370, 380, 10);
      stickerGroup.scale.set(1.3, 1.3, 1.3);
      cvGroup.add(stickerGroup);

      threeState = {
        scene,
        camera,
        renderer,
        controls,
        cvGroup,
        stickerGroup,
        createdMeshes: [],
      };

      const meshes = await createAllPlanes(imageConfigs, threeState);
      threeState.createdMeshes = meshes;
      startAnimationLoop();
      window.addEventListener('resize', onResize);
    };

    init();

    return () => {
      window.removeEventListener('resize', onResize);
      cleanup();
    };
  });

  onDestroy(() => {
    cleanup();
  });

  function animateShakingElements(meshes: THREE.Mesh[]) {
    meshes.forEach((mesh, index) => {
      if (Array.isArray(mesh.material)) return;

      mesh.material.transparent = true;

      const tl = gsap.timeline({
        delay: index * 0.2 + 1,
        onComplete: () => {
          mesh.visible = false;
        },
      });

      tl.to(mesh.rotation, {
        keyframes: {
          z: [-0.2, 0, 0.3, -0.3, 0.2, -0.2, 0],
          ease: 'power2.inOut',
        },
        duration: 2,
      });

      tl.to(
        mesh.position,
        {
          y: mesh.position.y - 600,
          x: mesh.position.x + (Math.random() - 0.5) * 200,
          duration: 3,
          ease: 'power1.in',
        },
        '>-0.5',
      );

      tl.to(
        mesh.rotation,
        {
          z: (Math.random() - 0.5) * Math.PI,
          duration: 3,
          ease: 'power1.in',
        },
        '<',
      );

      tl.to(
        mesh.material,
        {
          opacity: 0,
          duration: 2.5,
          ease: 'power2.in',
        },
        '>-2.5',
      );
    });
  }

  async function createAllPlanes(configs: ImageConfig[], state: ThreeState): Promise<THREE.Mesh[]> {
    const meshPromises = configs.map((cfg, index) => createPlaneFromConfig(cfg, index, state));
    const meshes = await Promise.all(meshPromises);

    meshes.forEach((mesh, index) => {
      const cfg = configs[index];
      if (cfg.group === 'stickers') {
        state.stickerGroup.add(mesh);
      } else {
        state.cvGroup.add(mesh);
      }
    });

    const shakingMeshes = meshes.filter((_, index) => configs[index].group === 'shaking');
    if (shakingMeshes.length > 0) {
      animateShakingElements(shakingMeshes);
    }

    return meshes;
  }

  function setupCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 0, SCENE_CONFIG.cameraZ);
    return camera;
  }
  function setupRenderer(el: HTMLElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 4));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    el.appendChild(renderer.domElement);
    return renderer;
  }
  async function setupBackground(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    const bgTex = await loadTexture('/wood-texture.png', true, renderer);
    scene.background = bgTex;
  }
  function setupLights(scene: THREE.Scene) {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2.5);
    hemiLight.position.set(0, 1, 0);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(100, 100, 600);
    // dirLight.castShadow = true;
    const {shadowAreaSize, shadowMapSize} = SCENE_CONFIG;
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
  }
  function setupControls(camera: THREE.PerspectiveCamera, domElement: HTMLElement): CameraControls {
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
  async function createPlaneFromConfig(config: ImageConfig, index: number, state: ThreeState): Promise<THREE.Mesh> {
    const {camera, renderer} = state;
    const colorMap = await loadTexture(config.src, true, renderer);
    const img = colorMap.image as HTMLImageElement;
    const naturalAspect = img.width / img.height;
    const worldW = pxToWorldWidth(config.width, config.position.z, camera);
    const worldH = worldW / naturalAspect;
    const segments = config.displacementMapSrc ? 256 : 1;
    const geometry = new THREE.PlaneGeometry(worldW, worldH, segments, segments);
    const materialParams: Partial<THREE.MeshStandardMaterialParameters> = {
      map: colorMap,
      roughness: config.roughness ?? 0.5,
      metalness: config.metalness ?? 0.1,
      transparent: true,
      alphaTest: 0.001,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      shadowSide: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: index * 0.1,
    };
    if (config.normalMapSrc) {
      materialParams.normalMap = await loadTexture(config.normalMapSrc, false, renderer);
      materialParams.normalScale = new THREE.Vector2(config.normalScale ?? 0.6, config.normalScale ?? 0.6);
    }
    if (config.displacementMapSrc) {
      materialParams.displacementMap = await loadTexture(config.displacementMapSrc, false, renderer);
      materialParams.displacementScale = config.displacementScale ?? 50;
    }
    const material = new THREE.MeshStandardMaterial(materialParams);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = index > 0;
    mesh.receiveShadow = index === 0;
    mesh.renderOrder = config.position.z;
    mesh.position.set(config.position.x, config.position.y, config.position.z);
    if (config.rotation) {
      mesh.rotation.set(config.rotation.x ?? 0, config.rotation.y ?? 0, config.rotation.z ?? 0);
    }
    return mesh;
  }
  function pxToWorldWidth(px: number, zWorld: number, camera: THREE.PerspectiveCamera): number {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const dist = Math.abs(SCENE_CONFIG.designCameraZ - zWorld);
    const viewHeightAtZ = 2 * Math.tan(vFov / 2) * dist;
    const pixelsPerWorldUnit = window.innerHeight / viewHeightAtZ;
    return px / pixelsPerWorldUnit;
  }
  async function loadTexture(url: string, isColor: boolean, renderer: THREE.WebGLRenderer): Promise<THREE.Texture> {
    const loader = new THREE.TextureLoader();
    const tex = await loader.loadAsync(url);
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }
  function startAnimationLoop() {
    if (!threeState) return;
    const {renderer, scene, camera, controls} = threeState;
    const animate = () => {
      threeState!.animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      controls.update(delta);
      renderer.render(scene, camera);
    };
    animate();
  }
  function onResize() {
    if (!threeState) return;
    const {camera, renderer} = threeState;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  function cleanup() {
    if (!threeState) return;
    if (threeState.animationFrameId) {
      cancelAnimationFrame(threeState.animationFrameId);
    }
    threeState.controls?.dispose();
    threeState.createdMeshes.forEach((mesh) => {
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => mat.dispose());
      } else {
        mesh.material?.dispose();
      }
    });
    threeState.renderer?.dispose();
    console.log('Three.js scene cleaned up.');
  }
</script>

<div
  bind:this={container}
  class="w-full h-full touch-none"
/>
