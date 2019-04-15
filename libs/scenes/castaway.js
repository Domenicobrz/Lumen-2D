import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { LambertMaterial } from "./material/lambert.js";
import { LambertEmitterMaterial } from "./material/lambertEmitter.js";
import { ExperimentalDielectricMaterial } from "./material/experimentalDielectric.js";

/*
   copy in ./libs/Globals.js

   var Globals = {

        // Sampling 
        epsilon: 0.00005,
        highPrecision: false,
        USE_STRATIFIED_SAMPLING: true,
        samplingRatioPerPixelCovered: 0.14,
        LIGHT_BOUNCES: 25,
        skipBounce: 0,      

        // Threading 
        workersCount: 5,
        PHOTONS_PER_UPDATE: 20000,

        // Environment
        WORLD_SIZE: 20, 
        worldAttenuation: 0.7, 

        // Video export
        registerVideo: false,
        photonsPerVideoFrame: 5000000,
        framesPerSecond: 30,
        framesCount: 30,
        frameStart: 0,

        // Motion blur
        motionBlur: false,
        motionBlurFramePhotons: 5000, 

        // Offscreen canvas
        deactivateOffscreenCanvas: false, // setting it to false slows down render times by about 1.7x
        offscreenCanvasCPow: 1.1,

        // Canvas size
        canvasSize: { 
            width:  950,
            height: 800,
        },

        // Reinhard tonemapping
        toneMapping: true,
        gamma: 2.2,
        exposure: 1,
    }

    export { Globals };
    
*/

function createScene(scene, workerData, motionBlurT, ctx, frameNumber) {

    createWorldBounds(scene);

    let yo = 1;
    
    for(let i = -370; i < 370; i++) {
        let y1 = Math.sin(i * 0.02) * 0.1     + Math.sin(i * 0.04) * 0.37;
        let y2 = Math.sin((i+1) * 0.02) * 0.1 + Math.sin((i+1) * 0.04) * 0.37;

        y1 -= yo;
        y2 -= yo;

        let at = (i + 370) / 740;

        let seaMaterial = new ExperimentalDielectricMaterial({
            opacity: 1,
            transmittance: 1,
            ior: 1.5,
            absorption: 0.35,
            dispersion: 0.27,
            roughness: 0.05,
            volumeAbsorption: [1.2, 0.35 + at * 0.2, 0.45 - at * 0.2],
            // reflectionStrenght: 2.35,
        })

        let seaEdge = new Edge(i * 0.0385, y1, i * 0.0385 + 0.0385, y2);
        scene.add(seaEdge, seaMaterial);
    }

    Pentagon(0, 0 -yo, 3.6, 0, true, new LambertMaterial({ opacity: 0.6}), scene);

    let lightSource = new Edge(5, 11, -5, 11);
    let lightMaterial = new LambertEmitterMaterial({ color: [1000, 800, 700] });
    scene.add(lightSource, lightMaterial);
}

function Pentagon(x, y, radius1, rotation, nothollow, material, scene) {
    
    if(!material) material = new LambertMaterial({ opacity: 0.7 });

    for(let i = 0; i < 5; i++) {
        let angle1 = (i / 5) * Math.PI * 2;
        let angle2 = ((i+1) / 5) * Math.PI * 2;

        let x1 = Math.cos(angle1) * radius1;
        let y1 = Math.sin(angle1) * radius1;

        let x2 = Math.cos(angle2) * radius1;
        let y2 = Math.sin(angle2) * radius1;

        x1 += x;
        x2 += x;

        y1 += y;
        y2 += y;

        scene.add(new Edge(x2, y2, x1, y1), material);
    }
}

function createWorldBounds(scene) {
    let edgeMaterial = new LambertMaterial({ opacity: 1 });
    let tbound = 11.5;
    let lbound = 12;
    let rbound = 12;
    let bbound = 11.5;
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