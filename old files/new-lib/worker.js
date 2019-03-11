// importScripts('dependencies/gl-matrix.js');
import { Scene } from "./scene.js";
import { StraightEdge } from "./geometry/StraightEdge.js";
import { Circle } from "./geometry/Circle.js";
import { Ray } from "./ray.js";
import { Pixel } from "./pixel.js";
import { MatteMaterial } from "./material/matte.js";
import { EmitterMaterial } from "./material/emitter.js";
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

onmessage = e => {

    if(e.data.type == "start") {
        canvasSize = e.data.canvasSize;
        PHOTONS_PER_FRAME = e.data.PHOTONS_PER_FRAME;
        RENDER_TYPE_NOISE = e.data.RENDER_TYPE_NOISE;

        for(let i = 0; i < canvasSize; i++) {
            pixelBuffer.push([ ]);
    
            for(let j = 0; j < canvasSize; j++) {
                pixelBuffer[i].push(new Pixel(j, canvasSize - i - 1));
            }
        }

    
    
        scene = new Scene();
    
    
        let edgeMaterial = new MatteMaterial();
        let ledge = new StraightEdge(-10, -10, -10,  10);
        let redge = new StraightEdge( 10, -10,  10,  10);
        let tedge = new StraightEdge(-10,  10,  10,  10);
        let bedge = new StraightEdge(-10, -10,  10, -10);
    
        let testcircle1 = new Circle(0,  0, 1);
    
        scene.add(ledge, edgeMaterial);
        scene.add(redge, edgeMaterial);
        scene.add(tedge, edgeMaterial);
        scene.add(bedge, edgeMaterial);
    
        scene.add(testcircle1, new MatteMaterial({ opacity: 0.85 }));
    
        let s = 30;
        let r = 1 * s;
        let g = 0.5 * s;
        let b = 0.5 * s;
        let edge = new StraightEdge(-5, 8, 5, 8);
        edge.normal[1] = -1;

        scene.add(edge, new EmitterMaterial({ color: [r,g,b], opacity: 0.0 }));
    
        requestAnimationFrame(renderSample);
    }

};



function renderSample() {
    requestAnimationFrame(renderSample);


    for(let i = canvasSize - 1; i >= 0; i--)
    for(let j = 0; j < canvasSize; j++) {
        let pixel = pixelBuffer[i][j];
        // we need to reset the value stored previously each time we compute a new sample otherwise main.js accumulates astronomical numbers
        pixel.r = 0;
        pixel.g = 0;
        pixel.b = 0;
    }
    // also make sure to reset this
    coloredPixels = 0;

    let photonCount = PHOTONS_PER_FRAME;
    let photonMult  = photonCount / 10;

    for(let i = 0; i < photonCount; i++) {
        emitPhotons();
    }

    postMessage({
        photonsFired: PHOTONS_PER_FRAME,
        coloredPixels: coloredPixels,
        buffer: pixelBuffer,
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
            vec2.scaleAndAdd(worldPoint, ray.o, ray.d, step * i);

            // convert world point to pixel coordinate
            let u = (worldPoint[0] + WORLD_SIZE / 2) / WORLD_SIZE;
            let v = (worldPoint[1] + WORLD_SIZE / 2) / WORLD_SIZE;

            let px = Math.floor(u * canvasSize);
            let py = Math.floor(v * canvasSize);

            let attenuation = Math.exp(-step * i * worldAttenuation);

            if(previousPixel[0] == px && previousPixel[1] == py || px >= canvasSize || py >= canvasSize || px < 0 || py < 0) {
                continue;
            } else {
                previousPixel[0] = px;
                previousPixel[1] = py;

                // color pixel
                // try {
                    pixelBuffer[py][px].r += emitterColor[0] * contribution * attenuation;
                    pixelBuffer[py][px].g += emitterColor[1] * contribution * attenuation;
                    pixelBuffer[py][px].b += emitterColor[2] * contribution * attenuation;
                // } catch {
                    // let y = 0;
                // }
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
    
                // color pixel
                // try {
                    pixelBuffer[py][px].r += emitterColor[0] * SAMPLES_STRENGHT * contribution * attenuation;
                    pixelBuffer[py][px].g += emitterColor[1] * SAMPLES_STRENGHT * contribution * attenuation;
                    pixelBuffer[py][px].b += emitterColor[2] * SAMPLES_STRENGHT * contribution * attenuation;
                // } catch {
                    // let y = 0;
                // }
            }
        }

        coloredPixels += SAMPLES;
    }
}

function emitPhotons() {
    let WORLD_SIZE = 20;    // effectively means the horizontal extent will be   [ -WORLD_SIZE/2 ,  +WORLD_SIZE/2 ]
    let LIGHT_BOUNCES = 8;


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

            colorPhoton(ray, result.t * 0.9999999, WORLD_SIZE, color, contribution, worldAttenuation);

            let object = result.object;
            let material = object.material;

            let scatterResult = object.material.computeScattering(ray, result.normal, result.t, contribution, worldAttenuation);
            contribution = scatterResult.contribution;
        }
    }
}