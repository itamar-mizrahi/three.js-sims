import './style.css';
import * as THREE from 'three';
import { SceneManager } from './core/SceneManager';
import { RoomManager } from './core/RoomManager';
import { InteractionManager } from './core/InteractionManager';
import { NetworkManager, type SavedItem } from './core/NetworkManager';
import { UIManager } from './ui/UIManager';

// --- Initialization ---
const sceneManager = new SceneManager();
const uiManager = new UIManager();
const roomManager = new RoomManager(sceneManager);
const interactionManager = new InteractionManager(sceneManager, roomManager, uiManager);
const networkManager = new NetworkManager();

// --- Wiring ---

// Handle Color Change from UI
uiManager.setOnColorChange((colorValue) => {
    if (interactionManager.selectedObject) {
        interactionManager.selectedObject.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).color.setHex(colorValue);
            }
        });
    }
});

// Handle Delete from UI
uiManager.setOnDelete(() => {
    interactionManager.deleteSelectedObject();
});

// --- Global Functions for HTML ---

// Add Item
const addItem = (filename: string, savedData: SavedItem | null = null) => {
    roomManager.addItem(filename, savedData, (model) => {
        // If it's a new item (not loaded from save), select it immediately
        if (!savedData) {
            interactionManager.selectObject(model);
        }
    });
};
(window as any).addItem = addItem;

// Save Room
const saveRoom = async () => {
    const dataToSave: SavedItem[] = [];

    roomManager.selectableObjects.forEach(obj => {
        let color = 0xffffff;
        obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                color = ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).color.getHex();
            }
        });

        dataToSave.push({
            model: obj.userData.filename,
            position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
            rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
            color: color
        });
    });

    await networkManager.saveRoom(dataToSave);
};
(window as any).saveRoom = saveRoom;

// --- Initial Load ---
const loadRoom = async () => {
    const savedItems = await networkManager.loadRoom();
    
    if (savedItems && savedItems.length > 0) {
        console.log('Loading from Redis...');
        savedItems.forEach(item => {
            addItem(item.model, item);
        });
    } else {
        console.log('Room empty, loading default chair...');
        addItem('chair.glb');
    }
};

loadRoom();

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    interactionManager.update();
    sceneManager.render();
}

animate();