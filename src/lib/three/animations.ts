import * as THREE from 'three';
import gsap from 'gsap';

export function animateShakingElements(meshes: THREE.Mesh[]) {
	meshes.forEach((mesh, index) => {
		if (Array.isArray(mesh.material)) return;

		mesh.material.transparent = true;

		const tl = gsap.timeline({
			delay: index * 0.2 + 0.6,
			onComplete: () => {
				mesh.visible = false;
			}
		});

		tl.to(mesh.rotation, {
			keyframes: {
				z: [-0.2, 0, 0.3, -0.3, 0.2, -0.2, 0],
				ease: 'power2.inOut'
			},
			duration: 2
		});

		tl.to(
			mesh.position,
			{
				y: mesh.position.y - 600,
				x: mesh.position.x + (Math.random() - 0.5) * 200,
				duration: 3,
				ease: 'power1.in'
			},
			'>-0.5'
		);

		tl.to(
			mesh.rotation,
			{
				z: (Math.random() - 0.5) * Math.PI,
				duration: 3,
				ease: 'power1.in'
			},
			'<'
		);

		tl.to(
			mesh.material,
			{
				opacity: 0,
				duration: 2.5,
				ease: 'power2.in'
			},
			'>-2.5'
		);
	});
}