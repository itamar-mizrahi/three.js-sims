import './style.css'
import * as THREE from 'three';
// שים לב: הסיומת .js בסוף היא קריטית כדי למנוע את השגיאה שהייתה לך
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

// --- משתנים גלובליים ---
let selectedObject: THREE.Object3D | null = null; 
const panel = document.getElementById('properties-panel') as HTMLElement;
const selectableObjects: THREE.Object3D[] = [];

// --- 1. הקמת הסצנה ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 2. תאורה ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// --- 3. בקרת צפייה (OrbitControls) ---
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

// --- 4. כלי ההזזה (TransformControls) ---
const transformControl = new TransformControls(camera, renderer.domElement);

// כשאנחנו גוררים רהיט, אנחנו משביתים את סיבוב המצלמה כדי לא להשתגע
transformControl.addEventListener('dragging-changed', function (event) {
    orbitControls.enabled = !event.value;
});
scene.add(transformControl);

// --- 5. לוגיקה של כפתורי צבעים ---
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const colorHexString = target.getAttribute('data-color');
    
    if (selectedObject && colorHexString) {
      const colorValue = parseInt(colorHexString);
      
      // פונקציה שצובעת את כל החלקים של המודל (כי לפעמים מודל מורכב מכמה חלקים)
      selectedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
           // כאן אנחנו מוודאים שאנחנו לא דורסים טקסטורות אם יש, אלא רק צבע
           ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).color.setHex(colorValue);
        }
      });
    }
  });
});

// --- 6. טעינת המודל ---
const loader = new GLTFLoader();
loader.load('/models/chair.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(3, 3, 3);
    
    // הגדרות צל וחומר ראשוני
    model.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // יוצרים חומר חדש ונקי שאפשר לצבוע בקלות
        (node as THREE.Mesh).material = new THREE.MeshStandardMaterial({color: 0xffffff});
      }
    });
    
    scene.add(model);
    selectableObjects.push(model); // מוסיפים לרשימת הדברים שאפשר לבחור
    console.log('Chair loaded');
  }, 
  undefined, 
  (err) => console.error('Error loading model:', err)
);

// --- 7. רצפה וגריד ---
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(20, 20);
scene.add(grid);

// --- 8. לוגיקה של בחירה (Raycasting) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isClickOnUI = false;

// מניעת לחיצה דרך הפאנל
panel.addEventListener('mousedown', () => isClickOnUI = true);
panel.addEventListener('mouseup', () => isClickOnUI = false);

window.addEventListener('click', (event) => {
  if (isClickOnUI) return; // אם לחצנו על התפריט, תתעלם

  // חישוב מיקום עכבר
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  
  // true אומר: תבדוק גם את הילדים של האובייקטים (רגליים של כיסא וכו')
  const intersects = raycaster.intersectObjects(selectableObjects, true);

  if (intersects.length > 0) {
    // מצאנו משהו! אבל זה כנראה חלק קטן מהכיסא
    const hitObject = intersects[0].object;
    
    // אנחנו צריכים לטפס למעלה בהיררכיה כדי למצוא את "האבא" הראשי (הכיסא השלם)
    let objectToSelect = hitObject;
    while(objectToSelect.parent && objectToSelect.parent.type !== 'Scene') {
        objectToSelect = objectToSelect.parent;
    }

    selectedObject = objectToSelect;
    
    // הצג את הפאנל וחבר את כלי ההזזה
    panel.classList.remove('hidden');
    transformControl.attach(selectedObject);
    
  } else {
    // לחצנו על ריק/רצפה
    selectedObject = null;
    panel.classList.add('hidden');
    transformControl.detach();
  }
});

// קיצורי מקלדת: T להזזה, R לסיבוב
window.addEventListener('keydown', function (event) {
    switch (event.key.toLowerCase()) {
        case 'r':
            transformControl.setMode('rotate');
            break;
        case 't':
            transformControl.setMode('translate');
            break;
    }
});

// --- 9. לולאת האנימציה ---
function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, camera);
}

// טיפול בשינוי גודל חלון
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();