
//import * as THREE from "three"
import {
    Object3D, Mesh, Camera, MeshBasicMaterial, TextureLoader,
    DoubleSide, PlaneGeometry, OrthographicCamera, Vector3,
    Vector2, Raycaster, WebGLRenderer, Scene
} from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { changeView } from '../commands'

export function installNavigationCube(
    {scene, camera, controls, renderer}:
    {scene: Scene, camera: Camera, controls: TrackballControls, renderer: WebGLRenderer}
)
{
    return new NavigationCube({scene, camera, controls, renderer})
}

class NavigationCube extends Object3D {
	constructor(
        {scene, camera, controls, renderer}:
        {scene: Scene, camera: Camera, controls: TrackballControls, renderer: WebGLRenderer}
    ) {
		super()

        this.scene     = scene
        this.scamera   = camera
        this.scontrols = controls
        this.renderer  = renderer

		let createPlaneMaterial = (img) => {
			let material = new MeshBasicMaterial( {
				depthTest: true, 
				depthWrite: true,
				side: DoubleSide
			})
			new TextureLoader().load(
				/*exports.resourcePath + */'/assets/camera/xyz/' + img,
				function(texture) {
					texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
					material.map = texture
					material.needsUpdate = true
				})
			return material
		};

		let planeGeometry = new PlaneGeometry(1, 1);

		this.front = new Mesh(planeGeometry, createPlaneMaterial('yPos.png'));
		this.front.position.y = -0.5;
		this.front.rotation.x = Math.PI / 2.0;
		this.front.updateMatrixWorld();
		this.front.name = "south";
		super.add(this.front);

		this.back = new Mesh(planeGeometry, createPlaneMaterial('yNeg.png'));
		this.back.position.y = 0.5;
		this.back.rotation.x = Math.PI / 2.0;
		this.back.updateMatrixWorld();
		this.back.name = "north";
		super.add(this.back);

		this.left = new Mesh(planeGeometry, createPlaneMaterial('xNeg.png'));
		this.left.position.x = -0.5;
		this.left.rotation.y = Math.PI / 2.0;
		this.left.updateMatrixWorld();
		this.left.name = "east";
		super.add(this.left);

		this.right = new Mesh(planeGeometry, createPlaneMaterial('xPos.png'));
		this.right.position.x = 0.5;
		this.right.rotation.y = Math.PI / 2.0;
		this.right.updateMatrixWorld();
		this.right.name = "west";
		super.add(this.right);

		this.bottom = new Mesh(planeGeometry, createPlaneMaterial('zNeg.png'));
		this.bottom.position.z = -0.5;
		this.bottom.updateMatrixWorld();
		this.bottom.name = "up";
		super.add(this.bottom);

		this.top = new Mesh(planeGeometry, createPlaneMaterial('zPos.png'));
		this.top.position.z = 0.5;
		this.top.updateMatrixWorld();
		this.top.name = "down";
		super.add(this.top);

		this.width = 150; // in px

		this.camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1);
		this.camera.position.copy(new Vector3(0, 0, 0));
		this.camera.lookAt(new Vector3(0, 1, 0));
		this.camera.updateMatrixWorld();
		this.camera.rotation.order = "ZXY";

		let onMouseDown = (event) => {
			if (!super.visible) {
				return;
			}
			
			this.pickedFace = null;
			let mouse = new Vector2();
			mouse.x = event.clientX - (window.innerWidth - this.width);
			mouse.y = event.clientY;

			if(mouse.x < 0 || mouse.y > this.width) return;

			mouse.x = (mouse.x / this.width) * 2 - 1;
			mouse.y = -(mouse.y / this.width) * 2 + 1;

			let raycaster = new Raycaster();
			raycaster.setFromCamera(mouse, this.camera);
			raycaster.ray.origin.sub(this.camera.getWorldDirection(new Vector3()));

			let intersects = raycaster.intersectObjects(super.children);

			let minDistance = 1000;
			for (let i = 0; i < intersects.length; i++) {
				if(intersects[i].distance < minDistance) {
					this.pickedFace = intersects[i].object.name;
					minDistance = intersects[i].distance;
				}
			}
			
			if (this.pickedFace) {
				//this.viewer.setView(this.pickedFace);
                changeView(this.pickedFace.name, {scene: this.scene, camera: this.scamera, controls: this.scontrols})
			}
		};

		this.renderer.domElement.addEventListener('mousedown', onMouseDown, false);
	}

	update() {
		this.camera.rotation.copy(this.scamera.rotation)
		this.camera.updateMatrixWorld()
	}

    // -----------------------------------------------------

    front: Mesh
    back: Mesh
    left: Mesh
    right: Mesh
    bottom: Mesh
    top: Mesh
    width: number
    camera: Camera
    pickedFace: Mesh

    scene: Scene
    scamera: Camera
    scontrols: TrackballControls
    renderer: WebGLRenderer

}