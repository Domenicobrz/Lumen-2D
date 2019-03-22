// importScripts('dependencies/gl-matrix.js');
import { Scene } from "./scene.js";
import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { Ray } from "./ray.js";
import { Pixel } from "./pixel.js";
import { MatteMaterial } from "./material/matte.js";
import { EmitterMaterial } from "./material/emitter.js";
import { BeamEmitterMaterial } from "./material/beamEmitter.js";
import { glMatrix, vec2 } from "./dependencies/gl-matrix-es6.js";
import { Utils } from "./utils.js";


var canvasSize;
var scene;
var pixelBuffer = [];
// var vec2 = glMatrix.vec2;
var coloredPixels = 0;
var frameSkipperValue = 0; // 100;
var frameSkipperCount = 0;
var sharedArray;

var WORLD_SIZE;  
var LIGHT_BOUNCES; 

var Globals;

onmessage = e => {

    if(e.data.type == "start") {
        canvasSize = e.data.canvasSize;

        sharedArray = new Float32Array(e.data.sharedBuffer);

        // passing globals from main.js since they could change while the app is running
        Globals = e.data.Globals;
        WORLD_SIZE = Globals.WORLD_SIZE;  
        LIGHT_BOUNCES = Globals.LIGHT_BOUNCES; 


        let workerIndex = e.data.workerIndex;

        scene = new Scene({
            showBVHdebug: workerIndex === 0 ? true : false,
        });
    
    
        let edgeMaterial = new MatteMaterial();
        let ledge = new Edge(-10, -10, -10,  15);
        let redge = new Edge( 10, -10,  10,  15);
        let tedge = new Edge(-10,  15,  10,  15);
        let bedge = new Edge(-10, -10,  10, -10);
    
    
        scene.add(ledge, edgeMaterial);
        scene.add(redge, edgeMaterial);
        scene.add(tedge, edgeMaterial);
        scene.add(bedge, edgeMaterial);
    

        let count = 40;
        let radius = 7.5;
        for (let j = 0; j < 5; j++)
        for(let i = 0; i < count; i++) {

            // let s = 0.2 + 0.7 * (j / 5);
            // let t = i / count;
            // let angle = t * Math.PI * 2;
            // let nradius = radius + Math.sin(angle * 12) * 1;
            // let xOff = i * 2 - 9; //Math.cos(angle) * nradius;
            // let yOff = 3 -j * 2; //Math.sin(angle) * nradius;
            // let alpha = i / count; //1; // Math.sin((angle + Math.PI) * 8) * 0.3 + 0.7;
            // if(j % 2 == 1) alpha = 1 - alpha;

            // let edge1 = new Edge(-1 * s + xOff, -1 * s + yOff, +1 * s + xOff, +1 * s + yOff);
            // let edge2 = new Edge(+1 * s + xOff, -1 * s + yOff, -1 * s + xOff, +1 * s + yOff);
            
            // let r = 30; //r1 * t + r2 * (1-t);
            // let g = 30; //g1 * t + g2 * (1-t);
            // let b = 30; //b1 * t + b2 * (1-t);

          
            // scene.add(edge1, new MatteMaterial({ opacity: alpha }));    
            // scene.add(edge2, new MatteMaterial({ opacity: alpha }));    

            scene.add(new Circle(Utils.rand() * 19 - 9, Utils.rand() * 15 - 9, Utils.rand() * 0.8),   new MatteMaterial({ opacity: Utils.rand() * 0.5 }));
        }
    
        let xs = 6;
        let cs = 2.5;
        // scene.add(new Circle(-xs, 9, 0.01), new BeamEmitterMaterial({ opacity: 0, color: [30, 6, 3], beamDirection: [0, -1] }));
        // scene.add(new Circle(xs, 9, 0.01), new BeamEmitterMaterial({ opacity: 0, color: [3, 6, 30], beamDirection: [0, -1] }));
        scene.add(new Edge(-3, 9, 1, 9), new BeamEmitterMaterial({ opacity: 0, color: [3 * cs, 6 * cs, 30 * cs], beamDirection: [0, -1] }));
        scene.add(new Edge(-1, 9, 3, 9), new BeamEmitterMaterial({ opacity: 0, color: [30 * cs, 6 * cs, 3 * cs], beamDirection: [0, -1] }));
        // scene.add(new Circle(0, 9, 0.01), new EmitterMaterial({ opacity: 0, color: [30, 30, 30] }));
        // scene.add(new Circle(0, 9, 1),   new MatteMaterial({ opacity: 0.3 }));
        // scene.add(new Circle(0, 0, 4),   new MatteMaterial({ opacity: 0.75 }));


        requestAnimationFrame(renderSample);
    }

    if(e.data.type == "Globals-update") {
        Globals = e.data.Globals;
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

    let photonCount = Globals.PHOTONS_PER_FRAME;
    let photonMult  = photonCount / 10;

    for(let i = 0; i < photonCount; i++) {
        emitPhotons();
    }

    postMessage({
        photonsFired: Globals.PHOTONS_PER_FRAME,
        coloredPixels: coloredPixels,
    });
}


function colorPhoton(ray, t, WORLD_SIZE, emitterColor, contribution, worldAttenuation) {
    let worldPixelSize = WORLD_SIZE / canvasSize;
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

    if(t < 0.01) {
        let debug = 0;
    }

    let worldPoint = vec2.create();
    let tmp        = vec2.create();
    let previousPixel = [-1, -1];


    if(!Globals.RENDER_TYPE_NOISE) {

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
                sharedArray[index + 0] = prevR + emitterColor[0] * contribution * attenuation * stepAttenuation;
                sharedArray[index + 1] = prevG + emitterColor[1] * contribution * attenuation * stepAttenuation;
                sharedArray[index + 2] = prevB + emitterColor[2] * contribution * attenuation * stepAttenuation;
            }
        }

        coloredPixels += steps;
    }




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
                sharedArray[index + 0] = prevR + emitterColor[0] * SAMPLES_STRENGHT * contribution * attenuation * stepAttenuation;
                sharedArray[index + 1] = prevG + emitterColor[1] * SAMPLES_STRENGHT * contribution * attenuation * stepAttenuation;
                sharedArray[index + 2] = prevB + emitterColor[2] * SAMPLES_STRENGHT * contribution * attenuation * stepAttenuation;
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

    if(ray.o[0] < -0.048 && ray.o[1] < 9) {
        let debug = 0;
    }

    let contribution = 1.0;
    let worldAttenuation = Globals.worldAttenuation * (1.0 / Globals.WORLD_SIZE);


    for(let i = 0; i < LIGHT_BOUNCES; i++) {
        let result = scene.intersect(ray);
        
        // if we had an intersection
        if(result.t) {
            colorPhoton(ray, result.t /*(result.t - Globals.epsilon)*/, WORLD_SIZE, color, contribution, worldAttenuation);


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