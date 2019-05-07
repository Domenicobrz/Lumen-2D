import { Edge } from "./geometry/Edge.js";
import { Star } from "./geometry/Star.js";
import { LambertMaterial } from "./material/lambert.js";
import { LambertEmitterMaterial } from "./material/lambertEmitter.js";

/*
Global settings used to render this scene

var Globals = {

    // Sampling 
    epsilon: 0.00005,
    highPrecision: false, // if set to true, uses Float64Arrays which are 2x slower to work with
    USE_STRATIFIED_SAMPLING: true,
    samplingRatioPerPixelCovered: 0.14,
    LIGHT_BOUNCES: 35,
    skipBounce: 0,      

    // Threading 
    workersCount: 5,
    PHOTONS_PER_UPDATE: 50000,
    
    // Environment
    WORLD_SIZE: 20, 
    worldAttenuation: 0.01, 
    
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
    deactivateOffscreenCanvas: true, // setting it to false slows down render times by about 1.7x
    offscreenCanvasCPow: 1.1,

    // Canvas size
    canvasSize: { 
        width:  1300,
        height: 1000,
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
    
    let star = new Star(5, 0, 0, 5, 2.5);
    let material = new LambertMaterial({ opacity: 0.6, color: [1, 0.05, 0] });
    scene.add(star, material);

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