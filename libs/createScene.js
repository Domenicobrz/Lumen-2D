import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { LambertMaterial } from "./material/lambert.js";
import { LambertEmitterMaterial } from "./material/lambertEmitter.js";

function createScene(scene, workerData, motionBlurT, ctx, frameNumber) {

    createWorldBounds(scene);

    
    let circle = new Circle(0,0,3);
    let material = new LambertMaterial({ opacity: 0.6, color: [1, 0.05, 0] });
    scene.add(circle, material);

    let lightSource = new Edge(10, -5, 10, 5);
    let lightMaterial = new LambertEmitterMaterial({ color: [500, 500, 500] });
    scene.add(lightSource, lightMaterial);
}

function createWorldBounds(scene) {
    let edgeMaterial = new LambertMaterial({ opacity: 1 });
    let tbound = 11;
    let lbound = 19.5;
    let rbound = 19.5;
    let bbound = 11;
    let ledge  = new Edge(-lbound, -bbound, -lbound,  tbound,    0, 1, 0);
    let redge  = new Edge( rbound, -bbound,  rbound,  tbound,    0, -1, 0);
    let tedge  = new Edge(-lbound,  tbound,  rbound,  tbound,    0, 0, -1);
    let bedge  = new Edge(-lbound, -bbound,  rbound, -bbound,    0, 0, 1);

    scene.add(ledge, edgeMaterial);
    scene.add(redge, edgeMaterial); 
    scene.add(tedge, edgeMaterial);
    scene.add(bedge, edgeMaterial);
}

export { createScene };