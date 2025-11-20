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
    private transformControl: TransformControls;
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    
    public selectedObject: THREE.Object3D | null = null;
    private isClickOnUI: boolean = false;

    constructor(sceneManager: SceneManager, roomManager: RoomManager, uiManager: UIManager) {
        this.sceneManager = sceneManager;
        this.roomManager = roomManager;
        this.uiManager = uiManager;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Setup Controls
        this.orbitControls = new OrbitControls(this.sceneManager.camera, this.sceneManager.renderer.domElement);
        this.orbitControls.enableDamping = true;

        this.transformControl = new TransformControls(this.sceneManager.camera, this.sceneManager.renderer.domElement);
        this.transformControl.setTranslationSnap(1);
        this.transformControl.setRotationSnap(THREE.MathUtils.degToRad(45));
        this.sceneManager.scene.add(this.transformControl);

        this.setupEventListeners();
    }

    public update() {
        this.orbitControls.update();
    }

    private setupEventListeners() {
        // Dragging disables orbit
        (this.transformControl as any).addEventListener('dragging-changed', (event: any) => {
            this.orbitControls.enabled = !event.value;
        });

        // Collision detection during move
        (this.transformControl as any).addEventListener('change', () => {
            if (!(this.transformControl as any).object) return;
            const obj = (this.transformControl as any).object;
            
            // Limits
            const limit = 9;
            if (obj.position.x > limit) obj.position.x = limit;
            if (obj.position.x < -limit) obj.position.x = -limit;
            if (obj.position.z > limit) obj.position.z = limit;
            if (obj.position.z < -limit) obj.position.z = -limit;
            if (obj.position.y < 0) obj.position.y = 0;

            // Collision
            const isColliding = this.roomManager.checkCollisions(obj);
            
            obj.traverse((child: THREE.Object3D) => {
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
        });

        // UI Click detection
        const panel = this.uiManager.getPanelElement();
        panel.addEventListener('mousedown', () => this.isClickOnUI = true);
        panel.addEventListener('mouseup', () => this.isClickOnUI = false);

        // Selection
        window.addEventListener('click', (event) => this.onMouseClick(event));

        // Keyboard shortcuts
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
    }

    private onMouseClick(event: MouseEvent) {
        if (this.isClickOnUI) return;

        // Don't select if we are clicking on a catalog item (handled by onclick in HTML)
        if ((event.target as HTMLElement).closest('.catalog-item')) return;
        if ((event.target as HTMLElement).closest('button')) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        
        const intersects = this.raycaster.intersectObjects(this.roomManager.selectableObjects, true);

        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            let objectToSelect = hitObject;
            while(objectToSelect.parent && objectToSelect.parent.type !== 'Scene') {
                objectToSelect = objectToSelect.parent;
            }

            this.selectObject(objectToSelect);
        } else {
            this.deselectObject();
        }
    }

    public selectObject(object: THREE.Object3D) {
        this.selectedObject = object;
        this.transformControl.attach(object);
        this.uiManager.showPanel();
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

    private onKeyDown(event: KeyboardEvent) {
        switch (event.key.toLowerCase()) {
            case 'r':
                this.transformControl.setMode('rotate');
                break;
            case 't':
                this.transformControl.setMode('translate');
                break;
            case 'delete':
            case 'backspace':
                this.deleteSelectedObject();
                break;
        }
    }
}
