import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { CPoly } from "./geometry/CPoly.js";
import { LambertMaterial } from "./material/lambert.js";
import { LambertEmitterMaterial } from "./material/lambertEmitter.js";
import { BeamEmitterMaterial } from "./material/beamEmitter.js";
import { ExperimentalDielectricMaterial } from "./material/experimentalDielectric.js";
import { Utils } from "./utils.js";


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
    WORLD_SIZE: 25, 
    worldAttenuation: 0.07, 
    
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

    let r = 2;
    for(let i = -r * 2; i <= r * 2; i++) {
        for(let j = -r; j <= r; j++) {
            let verse = Math.floor(Utils.rand() * 2);
            let squareSize = 2.15;
            tiling(scene, i * squareSize, j * squareSize, squareSize, verse);
        }
    }

    let lss = 65;
    let lightSource1 = new Circle(0,15, 2);
    let lightMaterial1 = new LambertEmitterMaterial({ color: [100 * lss, 90 * lss, 80 * lss], opacity: 0 });
    lightSource1.setMaterial(lightMaterial1);
    scene.add(lightSource1);    
}


function tiling(scene, x, y, s, t) {
    let precision = 50;
    for(let j = 0; j < 2; j++) {
        let angleOffset = j * Math.PI + t * Math.PI * 0.5;

        for(let i = 0; i < precision; i++) {
            let angle1 = (i / precision) * Math.PI * 0.5 + angleOffset;
            let angle2 = ((i+1) / precision) * Math.PI * 0.5 + angleOffset;

            let r1 = 0.9 + Math.cos((i     / precision) * Math.PI * 4) * 0.2;
            let r2 = 0.9 + Math.cos(((i+1) / precision) * Math.PI * 4) * 0.2;

            let x1 = Math.cos(angle1) * ( s * 0.5 * r1 );
            let y1 = Math.sin(angle1) * ( s * 0.5 * r1 );
            let x2 = Math.cos(angle2) * ( s * 0.5 * r2 );
            let y2 = Math.sin(angle2) * ( s * 0.5 * r2 );

            if(j === 0 && t === 0) {
                x1 -= s * 0.5;
                y1 -= s * 0.5;
                x2 -= s * 0.5;
                y2 -= s * 0.5;    
            }
            if(j === 1 && t === 0) {
                x1 += s * 0.5;
                y1 += s * 0.5;
                x2 += s * 0.5;
                y2 += s * 0.5;    
            }
            if(j === 0 && t === 1) {
                x1 += s * 0.5;
                y1 -= s * 0.5;
                x2 += s * 0.5;
                y2 -= s * 0.5;    
            }
            if(j === 1 && t === 1) {
                x1 -= s * 0.5;
                y1 += s * 0.5;
                x2 -= s * 0.5;
                y2 += s * 0.5;    
            }

            x1 += x;
            x2 += x;
            y1 += y;
            y2 += y;

            let matId = ((y+5) / 10) * 0.55  - Math.abs(x1)*0.35;
            let material;
            if(matId > 0) {
                material = new ExperimentalDielectricMaterial({
                    opacity: 1,
                    transmittance: 1,
                    ior: 1.5,
                    absorption: 0.1,
                    dispersion: 0.2,
                    roughness: 0.01,
                    refractionStrenght: 1.15,
                });
            } else {
                material = new LambertMaterial({ opacity: 0.97 });
            }

            scene.add(new Edge(x2, y2, x1, y1), material);
        }   
    }
}




function createWorldBounds(scene) {
    let edgeMaterial = new LambertMaterial({ opacity: 1 });
    let tbound = 11   * 1.5;
    let lbound = 19.5 * 1;
    let rbound = 19.5 * 1;
    let bbound = 11   * 1.3;
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