import './style.css' // מוודא שהסטייל נטען
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// 1. יצירת הסצנה
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0); // אפור בהיר מאוד

// 2. מצלמה
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 3, 5); // זווית טובה מלמעלה

// 3. רינדור
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // הפעלת צללים
document.body.appendChild(renderer.domElement);

// 4. תאורה (חשוב מאוד!)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // אור כללי
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5); // שמש
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// 5. שליטה עם העכבר
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 6. טעינת המודל (הכיסא שבחרת)
const loader = new GLTFLoader();

loader.load(
  '/models/chair.glb', // וודא שגררת את הקובץ הזה לתיקיית public/models
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(3, 3, 3); // הגדלתי אותו קצת שיהיה ברור
    
    // הפעלת צללים על המודל
    model.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    
    // ממקם אותו במרכז
    model.position.set(0, 0, 0);
    scene.add(model);
    console.log('Chair loaded!');
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
  }
);

// 7. רצפה (כדי שנראה צל)
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // משכיבים את הרצפה
floor.receiveShadow = true;
scene.add(floor);

// רשת עזר
const grid = new THREE.GridHelper(20, 20);
scene.add(grid);

// 8. אנימציה
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// התאמה לחלון
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();