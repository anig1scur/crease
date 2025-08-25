<script lang="ts">
  import {onMount, onDestroy} from 'svelte';
  import * as THREE from 'three';
  import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
  import {CSS3DRenderer, CSS3DObject} from 'three/examples/jsm/renderers/CSS3DRenderer.js';

  type ImageConfig = {
    src: string;
    width: number;
    position: {x: number; y: number; z: number};
    rotation?: {x?: number; y?: number; z?: number};
    group?: string;
  };

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: CSS3DRenderer;
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
    screenshot: '/screenshot.png',
    area_title: '/area_title.png',
    edu_title: '/edu_title.png',
    projects_title: '/projects_title.png',
    techbox_title: '/techbox_title.png',
    work_title: '/work_title.png',
  };

  const imageConfigs: ImageConfig[] = [
    {src: assets.bg, width: 800, position: {x: 0, y: 0, z: 0}},
    {
      src: assets.clip,
      width: 30,
      position: {x: -350, y: 550, z: 20},
    },
    {src: assets.area_title, width: 200, position: {x: -260, y: 450, z: 5}, rotation: {z: -0.02}},
    {src: assets.name_card, width: 480, position: {x: 210, y: 440, z: 10}, rotation: {z: Math.PI / 60}},
    {src: assets.edu_title, width: 210, position: {x: 270, y: 200, z: 5}},
    {src: assets.work_title, width: 330, position: {x: -205, y: 10, z: 5}},
    {src: assets.projects_title, width: 180, position: {x: 285, y: -150, z: 5}},
    {src: assets.screenshot, width: 300, position: {x: 220, y: -440, z: 10}, rotation: {z: 0}},
    {src: assets.techbox_title, width: 260, position: {x: -235, y: -390, z: 5}},

    {
      src: assets.webgl,
      width: 100,
      position: {x: -90, y: -30, z: 0},
      group: 'stickers',
    },
    {src: assets.threejs, width: 100, position: {x: -10, y: 0, z: 8}, rotation: {z: -Math.PI / 20}, group: 'stickers'},
    {src: assets.canvas, width: 100, position: {x: 90, y: 20, z: 2}, rotation: {z: -Math.PI / 10}, group: 'stickers'},
    {src: assets.motion, width: 100, position: {x: 20, y: 70, z: 4}, rotation: {z: Math.PI / 60}, group: 'stickers'},
    {
      src: assets.creative,
      width: 120,
      position: {x: -80, y: 50, z: -2},
      rotation: {z: -Math.PI / 60},
      group: 'stickers',
    },
    {
      src: assets.design,
      width: 120,
      position: {x: -30, y: -75, z: 3},
      rotation: {z: -0.1},
      group: 'stickers',
    },
    {src: assets.math, width: 120, position: {x: 70, y: -50, z: 6}, rotation: {z: Math.PI / 20}, group: 'stickers'},
  ];

  function createImageFromConfig(config: ImageConfig): CSS3DObject {
    const element = document.createElement('img');
    element.src = config.src;
    element.style.width = `${config.width}px`;
    element.style.height = 'auto';
    element.style.willChange = 'transform';
    element.style.transform = 'translateZ(0)';
    element.style.imageRendering = 'crisp-edges';

    const object = new CSS3DObject(element);
    object.position.set(config.position.x, config.position.y, config.position.z);

    if (config.rotation) {
      object.rotation.set(config.rotation.x ?? 0, config.rotation.y ?? 0, config.rotation.z ?? 0);
    }
    return object;
  }

  onMount(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, 800);

    renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enableZoom = true;
    controls.enablePan = true;

    stickerGroup = new THREE.Group();
    stickerGroup.position.set(-220, 220, 10);
    stickerGroup.scale.set(1.1, 1.1, 1.1);
    scene.add(stickerGroup);

    imageConfigs.forEach((config) => {
      const imageObject = createImageFromConfig(config);
      if (config.group === 'stickers') {
        stickerGroup.add(imageObject);
      } else {
        scene.add(imageObject);
      }
    });

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
    };

    window.addEventListener('resize', onResize);

    setTimeout(() => {
      scene.rotation.y += 0.001;
      renderer.render(scene, camera);
      scene.rotation.y -= 0.001;
    }, 100);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  });

  onDestroy(() => {
    if (animateLoop) {
      cancelAnimationFrame(animateLoop);
    }
  });
</script>

<div
  bind:this={container}
  class="w-full h-full scene-container"
/>

<style>
  .scene-container {
    background-image: url('/wood-texture.png');
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
  }
</style>
