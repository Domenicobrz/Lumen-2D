// importScripts('dependencies/gl-matrix.js');
import { Scene } from "./scene.js";
import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { Ray } from "./ray.js";
import { Pixel } from "./pixel.js";
import { glMatrix, vec2 } from "./dependencies/gl-matrix-es6.js";
import { Utils } from "./utils.js";
import { createScene } from "./createScene.js";


var canvasSize;
var scene;
var pixelBuffer = [];
// var vec2 = glMatrix.vec2;
var coloredPixels = 0;
var frameSkipperValue = 0; // 100;
var frameSkipperCount = 0;
var sharedArray;
var sharedArray2;

var workerIndex;

var WORLD_SIZE = {
    w: 0,
    h: 0,
};  
var LIGHT_BOUNCES; 

var Globals;

onmessage = e => {

    if(e.data.type == "start") {
        canvasSize = e.data.canvasSize;

        sharedArray = new Float32Array(e.data.sharedBuffer);
        sharedArray2 = new Float32Array(e.data.sharedBuffer2);

        // passing globals from main.js since they could change while the app is running
        Globals = e.data.Globals;

        if(Globals.highPrecision)
            glMatrix.setMatrixArrayType(Float64Array);


        WORLD_SIZE.h = Globals.WORLD_SIZE;  
        WORLD_SIZE.w = Globals.WORLD_SIZE * (canvasSize.width / canvasSize.height);  
        LIGHT_BOUNCES = Globals.LIGHT_BOUNCES; 


        workerIndex = e.data.workerIndex;


        scene = new Scene({
            showBVHdebug: workerIndex === 0 ? true : false,
        });


        createScene(scene, e.data);
      

        requestAnimationFrame(renderSample);
    }

    if(e.data.type == "Globals-update") {
        Globals = e.data.Globals;
    }
};



function renderSample() {
    requestAnimationFrame(renderSample);


    // // also make sure to reset this
    coloredPixels = 0;

    let photonCount = Globals.PHOTONS_PER_FRAME;
    let photonMult  = photonCount / 10;

    for(let i = 0; i < photonCount; i++) {
        emitPhoton();
        sharedArray2[workerIndex] += 1;
    }

    postMessage({
        photonsFired: Globals.PHOTONS_PER_FRAME,
        coloredPixels: coloredPixels,
    });
}


function colorPhoton(ray, t, emitterColor, contribution, worldAttenuation) {
    let worldPixelSize = WORLD_SIZE.h / canvasSize.height;
    let step = worldPixelSize;
    let steps = Math.floor(t / step);
    // only used if "steps" ends up being 0
    let stepAttenuation = 1;

    // the "steps" variable is deprecated and only used in the line-sampling-method
    // RENDER_TYPE_NOISE now uses continuousSteps which is defined in its code block
    if(steps === 0) {
        steps++;
        stepAttenuation = t / step;
    }

    let worldPoint = vec2.create();
    let tmp        = vec2.create();
    let previousPixel = [-1, -1];


    // THIS SAMPLING METHOD IS DEPRECATED!! IT USES THE OLD ASSUMPTION THAT THE CANVAS IS A SQUARE
    // if(!Globals.RENDER_TYPE_NOISE) {

    //     for(let i = 0; i < steps; i++) {
    //         let t = step * (i + Math.random() * 1);
    //         vec2.scaleAndAdd(worldPoint, ray.o, ray.d, t);

    //         // convert world point to pixel coordinate
    //         let u = (worldPoint[0] + WORLD_SIZE / 2) / WORLD_SIZE;
    //         let v = (worldPoint[1] + WORLD_SIZE / 2) / WORLD_SIZE;

    //         let px = Math.floor(u * canvasSize);
    //         let py = Math.floor(v * canvasSize);

    //         let attenuation = Math.exp(-t * worldAttenuation);

    //         if(previousPixel[0] == px && previousPixel[1] == py || px >= canvasSize || py >= canvasSize || px < 0 || py < 0) {
    //             continue;
    //         } else {
    //             previousPixel[0] = px;
    //             previousPixel[1] = py;

    //             let index = (py * canvasSize + px) * 3;

    //             // let prevR = Atomics.load(sharedArray, index + 0);
    //             // let prevG = Atomics.load(sharedArray, index + 1);
    //             // let prevB = Atomics.load(sharedArray, index + 2);
    //             // Atomics.store(sharedArray, index + 0, prevR + emitterColor[0] * contribution * attenuation);
    //             // Atomics.store(sharedArray, index + 1, prevG + emitterColor[1] * contribution * attenuation);
    //             // Atomics.store(sharedArray, index + 2, prevB + emitterColor[2] * contribution * attenuation);

    //             let prevR = sharedArray[index + 0];
    //             let prevG = sharedArray[index + 1];
    //             let prevB = sharedArray[index + 2];
    //             sharedArray[index + 0] = prevR + emitterColor[0] * contribution * attenuation * stepAttenuation;
    //             sharedArray[index + 1] = prevG + emitterColor[1] * contribution * attenuation * stepAttenuation;
    //             sharedArray[index + 2] = prevB + emitterColor[2] * contribution * attenuation * stepAttenuation;
    //         }
    //     }

    //     coloredPixels += steps;
    // }




    if(Globals.RENDER_TYPE_NOISE) {
        // we can't use "steps" as a base value for a random sampling strategy, because we're sampling in a "continuous" domain!!
        // here's why: assume t / step is 0.1 (which means that "steps" is 0) - what should we do? compute a single sample? no sample at all? 
        // another example: assumet t / step is 10.5 (which means that the steps variable holds 10) --- if we choose to compute only 2 samples and then 
        // compute SAMPLES_STRENGHT as steps / SAMPLES (which would mean 10 / 2 in this example) the rounding error
        // given by 0.5 will be important!! 
        // another example: if t / step ends up being 2.5, steps will hold 2, and assume we choose to compute only 1 sample, (since remember that RENDER_TYPE_NOISE 
        // only chooses to compute a subset of the total amount of pixels touched by a light ray) then SAMPLES_STRENGHT would hold (steps / SAMPLES) == 2, 
        // but the "real" sample_strenght should be 2.5  
        let continuousSteps = t / step;

        // IMPORTANT:  WE NEED TO TAKE LESS SAMPLES IF THE RAY IS SHORT (proportionally)!! OTHERWISE we would increase radiance along short rays in an unproportional way
        // because we would add more emitterColor along those smaller rays 
        let SAMPLES = Math.max(  Math.floor(continuousSteps * 0.15),  1  );
        let SAMPLES_STRENGHT = continuousSteps / SAMPLES; // think of it this way: if we should have sampled 30 pixels (with the line sampling method), but instead we're just 
                                                          // coloring two, then these two pixels need 15x times the amount of radiance
    
        for(let i = 0; i < SAMPLES; i++) {
            let tt = t * Math.random();
            vec2.scaleAndAdd(worldPoint, ray.o, ray.d, tt);
    
            // convert world point to pixel coordinate
            let u = (worldPoint[0] + WORLD_SIZE.w / 2) / WORLD_SIZE.w;
            let v = (worldPoint[1] + WORLD_SIZE.h / 2) / WORLD_SIZE.h;
    
            let px = Math.floor(u * canvasSize.width);
            let py = Math.floor(v * canvasSize.height);
    
            let attenuation = Math.exp(-tt * worldAttenuation);
    
            if(previousPixel[0] == px && previousPixel[1] == py || px >= canvasSize.width || py >= canvasSize.height || px < 0 || py < 0) {
                continue;
            } else {
                previousPixel[0] = px;
                previousPixel[1] = py;
    
                let index = (py * canvasSize.width + px) * 3;

                // let prevR = Atomics.load(sharedArray, index + 0);
                // let prevG = Atomics.load(sharedArray, index + 1);
                // let prevB = Atomics.load(sharedArray, index + 2);
                // Atomics.store(sharedArray, index + 0, prevR + emitterColor[0] * SAMPLES_STRENGHT * contribution * attenuation);
                // Atomics.store(sharedArray, index + 1, prevG + emitterColor[1] * SAMPLES_STRENGHT * contribution * attenuation);
                // Atomics.store(sharedArray, index + 2, prevB + emitterColor[2] * SAMPLES_STRENGHT * contribution * attenuation);

                let prevR = sharedArray[index + 0];
                let prevG = sharedArray[index + 1];
                let prevB = sharedArray[index + 2];
                sharedArray[index + 0] = prevR + emitterColor[0] * SAMPLES_STRENGHT * contribution * attenuation * stepAttenuation;
                sharedArray[index + 1] = prevG + emitterColor[1] * SAMPLES_STRENGHT * contribution * attenuation * stepAttenuation;
                sharedArray[index + 2] = prevB + emitterColor[2] * SAMPLES_STRENGHT * contribution * attenuation * stepAttenuation;
            }
        }

        coloredPixels += SAMPLES;
    }
}

function emitPhoton() {

    let emitter = scene.getEmitter();
    let photon = emitter.material.getPhoton(emitter);

    let ray = photon.ray;
    let color = photon.color;

    if(ray.d[1] < -0.95) {
        let debug = 0;
    }

    let contribution = 1.0;                         // Globals.WORLD_SIZE refers to the vertical size of the world 
    let worldAttenuation = Globals.worldAttenuation * (1.0 / Globals.WORLD_SIZE);


    for(let i = 0; i < LIGHT_BOUNCES; i++) {
        let result = scene.intersect(ray);
        
        // if we had an intersection
        if(result.t) {

            let object = result.object;
            let material = object.material;

            colorPhoton(ray, result.t /*(result.t - Globals.epsilon)*/, color, contribution, worldAttenuation);


            // ***** just used for animation 
            // let cd = Date.now();
            // while(Date.now() - cd < 10) { /* do nothing */ }
            // ***** just used for animation - END 

            let scatterResult = object.material.computeScattering(ray, result.normal, result.t, contribution, worldAttenuation);
            contribution = scatterResult.contribution;

            if(contribution < 0.01) return;
        }
    }
}