import './style.css'
import * as THREE from 'three';
// שים לב: אנחנו מייבאים את הכלים מ-three-stdlib
// זה פותר את בעיית הכפילויות באופן מיידי
import { OrbitControls, TransformControls, GLTFLoader } from 'three-stdlib';

// --- משתנים גלובליים ---
let selectedObject: THREE.Object3D | null = null; 
const panel = document.getElementById('properties-panel') as HTMLElement;
const selectableObjects: THREE.Object3D[] = [];

// --- 1. הקמת הסצנה ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// זווית גבוהה יותר שרואה את כל החדר
camera.position.set(15, 15, 15);
camera.lookAt(0, 0, 0);

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

// הוק שמחבר בין האירועים
transformControl.addEventListener('dragging-changed', (event: any) => {
    orbitControls.enabled = !event.value;
});

// משתני עזר לחישובים (מחוץ ללופ כדי לחסוך זיכרון)
const box1 = new THREE.Box3();
const box2 = new THREE.Box3();

transformControl.addEventListener('change', () => {
    if (!transformControl.object) return;
    
    const obj = transformControl.object;
    
    // --- 1. גבולות החדר (הקוד הקיים) ---
    const limit = 9; 
    if (obj.position.x > limit) obj.position.x = limit;
    if (obj.position.x < -limit) obj.position.x = -limit;
    if (obj.position.z > limit) obj.position.z = limit;
    if (obj.position.z < -limit) obj.position.z = -limit;
    if (obj.position.y < 0) obj.position.y = 0;

    // --- 2. בדיקת התנגשויות (הקוד החדש) ---
    
    // מעדכנים את הקופסה של האובייקט שאנחנו מזיזים כרגע
    box1.setFromObject(obj);
    
    let isColliding = false;

    // עוברים על כל שאר הרהיטים בחדר
    for (const otherObj of selectableObjects) {
        // אנחנו לא בודקים התנגשות עם עצמנו
        if (otherObj === obj) continue;

        // מעדכנים את הקופסה של הרהיט האחר
        box2.setFromObject(otherObj);

        // הבדיקה המתמטית: האם הקופסאות נחתכות?
        if (box1.intersectsBox(box2)) {
            isColliding = true;
            break; // מספיק שפגענו באחד כדי לעצור
        }
    }

    // --- 3. שינוי צבע לפי התוצאה ---
    obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const material = mesh.material as THREE.MeshStandardMaterial;
            
            if (isColliding) {
                // אם יש התנגשות: תפעיל אור אדום פנימי (Emissive)
                material.emissive.setHex(0xff0000);
                material.emissiveIntensity = 0.5;
            } else {
                // אם הכל תקין: כבה את האור האדום (חזור למקור)
                material.emissive.setHex(0x000000);
            }
        }
    });
});
scene.add(transformControl);

// --- 5. לוגיקה של כפתורי צבעים ---
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const colorHexString = target.getAttribute('data-color');
    
    if (selectedObject && colorHexString) {
      const colorValue = parseInt(colorHexString);
      
      selectedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
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
    
    model.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        (node as THREE.Mesh).material = new THREE.MeshStandardMaterial({color: 0xffffff});
      }
    });
    
    scene.add(model);
    selectableObjects.push(model);
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

panel.addEventListener('mousedown', () => isClickOnUI = true);
panel.addEventListener('mouseup', () => isClickOnUI = false);

window.addEventListener('click', (event) => {
  if (isClickOnUI) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(selectableObjects, true);

  if (intersects.length > 0) {
    const hitObject = intersects[0].object;
    
    let objectToSelect = hitObject;
    while(objectToSelect.parent && objectToSelect.parent.type !== 'Scene') {
        objectToSelect = objectToSelect.parent;
    }

    selectedObject = objectToSelect;
    
    panel.classList.remove('hidden');
    transformControl.attach(selectedObject);
    
  } else {
    selectedObject = null;
    panel.classList.add('hidden');
    transformControl.detach();
  }
});

// קיצורי מקלדת
window.addEventListener('keydown', function (event) {
    switch (event.key.toLowerCase()) {
        case 'r':
            transformControl.setMode('rotate');
            break;
        case 't':
            transformControl.setMode('translate');
            break;
        // --- הוספנו את זה: מחיקה ---
        case 'delete':
        case 'backspace':
            if (selectedObject) {
                // 1. מנתקים את כלי השליטה
                transformControl.detach();
                // 2. מסירים מהסצנה
                scene.remove(selectedObject);
                // 3. מסירים מרשימת האובייקטים שאפשר ללחוץ עליהם
                const index = selectableObjects.indexOf(selectedObject);
                if (index > -1) {
                    selectableObjects.splice(index, 1);
                }
                // 4. מאפסים את הבחירה
                selectedObject = null;
                panel.classList.add('hidden');
            }
            break;
    }
});
// --- בניית המעטפת (קירות ורצפה) ---
const createRoom = () => {
    const roomSize = 20;
    const wallHeight = 8;
    const wallThickness = 0.5;

    // חומר לקירות (צבע קרם ניטרלי)
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xfdf5e6 });

    // 1. קיר אחורי
    const backWallGeo = new THREE.BoxGeometry(roomSize + wallThickness * 2, wallHeight, wallThickness);
    const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
    backWall.position.set(0, wallHeight / 2, -roomSize / 2 - wallThickness / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // 2. קיר שמאלי
    const leftWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, roomSize);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMaterial);
    leftWall.position.set(-roomSize / 2 - wallThickness / 2, wallHeight / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // 3. קיר ימני
    const rightWall = leftWall.clone(); // משכפלים את השמאלי
    rightWall.position.x = roomSize / 2 + wallThickness / 2;
    scene.add(rightWall);
    
    // שים לב: אנחנו לא בונים קיר קדמי כדי שאפשר יהיה לראות פנימה!
    
    // 4. שדרוג הרצפה (במקום הרצפה הישנה)
    // נחפש את הרצפה הישנה ונמחוק אותה אם היא מפריעה, או פשוט נעדכן אותה
    // בשלב זה הקוד שלך יוצר רצפה אפורה למטה. בוא נצבע אותה למשהו יפה יותר
    // אם תרצה טקסטורת עץ אמיתית נצטרך לטעון תמונה, כרגע נלך על צבע "פרקט"
    floor.material = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513, // חום פרקט
        roughness: 0.8 
    });
};

// נקרא לפונקציה מיד בהתחלה
createRoom();
// --- 9. לולאת האנימציה ---
function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

transformControl.setTranslationSnap(1); // קפיצות של מטר/יחידה אחת
transformControl.setRotationSnap(THREE.MathUtils.degToRad(45)); // סיבוב ב-45 מעלות
// ... (אחרי כל הקוד הקיים)

// פונקציה לטעינת מודל חדש
// הגדרת טיפוס לנתונים שנשמור
interface SavedItem {
    model: string;
    position: { x: number, y: number, z: number };
    rotation: { x: number, y: number, z: number };
    color: number;
}

// פונקציה משודרגת שיודעת לקבל גם מיקום וצבע (אופציונלי)
const addItem = (filename: string, savedData: SavedItem | null = null) => {
  const loader = new GLTFLoader();
  loader.load(`/models/${filename}`, (gltf) => {
      const model = gltf.scene;
      model.scale.set(3, 3, 3);
      
      // שמירת השם של המודל בתוך האובייקט כדי שנדע לשמור אותו אח"כ
      model.userData.filename = filename;

      if (savedData) {
          // אם זה טעינה משמירה - שים אותו איפה שהוא היה
          model.position.set(savedData.position.x, savedData.position.y, savedData.position.z);
          model.rotation.set(savedData.rotation.x, savedData.rotation.y, savedData.rotation.z);
      } else {
          // אם זה חדש - שים במרכז
          model.position.set(0, 0, 0);
      }

      model.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // שחזור צבע
          const color = savedData ? savedData.color : 0xffffff;
          (node as THREE.Mesh).material = new THREE.MeshStandardMaterial({color: color});
        }
      });
      
      scene.add(model);
      selectableObjects.push(model);
      
      // אם זה חדש, ישר נבחר אותו. אם זה טעינה, לא נבחר.
      if (!savedData) {
          selectedObject = model;
          transformControl.attach(model);
          panel.classList.remove('hidden');
      }
    }, 
    undefined, 
    (err) => console.error(err)
  );
};
(window as any).addItem = addItem;

// חושפים את הפונקציה לחלון הדפדפן כדי שה-HTML יכיר אותה
(window as any).addItem = addItem;


// --- // --- פונקציית שמירה (מול השרת) ---
const saveRoom = async () => {
    const dataToSave: SavedItem[] = [];

    selectableObjects.forEach(obj => {
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

    // שליחה ל-Backend
    try {
        await fetch('http://localhost:3000/api/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
        });
        alert('העיצוב נשמר ב-Redis בהצלחה!');
    } catch (e) {
        console.error(e);
        alert('שגיאה בשמירה לשרת');
    }
};
(window as any).saveRoom = saveRoom;

// --- פונקציית טעינה (מול השרת) ---
const loadRoom = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/room');
        const savedItems: SavedItem[] = await response.json();

        if (savedItems && savedItems.length > 0) {
            console.log('Loading from Redis...');
            savedItems.forEach(item => {
                addItem(item.model, item);
            });
        } else {
            console.log('Room empty, loading default chair...');
            addItem('chair.glb');
        }
    } catch (e) {
        console.error('Error connecting to backend, loading offline mode...');
        addItem('chair.glb');
    }
};

loadRoom();