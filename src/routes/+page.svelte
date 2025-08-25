<script lang="ts">
  import {onMount, onDestroy} from 'svelte';
  import * as THREE from 'three';
  import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

  type Vec3 = {x: number; y: number; z: number};
  type EulerLike = {x?: number; y?: number; z?: number};

  type ImageConfig = {
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

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let animateLoop: number;
  let stickerGroup: THREE.Group;

  const assets = {
    bg: '/bg.png',
    clip: '/clip.png',
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

  const imageConfigs: ImageConfig[] = [
    {src: assets.bg, width: 800, position: {x: 0, y: 0, z: 0}, roughness: 1, metalness: 0},
    {src: assets.clip, width: 50, position: {x: -580, y: 860, z: 20}},
    {src: assets.name_card, width: 500, position: {x: 380, y: 750, z: 10}, rotation: {z: Math.PI / 60}},
    {src: assets.area_title, width: 200, position: {x: -450, y: 690, z: 5}},
    {src: assets.edu_title, width: 210, position: {x: 460, y: 400, z: 5}},
    {src: assets.work_title, width: 340, position: {x: -350, y: 80, z: 5}},
    {src: assets.projects_title, width: 185, position: {x: 480, y: -200, z: 5}},
    {src: assets.screenshot, width: 280, position: {x: 400, y: -690, z: 10}},
    {src: assets.meidi, width: 85, position: {x: 230, y: -200, z: 10}},
    {src: assets.techbox_title, width: 260, position: {x: -410, y: -620, z: 5}},

    {src: assets.webgl, width: 100, position: {x: -120, y: -50, z: -2}, group: 'stickers', normalScale: 0.7},
    {src: assets.threejs, width: 100, position: {x: 0, y: 0, z: 8}, rotation: {z: -Math.PI / 20}, group: 'stickers'},
    {src: assets.canvas, width: 100, position: {x: 160, y: 10, z: 2}, rotation: {z: -Math.PI / 60}, group: 'stickers'},
    {src: assets.motion, width: 120, position: {x: 60, y: 100, z: 4}, rotation: {z: Math.PI / 60}, group: 'stickers'},
    {
      src: assets.creative,
      width: 120,
      position: {x: -120, y: 70, z: 0},
      rotation: {z: -Math.PI / 60},
      group: 'stickers',
      displacementScale: 0.5,
    },
    {src: assets.design, width: 120, position: {x: 0, y: -120, z: 3}, rotation: {z: -0.1}, group: 'stickers'},
    {src: assets.math, width: 120, position: {x: 130, y: -90, z: 6}, rotation: {z: Math.PI / 20}, group: 'stickers'},
  ];

  const createdPlanes: {
    mesh: THREE.Mesh;
    config: ImageConfig;
    naturalAspect: number; // w/h
  }[] = [];

  function pxToWorldWidth(px: number, zWorld: number): number {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const dist = Math.abs(camera.position.z - zWorld);
    const viewHeightAtZ = 2 * Math.tan(vFov / 2) * dist; // world units
    const pixelsPerWorldUnit = window.innerHeight / viewHeightAtZ;
    return px / pixelsPerWorldUnit;
  }

  function pixelLikeToWorld(p: Vec3): THREE.Vector3 {
    return new THREE.Vector3(p.x, p.y, p.z);
  }

  async function loadTexture(url: string, isColor = false): Promise<THREE.Texture> {
    const loader = new THREE.TextureLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (tex) => {
          if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          // tex.generateMipmaps = false;
          // tex.minFilter = THREE.LinearFilter;
          // tex.magFilter = THREE.LinearFilter;

          tex.minFilter = THREE.NearestFilter;
          tex.magFilter = THREE.NearestFilter;

          tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
          resolve(tex);
        },
        undefined,
        reject,
      );
    });
  }

  async function createPlaneFromConfig(config: ImageConfig, indexForOffset: number): Promise<THREE.Mesh> {
    const colorMap = await loadTexture(config.src, true);

    const img = colorMap.image as HTMLImageElement;
    const naturalAspect = img.width / img.height;

    const worldW = pxToWorldWidth(config.width, config.position.z);
    const worldH = worldW / naturalAspect;

    const segments = config.displacementMapSrc ? 128 : 1;
    const geo = new THREE.PlaneGeometry(worldW, worldH, segments, segments);

    const mats: Partial<THREE.MeshStandardMaterialParameters> = {
      map: colorMap,
      roughness: config.roughness ?? 0.4,
      metalness: config.metalness ?? 0.1,
      transparent: true,
      alphaTest: 0.001,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: 0,
      polygonOffsetUnits: indexForOffset * 0.1,
    };

    if (config.normalMapSrc) {
      mats.normalMap = await loadTexture(config.normalMapSrc);
      mats.normalScale = new THREE.Vector2(config.normalScale ?? 1, config.normalScale ?? 1);
    }
    if (config.displacementMapSrc) {
      mats.displacementMap = await loadTexture(config.displacementMapSrc);
      mats.displacementScale = config.displacementScale ?? 0;
      mats.displacementBias = 0;
    }

    const mat = new THREE.MeshStandardMaterial(mats);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = config.position.z;

    const wp = pixelLikeToWorld(config.position);
    mesh.position.set(wp.x, wp.y, wp.z);

    if (config.rotation) {
      mesh.rotation.set(config.rotation.x ?? 0, config.rotation.y ?? 0, config.rotation.z ?? 0);
    }

    createdPlanes.push({mesh, config, naturalAspect});
    return mesh;
  }

  function reflowPlanesOnResize() {
    for (const {mesh, config, naturalAspect} of createdPlanes) {
      const worldW = pxToWorldWidth(config.width, config.position.z);
      const worldH = worldW / naturalAspect;

      const hasDisp = !!config.displacementMapSrc;
      const segments = hasDisp ? 128 : 1;
      const newGeo = new THREE.PlaneGeometry(worldW, worldH, segments, segments);
      mesh.geometry.dispose();
      mesh.geometry = newGeo;

      const wp = pixelLikeToWorld(config.position);
      mesh.position.set(wp.x, wp.y, wp.z);
    }
  }

  onMount(async () => {
    scene = new THREE.Scene();

    {
      const loader = new THREE.TextureLoader();
      const bgTex = await new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          '/wood-texture.png',
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = 8;
            resolve(t);
          },
          undefined,
          reject,
        );
      });
      scene.background = bgTex;
    }

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 0, 800);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.enablePan = true;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    hemi.position.set(0, 1, 0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(400, 0, 600);
    dir.castShadow = false;
    scene.add(dir);

    stickerGroup = new THREE.Group();
    stickerGroup.position.set(-400, 380, 10);
    stickerGroup.scale.set(1.2, 1.2, 1.2);
    scene.add(stickerGroup);

    let index = 0;
    for (const cfg of imageConfigs) {
      const mesh = await createPlaneFromConfig(cfg, index++);
      if (cfg.group === 'stickers') stickerGroup.add(mesh);
      else scene.add(mesh);
    }

    const animate = () => {
      animateLoop = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      reflowPlanesOnResize();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  });

  onDestroy(() => {
    if (animateLoop) cancelAnimationFrame(animateLoop);
    createdPlanes.forEach(({mesh}) => {
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material;
      mat?.dispose();
    });
    renderer?.dispose();
  });
</script>

<div
  bind:this={container}
  class="w-full h-full"
/>
