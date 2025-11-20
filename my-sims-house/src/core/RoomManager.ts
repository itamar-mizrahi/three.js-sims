import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { SceneManager } from './SceneManager';
import type { SavedItem } from './NetworkManager';

export class RoomManager {
    private sceneManager: SceneManager;
    public selectableObjects: THREE.Object3D[] = [];
    private loader: GLTFLoader;

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
        this.loader = new GLTFLoader();
        
        this.createRoom();
    }

    private createRoom() {
        const roomSize = 20;
        const wallHeight = 8;
        const wallThickness = 0.5;
        const scene = this.sceneManager.scene;

        // Walls
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xfdf5e6 });

        const backWallGeo = new THREE.BoxGeometry(roomSize + wallThickness * 2, wallHeight, wallThickness);
        const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
        backWall.position.set(0, wallHeight / 2, -roomSize / 2 - wallThickness / 2);
        backWall.receiveShadow = true;
        scene.add(backWall);

        const leftWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, roomSize);
        const leftWall = new THREE.Mesh(leftWallGeo, wallMaterial);
        leftWall.position.set(-roomSize / 2 - wallThickness / 2, wallHeight / 2, 0);
        leftWall.receiveShadow = true;
        scene.add(leftWall);

        const rightWall = leftWall.clone();
        rightWall.position.x = roomSize / 2 + wallThickness / 2;
        scene.add(rightWall);

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, 
            roughness: 0.8 
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Grid
        const grid = new THREE.GridHelper(20, 20);
        scene.add(grid);
    }

    public addItem(filename: string, savedData: SavedItem | null = null, onLoaded?: (model: THREE.Object3D) => void) {
        this.loader.load(`/models/${filename}`, (gltf) => {
            const model = gltf.scene;
            model.scale.set(3, 3, 3);
            model.userData.filename = filename;

            if (savedData) {
                model.position.set(savedData.position.x, savedData.position.y, savedData.position.z);
                model.rotation.set(savedData.rotation.x, savedData.rotation.y, savedData.rotation.z);
            } else {
                model.position.set(0, 0, 0);
            }

            model.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    const color = savedData ? savedData.color : 0xffffff;
                    (node as THREE.Mesh).material = new THREE.MeshStandardMaterial({ color: color });
                }
            });

            this.sceneManager.scene.add(model);
            this.selectableObjects.push(model);

            if (onLoaded) onLoaded(model);
        }, undefined, (err) => console.error('Error loading model:', err));
    }

    public removeItem(object: THREE.Object3D) {
        this.sceneManager.scene.remove(object);
        const index = this.selectableObjects.indexOf(object);
        if (index > -1) {
            this.selectableObjects.splice(index, 1);
        }
    }

    public checkCollisions(movingObject: THREE.Object3D): boolean {
        const box1 = new THREE.Box3().setFromObject(movingObject);
        const box2 = new THREE.Box3();

        for (const otherObj of this.selectableObjects) {
            if (otherObj === movingObject) continue;
            box2.setFromObject(otherObj);
            if (box1.intersectsBox(box2)) {
                return true;
            }
        }
        return false;
    }
}
