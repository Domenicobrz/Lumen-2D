import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { LambertMaterial } from "./material/lambert.js";
import { LambertEmitterMaterial } from "./material/lambertEmitter.js";

function createScene(scene, workerData, motionBlurT, ctx, frameNumber) {

    createWorldBounds(scene);

    
    scene.add(new Circle(0,0,3), new LambertMaterial({ opacity: 0.6, color: [1, 0.25, 0] }));


    // you need to disable Globals.deactivateOffscreenCanvas to be able to 
    // run this example! 


    for(let i = 0; i < 5; i++) {
        ctx.strokeStyle = "#444";
        if(i % 2 === 1) ctx.strokeStyle = "#aaa";

        ctx.lineWidth = (0.1 + i * 0.05);
        ctx.beginPath();
        ctx.arc(0, 0, 3.5 + i * 0.95, 0, Math.PI*2);
        ctx.stroke();
    }
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
    scene.add(redge, new LambertEmitterMaterial({ color: [500, 500, 500] }));
    scene.add(tedge, edgeMaterial);
    scene.add(bedge, edgeMaterial);
}

export { createScene };