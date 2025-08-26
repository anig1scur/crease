import * as THREE from 'three';
import { SCENE_CONFIG } from '$lib/config';

export async function loadTexture(
	url: string,
	isColor: boolean,
	renderer: THREE.WebGLRenderer
): Promise<THREE.Texture> {
	const loader = new THREE.TextureLoader();
	const tex = await loader.loadAsync(url);
	if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
	tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
	return tex;
}

export function pxToWorldWidth(
	px: number,
	zWorld: number,
	camera: THREE.PerspectiveCamera
): number {
	const vFov = THREE.MathUtils.degToRad(camera.fov);
	const dist = Math.abs(SCENE_CONFIG.designCameraZ - zWorld);
	const viewHeightAtZ = 2 * Math.tan(vFov / 2) * dist;
	const pixelsPerWorldUnit = window.innerHeight / viewHeightAtZ;
	return px / pixelsPerWorldUnit;
}