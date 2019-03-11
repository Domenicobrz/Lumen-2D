// importScripts('dependencies/gl-matrix.js');
import { Scene } from "./scene.js";
import { StraightEdge } from "./geometry/StraightEdge.js";
import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { Ray } from "./ray.js";
import { Pixel } from "./pixel.js";
import { MatteMaterial } from "./material/matte.js";
import { EmitterMaterial } from "./material/emitter.js";
import { Globals } from "./globals.js";
import { glMatrix, vec2 } from "./dependencies/gl-matrix-es6.js";


var canvasSize;
var scene;
var pixelBuffer = [];
// var vec2 = glMatrix.vec2;
var PHOTONS_PER_FRAME;
var RENDER_TYPE_NOISE;
var coloredPixels = 0;
var frameSkipperValue = 0; // 100;
var frameSkipperCount = 0;
var sharedArray;

var WORLD_SIZE = Globals.WORLD_SIZE;  
var LIGHT_BOUNCES = Globals.LIGHT_BOUNCES; 

onmessage = e => {

    if(e.data.type == "start") {
        canvasSize = e.data.canvasSize;
        PHOTONS_PER_FRAME = e.data.PHOTONS_PER_FRAME;
        RENDER_TYPE_NOISE = e.data.RENDER_TYPE_NOISE;

        sharedArray = new Float32Array(e.data.sharedBuffer);

    
        scene = new Scene();
    
    
        let edgeMaterial = new MatteMaterial();
        let ledge = new Edge(-10, -10, -10,  10);
        let redge = new Edge( 10, -10,  10,  10);
        let tedge = new Edge(-10,  10,  10,  10);
        let bedge = new Edge(-10, -10,  10, -10);
    
    
        scene.add(ledge, edgeMaterial);
        scene.add(redge, edgeMaterial);
        scene.add(tedge, edgeMaterial);
        scene.add(bedge, edgeMaterial);
    

        let s = 4.65;
        let r = 1 * s;
        let g = 1 * s;
        let b = 1 * s;
        // scene.add(new Circle(0, 8, 1), new EmitterMaterial({ color: [r,g,b], opacity: 1.0 }));
        // scene.add(new Circle(0, 8, 0.0001), new EmitterMaterial({ color: [10, 10, 10], opacity: 0.0 }));
        // scene.add(new Circle(0, 8, 0.0001), new EmitterMaterial({ color: [1000, 1000, 1000], opacity: 0.0, sampleWeight: 0.001 }));

        // scene.add(new Edge(7, 9.999, -7, 9.999), new EmitterMaterial({ color: [r,g,b], opacity: 0.0 }));

        scene.add(new Edge(-4, 9+1.5, -9, 8+1.5), new EmitterMaterial({ color: [10*s,10*s,10*s], opacity: 0.0 }));
        scene.add(new Edge(9,  8+1.5, 4,  9+1.5), new EmitterMaterial({ color: [10*s,10*s,10*s], opacity: 0.0 }));
    

        for(let i = -1; i < 2; i++) {

            let s = i === 0 ? 1 : 0.5;
            let xOff = i * 5;

            let edge1 = new Edge(-3 * s + xOff, -3 * s, +3 * s + xOff, +3 * s);
            let edge2 = new Edge(+3 * s + xOff, -3 * s, -3 * s + xOff, +3 * s);
            scene.add(edge1, new MatteMaterial({ opacity: 1 }));
            scene.add(edge2, new MatteMaterial({ opacity: 1 }));    
        }
    
        scene.add(new Circle(0, 0, 2), new MatteMaterial({ opacity: 0.65 }));
        scene.add(new Circle(0, 0, 6), new MatteMaterial({ opacity: 0.45 }));


        requestAnimationFrame(renderSample);
    }

    if(e.data.type == "PHOTONS-PER-FRAME-UPDATE") {
        PHOTONS_PER_FRAME = e.data.PHOTONS_PER_FRAME;
    }
};



function renderSample() {
    requestAnimationFrame(renderSample);


    // for(let i = canvasSize - 1; i >= 0; i--)
    // for(let j = 0; j < canvasSize; j++) {
    //     let pixel = pixelBuffer[i][j];
    //     // we need to reset the value stored previously each time we compute a new sample otherwise main.js accumulates astronomical numbers
    //     pixel.r = 0;
    //     pixel.g = 0;
    //     pixel.b = 0;
    // }
    // // also make sure to reset this
    coloredPixels = 0;

    let photonCount = PHOTONS_PER_FRAME;
    let photonMult  = photonCount / 10;

    for(let i = 0; i < photonCount; i++) {
        emitPhotons();
    }

    postMessage({
        photonsFired: PHOTONS_PER_FRAME,
        coloredPixels: coloredPixels,
    });
}


function colorPhoton(ray, t, WORLD_SIZE, emitterColor, contribution, worldAttenuation) {
    let worldPixelSize = WORLD_SIZE / canvasSize;
    let step = worldPixelSize;
    let steps = Math.floor(t / worldPixelSize);

    let worldPoint = vec2.create();
    let tmp        = vec2.create();
    let previousPixel = [-1, -1];


    if(!RENDER_TYPE_NOISE) {
        for(let i = 0; i < steps; i++) {
            let t = step * (i + Math.random() * 1);
            vec2.scaleAndAdd(worldPoint, ray.o, ray.d, t);

            // convert world point to pixel coordinate
            let u = (worldPoint[0] + WORLD_SIZE / 2) / WORLD_SIZE;
            let v = (worldPoint[1] + WORLD_SIZE / 2) / WORLD_SIZE;

            let px = Math.floor(u * canvasSize);
            let py = Math.floor(v * canvasSize);

            let attenuation = Math.exp(-t * worldAttenuation);

            if(previousPixel[0] == px && previousPixel[1] == py || px >= canvasSize || py >= canvasSize || px < 0 || py < 0) {
                continue;
            } else {
                previousPixel[0] = px;
                previousPixel[1] = py;

                let index = (py * canvasSize + px) * 3;

                // let prevR = Atomics.load(sharedArray, index + 0);
                // let prevG = Atomics.load(sharedArray, index + 1);
                // let prevB = Atomics.load(sharedArray, index + 2);
                // Atomics.store(sharedArray, index + 0, prevR + emitterColor[0] * contribution * attenuation);
                // Atomics.store(sharedArray, index + 1, prevG + emitterColor[1] * contribution * attenuation);
                // Atomics.store(sharedArray, index + 2, prevB + emitterColor[2] * contribution * attenuation);

                let prevR = sharedArray[index + 0];
                let prevG = sharedArray[index + 1];
                let prevB = sharedArray[index + 2];
                sharedArray[index + 0] = prevR + emitterColor[0] * contribution * attenuation;
                sharedArray[index + 1] = prevG + emitterColor[1] * contribution * attenuation;
                sharedArray[index + 2] = prevB + emitterColor[2] * contribution * attenuation;
            }
        }

        coloredPixels += steps;
    }




    if(RENDER_TYPE_NOISE) {
        // IMPORTANT:  WE NEED TO TAKE LESS SAMPLES IF THE RAY IS SHORT (proportionally)!! OTHERWISE we would increase radiance along short rays in an unproportional way
        // because we would add more emitterColor along those smaller rays 
        let SAMPLES = Math.floor(steps * 0.15);
        let SAMPLES_STRENGHT = steps / SAMPLES;
    
        for(let i = 0; i < SAMPLES; i++) {
            let tt = t * Math.random();
            vec2.scaleAndAdd(worldPoint, ray.o, ray.d, tt);
    
            // convert world point to pixel coordinate
            let u = (worldPoint[0] + WORLD_SIZE / 2) / WORLD_SIZE;
            let v = (worldPoint[1] + WORLD_SIZE / 2) / WORLD_SIZE;
    
            let px = Math.floor(u * canvasSize);
            let py = Math.floor(v * canvasSize);
    
            let attenuation = Math.exp(-tt * worldAttenuation);
    
            if(previousPixel[0] == px && previousPixel[1] == py || px >= canvasSize || py >= canvasSize || px < 0 || py < 0) {
                continue;
            } else {
                previousPixel[0] = px;
                previousPixel[1] = py;
    
                let index = (py * canvasSize + px) * 3;

                // let prevR = Atomics.load(sharedArray, index + 0);
                // let prevG = Atomics.load(sharedArray, index + 1);
                // let prevB = Atomics.load(sharedArray, index + 2);
                // Atomics.store(sharedArray, index + 0, prevR + emitterColor[0] * SAMPLES_STRENGHT * contribution * attenuation);
                // Atomics.store(sharedArray, index + 1, prevG + emitterColor[1] * SAMPLES_STRENGHT * contribution * attenuation);
                // Atomics.store(sharedArray, index + 2, prevB + emitterColor[2] * SAMPLES_STRENGHT * contribution * attenuation);

                let prevR = sharedArray[index + 0];
                let prevG = sharedArray[index + 1];
                let prevB = sharedArray[index + 2];
                sharedArray[index + 0] = prevR + emitterColor[0] * SAMPLES_STRENGHT * contribution * attenuation;
                sharedArray[index + 1] = prevG + emitterColor[1] * SAMPLES_STRENGHT * contribution * attenuation;
                sharedArray[index + 2] = prevB + emitterColor[2] * SAMPLES_STRENGHT * contribution * attenuation;
            }
        }

        coloredPixels += SAMPLES;
    }
}

function emitPhotons() {

    let emitter = scene.getEmitter();
    let photon = emitter.material.getPhoton(emitter);

    let ray = photon.ray;
    let color = photon.color;



    let contribution = 1.0;
    let worldAttenuation = (1.0 / WORLD_SIZE)    * 0.2;


    for(let i = 0; i < LIGHT_BOUNCES; i++) {
        let result = scene.intersect(ray);
        
        // if we had an intersection
        if(result.t) {
            colorPhoton(ray, (result.t - Globals.epsilon), WORLD_SIZE, color, contribution, worldAttenuation);


            // ***** just used for animation 
            // let cd = Date.now();
            // while(Date.now() - cd < 10) { /* do nothing */ }
            // ***** just used for animation - END 


            let object = result.object;
            let material = object.material;

            let scatterResult = object.material.computeScattering(ray, result.normal, result.t, contribution, worldAttenuation);
            contribution = scatterResult.contribution;

            if(contribution < 0.01) return;
        }
    }
}