// import the Three.js module:

import * as THREE from "https://cdn.skypack.dev/three/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js";
import Stats from "https://cdn.skypack.dev/three/examples/jsm/libs/stats.module";
import { GUI } from "https://cdn.skypack.dev/three/examples/jsm/libs/dat.gui.module.js";
import { PointerLockControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/PointerLockControls.js';
import { MeshSurfaceSampler } from 'https://cdn.skypack.dev/three/examples/jsm/math/MeshSurfaceSampler.js';


console.clear();
console.log("Surround Space - dev");

/*////////////////////////////////////////*/

// setup Scene
const scene = new THREE.Scene()

const light = new THREE.DirectionalLight()
light.position.set(25, 50, 25)
light.castShadow = true
light.shadow.mapSize.width = 16384
light.shadow.mapSize.height = 16384
light.shadow.camera.near = 0.5
light.shadow.camera.far = 100
light.shadow.camera.top = 100
light.shadow.camera.bottom = -100
light.shadow.camera.left = -100
light.shadow.camera.right = 100
scene.add(light)

const helper = new THREE.CameraHelper(light.shadow.camera)
//scene.add(helper)

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

// Set Chase Camera and pivot point. Useful for surround Phase
const chaseCam = new THREE.Object3D()
chaseCam.position.set(0, 0, 0)
const chaseCamPivot = new THREE.Object3D()
chaseCamPivot.position.set(0, 4, 8)
chaseCam.add(chaseCamPivot)
scene.add(chaseCam)

// Render setups 
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)



//ground
const phongMaterial = new THREE.MeshPhongMaterial();
const groundGeometry = new THREE.PlaneGeometry(100, 100)
const groundMesh = new THREE.Mesh(groundGeometry, phongMaterial)
groundMesh.rotateX(-Math.PI / 2) // align gournd
groundMesh.receiveShadow = true
scene.add(groundMesh)


//ground details

const groundBumpsMat = new THREE.MeshPhongMaterial({color: "skyblue"}); // add "", side: THREE.DoubleSide" for double-sided material
for (let i = 0; i < 80; i++) {
    const bumps = new THREE.Mesh(
        new THREE.SphereBufferGeometry(1, 12,12,0,Math.PI), // half spheres
        groundBumpsMat
    );
    bumps.rotation.x -= Math.PI/2; // rotated so the half-spheres are facing the right direction (up)
    bumps.position.x = Math.random() * 100 - 50;
    bumps.position.y = 0.5;
    bumps.position.z = Math.random() * 100 - 50;
    scene.add(bumps);
}


// Player setup
const playerGeometry = new THREE.BoxGeometry(1, 2, 0.5);
const playerMat = new THREE.MeshPhongMaterial({color: "red"});
const playerMesh = new THREE.Mesh(playerGeometry, playerMat);
playerMesh.position.y = 1;
playerMesh.castShadow = true;


// parent chaseCam to Player
playerMesh.add(chaseCam);

// Player Shield
const shieldGeometry = new THREE.SphereBufferGeometry(2,16,16);
const shieldMat = new THREE.MeshPhongMaterial({wireframe: true});
const shieldMesh = new THREE.Mesh(shieldGeometry,shieldMat);
shieldMesh.position.y = 1;

shieldMesh.castShadow = false;
// parent shield to the Player
playerMesh.add(shieldMesh);

// add Player + shield to scene
scene.add(playerMesh);


// !-------------------------> SAMPLED MESHES
// Generate spheres on shieldMesh using SurfaceSampler.js
// Initialize sampler
const sampler = new MeshSurfaceSampler(shieldMesh).build();

// setup shapes for sampled meshes
const sphereGeometry = new THREE.SphereBufferGeometry(0.1, 6, 6);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: "blue" });

// generate the instances

const spheres = new THREE.InstancedMesh(sphereGeometry,sphereMaterial,50);
//scene.add(spheres);

// dummy vector to store sampled random coordinates
const tempPosition = new THREE.Vector3();


// dummy object to generate the matrix of each sphere
const tempObject = new THREE.Object3D();


// loop sampled elements
for (let i = 0; i < 50; i++) {
    // sample random point on the surface of shieldMesh
    sampler.sample(tempPosition);
    // store point coordinates in tempObject
    tempObject.position.set(tempPosition.x, tempPosition.y, tempPosition.z);
    // define a random scale for the instanced spheres
    tempObject.scale.setScalar(Math.random() * 0.5 + 0.5);
    // update the matrix and insert it into instancedMesh matrix
    tempObject.updateMatrix();
    spheres.setMatrixAt(i, tempObject.matrix);
    }	

// add spheres to shieldMesh
shieldMesh.add(spheres);
// ! -------------------------> SAMPLED MESHES END



// set keyboard controls
let keyMap = {};
var onDocumentKey = function (e) {
    keyMap[e.key] = e.type === 'keydown';
};

document.addEventListener('keydown', onDocumentKey, false)
document.addEventListener('keyup', onDocumentKey, false)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const stats = Stats();
document.body.appendChild(stats.dom);

// GUI options
const vControls = new function(){
    this.FV = 0.0;
    this.RV = 0.0;
}

const guiOpts = {
    reset: function(){
        chaseCamPivot.position.x = 0;
        chaseCamPivot.position.y = 4;
        chaseCamPivot.position.z = 8;
    }
};

// ! adding the listen() updates the dat.gui and properly resets the values
const gui = new GUI();
gui.add(vControls, "FV", -0.20, 0.0);
const camCtrl = gui.addFolder("Cam Controls");
camCtrl.add(chaseCamPivot.position,"x", -10,10).listen();
camCtrl.add(chaseCamPivot.position,"y", 0,10).listen();
camCtrl.add(chaseCamPivot.position,"z", 0,10).listen();
camCtrl.add(guiOpts, "reset");
camCtrl.open();
//gui.add(vControls,"RV", -0.05,0.05);


/*  BUSTED FOR NOW. NEED TO FIGURE OUT COMBO BETWEEN WASD AND ORBITCONTROLS
// ORBIT CONTROLS (use domElements)
const controls = new OrbitControls(camera, renderer.domElement);
//controls.minDistance = 20;
controls.maxDistance = 1500;
controls.maxPolarAngle = Math.PI / 2;

//controls.update();

*/

// ANIMATE
function animate() {
  requestAnimationFrame(animate)
  render();

  helper.update()
  update();
}

// UPDATE
function update(){
    
    // set motion params
    const clock = new THREE.Clock();
    let delta;

    // passing parameters from vControls. Should be 0 by default
    // Different approach since it's a global var. Explore options?
    let forwardVelocity = vControls.FV;
    let rightVelocity = vControls.RV;

    // set a constant delta speed
    delta = Math.min(clock.getDelta(), 0.1);

    const chaseCamPos = new THREE.Vector3();
    let thrusting = false;

    
    // set forward/back acceleration motion
    // TODO: numbers should be further tweaked, ideally with gui controls
    thrusting = false;
        if (keyMap[87] ) { // W
            if (forwardVelocity < 100.0) playerMesh.translateZ(forwardVelocity -= .1)
            thrusting = true;
        }
        if (keyMap[83] ) { //S
            if (forwardVelocity > -100.0) playerMesh.translateZ(forwardVelocity += .1)
            thrusting = true;
        }

        var rotation_matrix = new THREE.Matrix4().identity();
        if (keyMap[65] ) { //A
            if (rightVelocity > -1.0) {
            playerMesh.rotateOnAxis(new THREE.Vector3(0,1,0), rightVelocity += .05);
            }
        }
        if (keyMap[68] ) { //D
            if (rightVelocity < 1.0) {
            playerMesh.rotateOnAxis(new THREE.Vector3(0,1,0), rightVelocity -= .05);
            }
        }
        
        if (keyMap[32]) {  // Space to stop 
            if (forwardVelocity > 0) {
                forwardVelocity -= 1;
            }
            if (forwardVelocity < 0) {
                forwardVelocity += 1;
            }
        }
        
        if (!thrusting) {
            //not going forward or backwards so gradually slow down
            if (forwardVelocity > 0) {
                forwardVelocity -= 0.25;
            }
            if (forwardVelocity < 0) {
                forwardVelocity += 0.25;
            }
        }

        camera.lookAt(playerMesh.position)

        chaseCamPivot.getWorldPosition(chaseCamPos)
        if (chaseCamPos.y < 1) {
            chaseCamPos.y = 1
        }
        camera.position.lerpVectors(camera.position, chaseCamPos, 0.05)

        render();

        stats.update();

        
}

function render() {
    renderer.render(scene, camera);
    
}
renderer.setAnimationLoop(render);


function keyDown(event){
  keyMap[event.keyCode] = true;

}

function keyUp(event){
  keyMap[event.keyCode] = false;

}
window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);


animate();