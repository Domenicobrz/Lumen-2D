import { Edge } from "../../geometry/Edge.js";
import { Circle } from "../../geometry/Circle.js";
import { LambertMaterial } from "../../material/lambert.js";
import { MicrofacetMaterial } from "../../material/microfacet.js";
import { LambertEmitterMaterial } from "../../material/lambertEmitter.js";
import { BeamEmitterMaterial } from "../../material/beamEmitter.js";
import { DielectricMaterial } from "../../material/dielectric.js";
import { Utils } from "../../utils.js";


/**
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
    deactivateOffscreenCanvas: false, // setting it to false slows down render times by about 1.7x
    offscreenCanvasCPow: 1.1,

    // Canvas size
    canvasSize: { 
        width:  1300,
        height: 1000,
    },

    // Reinhard tonemapping
    toneMapping: true,
    gamma: 2.2,
    exposure: 1.3,
}

export { Globals };
*/


function createScene(scene, workerData, motionBlurT, ctx, frameNumber) {

    createWorldBounds(scene);

    



    for(let i = 0; i < 50; i++) {
        let angle = (i / 50) * Math.PI * 2;
        let radius = 7;
        let edge = new Edge().scale(0.2 + i * 0.067).rotate(0.5).translate(radius, 0).rotate(angle);
        let mat1 = new MicrofacetMaterial({ opacity: 1, roughness: 0.005 });

        let radius2 = 4;
        let edge2 = new Edge().scale(0.4).rotate(-0.5).translate(radius2, 0).rotate(angle);


        scene.add(edge, mat1);
        scene.add(edge2, mat1);
    }


    let circle = new Circle(0,0, 1.4);
    circle.setMaterial(new DielectricMaterial({
        opacity: 1,
        ior: 1.4,
        absorption: 0.4,
        volumeAbsorption: [0, 0.15, 0.2],
    }));
    



    for(let i = 0; i < 1; i++) {
        let r = 1.1; //Utils.rand() * 2 + 4;
        // let sa = Utils.rand() * Math.PI * 2;
        // let ea = sa + Utils.rand() * Math.PI * 1.5;
        let sa = 0;
        let ea = Math.PI * 2;

        ctx.strokeStyle = "rgb(215, 215, 215)";
        ctx.lineWidth = 0.1;

        ctx.beginPath();
        ctx.arc(0, 0, r, sa, ea);
        ctx.stroke();        
    }






    scene.add(circle);

    // let lightSource = new Circle(0,0,1).flipNormal();
    // let lightMaterial = new LambertEmitterMaterial({ color: [500, 500, 500], opacity: 0 });
    // scene.add(lightSource, lightMaterial);


    let lightSource = new Edge().scale(2).rotate(Math.PI * 0.5).translate(15, 3);
    let lightMaterial = new LambertEmitterMaterial({ color: [1200, 1100, 1000] });
    scene.add(lightSource, lightMaterial);
}

function createWorldBounds(scene) {
    let edgeMaterial = new LambertMaterial({ opacity: 1 });
    let tbound = 11 * 3;
    let lbound = 19 * 3;
    let rbound = 19 * 3;
    let bbound = 11 * 3;
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