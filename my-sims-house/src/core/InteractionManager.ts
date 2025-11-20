import * as THREE from 'three';
import { OrbitControls, TransformControls } from 'three-stdlib';
import { SceneManager } from './SceneManager';
import { RoomManager } from './RoomManager';
import { UIManager } from '../ui/UIManager';

export class InteractionManager {
    private sceneManager: SceneManager;
    private roomManager: RoomManager;
    private uiManager: UIManager;
    
    private orbitControls: OrbitControls;
    private transformControl: TransformControls; // Keeping for rotation only
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    
    public selectedObject: THREE.Object3D | null = null;
    private isClickOnUI: boolean = false;

    // Dragging State
    private isDragging: boolean = false;
    private dragPlane: THREE.Plane;
    private dragOffset: THREE.Vector3;
    private intersectionPoint: THREE.Vector3;

    constructor(sceneManager: SceneManager, roomManager: RoomManager, uiManager: UIManager) {
        this.sceneManager = sceneManager;
        this.roomManager = roomManager;
        this.uiManager = uiManager;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Setup Dragging Helpers
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Floor plane normal up
        this.dragOffset = new THREE.Vector3();
        this.intersectionPoint = new THREE.Vector3();

        // Setup Controls
        this.orbitControls = new OrbitControls(this.sceneManager.camera, this.sceneManager.renderer.domElement);
        this.orbitControls.enableDamping = true;

        // We keep TransformControls ONLY for rotation if needed, or we can hide it for now
        this.transformControl = new TransformControls(this.sceneManager.camera, this.sceneManager.renderer.domElement);
        this.transformControl.setRotationSnap(THREE.MathUtils.degToRad(45));
        this.transformControl.setMode('rotate'); // Default to rotate
        this.transformControl.showX = false; // Hide translation arrows
        this.transformControl.showY = false;
        this.transformControl.showZ = false;
        // We only want the rotation ring
        this.sceneManager.scene.add(this.transformControl);

        this.setupEventListeners();
    }

    public update() {
        this.orbitControls.update();
    }

    private setupEventListeners() {
        const canvas = this.sceneManager.renderer.domElement;

        // UI Click detection
        const panel = this.uiManager.getPanelElement();
        panel.addEventListener('mousedown', () => this.isClickOnUI = true);
        panel.addEventListener('mouseup', () => this.isClickOnUI = false);

        // Mouse Events for Dragging
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Keyboard shortcuts
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        
        // TransformControl events (for rotation)
        this.transformControl.addEventListener('dragging-changed', (event: any) => {
            this.orbitControls.enabled = !event.value;
        });
    }

    private getIntersects(event: MouseEvent, objects: THREE.Object3D[]) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        return this.raycaster.intersectObjects(objects, true);
    }

    private onMouseDown(event: MouseEvent) {
        if (this.isClickOnUI) return;
        if ((event.target as HTMLElement).closest('.catalog-item')) return;
        if ((event.target as HTMLElement).closest('button')) return;

        // 1. Check if we clicked an object
        const intersects = this.getIntersects(event, this.roomManager.selectableObjects);

        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            let objectToSelect = hitObject;
            while(objectToSelect.parent && objectToSelect.parent.type !== 'Scene') {
                objectToSelect = objectToSelect.parent;
            }

            this.selectObject(objectToSelect);

            // 2. Start Dragging
            this.isDragging = true;
            this.orbitControls.enabled = false; // Disable camera move

            // Calculate offset so object doesn't jump to mouse center
            if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint)) {
                this.dragOffset.copy(this.intersectionPoint).sub(this.selectedObject!.position);
            }
        } else {
            // Deselect if clicked on nothing (but not if dragging started)
            this.deselectObject();
        }
    }

    private onMouseMove(event: MouseEvent) {
        if (!this.isDragging || !this.selectedObject) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

        if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint)) {
            // New position minus offset
            const targetPos = this.intersectionPoint.clone().sub(this.dragOffset);
            
            // Grid Snapping (Round to nearest 1)
            targetPos.x = Math.round(targetPos.x);
            targetPos.z = Math.round(targetPos.z);
            targetPos.y = 0; // Keep on floor

            // Limits
            const limit = 9;
            if (targetPos.x > limit) targetPos.x = limit;
            if (targetPos.x < -limit) targetPos.x = -limit;
            if (targetPos.z > limit) targetPos.z = limit;
            if (targetPos.z < -limit) targetPos.z = -limit;

            this.selectedObject.position.copy(targetPos);

            // Collision Check
            this.checkCollision(this.selectedObject);
        }
    }

    private onMouseUp(event: MouseEvent) {
        this.isDragging = false;
        this.orbitControls.enabled = true;
    }

    private checkCollision(obj: THREE.Object3D) {
        const isColliding = this.roomManager.checkCollisions(obj);
        obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                const material = mesh.material as THREE.MeshStandardMaterial;
                if (isColliding) {
                    material.emissive.setHex(0xff0000);
                    material.emissiveIntensity = 0.5;
                } else {
                    material.emissive.setHex(0x000000);
                }
            }
        });
    }

    public selectObject(object: THREE.Object3D) {
        if (this.selectedObject !== object) {
            this.selectedObject = object;
            this.transformControl.attach(object);
            this.uiManager.showPanel();
        }
    }

    public deselectObject() {
        this.selectedObject = null;
        this.transformControl.detach();
        this.uiManager.hidePanel();
    }

    public deleteSelectedObject() {
        if (this.selectedObject) {
            this.transformControl.detach();
            this.roomManager.removeItem(this.selectedObject);
            this.selectedObject = null;
            this.uiManager.hidePanel();
        }
    }

    public rotateSelectedObject(angle: number) {
        if (this.selectedObject) {
            this.selectedObject.rotation.y += angle;
        }
    }

    private onKeyDown(event: KeyboardEvent) {
        switch (event.key.toLowerCase()) {
            case 'r':
                this.rotateSelectedObject(Math.PI / 2);
                break;
            case 'arrowleft':
                this.rotateSelectedObject(Math.PI / 2);
                break;
            case 'arrowright':
                this.rotateSelectedObject(-Math.PI / 2);
                break;
            case 'delete':
            case 'backspace':
                this.deleteSelectedObject();
                break;
        }
    }
}
