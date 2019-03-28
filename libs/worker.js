// importScripts('dependencies/gl-matrix.js');
import { Scene } from "./scene.js";
import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { Ray } from "./ray.js";
import { Pixel } from "./pixel.js";
import { LambertMaterial } from "./material/lambert.js";
import { MatteMaterial } from "./material/matte.js";
import { EmitterMaterial } from "./material/emitter.js";
import { BeamEmitterMaterial } from "./material/beamEmitter.js";
import { glMatrix, vec2 } from "./dependencies/gl-matrix-es6.js";
import { Utils } from "./utils.js";
import { MicrofacetMaterial } from "./material/microfacet.js";
import { DielectricMaterial } from "./material/dielectric.js";


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
        WORLD_SIZE.h = Globals.WORLD_SIZE;  
        WORLD_SIZE.w = Globals.WORLD_SIZE * (canvasSize.width / canvasSize.height);  
        LIGHT_BOUNCES = Globals.LIGHT_BOUNCES; 


        workerIndex = e.data.workerIndex;

        scene = new Scene({
            showBVHdebug: workerIndex === 0 ? true : false,
        });
    
    
        let edgeMaterial = new LambertMaterial({ opacity: 1 });
        let tbound = 12;
        let lbound = 19.5;
        let rbound = 19.5;
        let bbound = 12;
        let ledge = new Edge(-lbound, -bbound, -lbound,  tbound);
        let redge = new Edge( rbound, -bbound,  rbound,  tbound);
        let tedge = new Edge(-lbound,  tbound,  rbound,  tbound);
        let bedge = new Edge(-lbound, -bbound,  rbound, -bbound);
    
    
        scene.add(ledge, edgeMaterial);
        scene.add(redge, edgeMaterial);
        scene.add(tedge, edgeMaterial);
        scene.add(bedge, edgeMaterial);
    

        // let count = 35;
        // let radius = 7.5;
        // for(let i = 0; i <= count; i++) {
        //     let t1 = i / count;
        //     let angle = t1 * Math.PI * 2;
        //     let radius = 7;
        //     let circleRadius  = 0.25 + (Math.sin(angle * 6) * 0.5 + 0.5) * 0.35;
        //     let circleOpacity = 0.9 + (Math.sin(angle * 6) * 0.5 + 0.5) * 0.1;

        //     let x1 = Math.cos(angle) * radius; 
        //     let y1 = Math.sin(angle) * radius;


        //     // let blur = Math.max(Math.abs((x1 + x2)/2) - 4, 0) * 0.08;

        //     scene.add(new Circle(x1, y1, circleRadius), new LambertMaterial({ opacity: circleOpacity }));
        // }


        // scene.add(new Circle(0, 0, 3, 0), new LambertMaterial({ opacity: 0.96 }));
        // scene.add(new Circle(0, 0, 2),    new DielectricMaterial({ opacity: 1, transmittance: 0.25 }));
        // scene.add(new Circle(0, 0, 5), new MicrofacetMaterial({ opacity: 0.7, roughness: 0.01}));



        let cs = 38.5;
        
        let r1 = Utils.rand();
        let g1 = Utils.rand();
        let b1 = Utils.rand();
        
        let r2 = Utils.rand();
        let g2 = Utils.rand();
        let b2 = Utils.rand();
    
        let beamCount = 10;
        let xstart = -15;
        let xend = 15;
        // for(let i = 0; i <= beamCount; i++) {
        //     let t = i / beamCount;

        //     let y = 9;
        //     let x = xstart * t + xend * (1-t);
        //     // if(i === 0) x = -6.7;
        //     // if(i === 1) x = +7;

        //     let r = r1 * t + r2 * (1-t);
        //     let g = g1 * t + g2 * (1-t);
        //     let b = b1 * t + b2 * (1-t);
        //     scene.add(new Edge(x, y, x-0.0001, y), new BeamEmitterMaterial({ opacity: 0, color: [r * cs, g * cs, b * cs], beamDirection: [0, -1] }));    
        // }
        let ystart = 9;
        let xx = 5;
        let beamwidth = 1; 
        // scene.add(new Edge(-xx, ystart, -xx + beamwidth, ystart), new BeamEmitterMaterial({ opacity: 0, color: [0.5 * cs, 3 * cs, 50 * cs], beamDirection: [0.5, -1] }));    
        // scene.add(new Edge(xx-beamwidth+2, ystart, xx+2, ystart), new BeamEmitterMaterial({ opacity: 0, color: [30 * cs, 2 * cs, 0.5 * cs], beamDirection: [0, -1] }));    

        scene.add(new Circle(10 * 1.2, -9 * 1.2, 0.5), new EmitterMaterial({ opacity: 0, color: [10 * cs, 10 * cs, 10 * cs] }));
        // scene.add(new Circle(0, 0, 2), new DielectricMaterial({ opacity: 1 }));

      

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