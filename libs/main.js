import { Globals } from "./globals.js";
import { Scene } from "./scene.js";
import { MatteMaterial } from "./material/matte.js";
import { Edge } from "./geometry/Edge.js";
import { BVH } from "./bvh.js";
import { Ray } from "./ray.js";
import { glMatrix, vec2, mat2 } from "./dependencies/gl-matrix-es6.js";

window.addEventListener("load", init);

var canvas;
var context;
var imageDataObject;

var canvasSize = Globals.canvasSize;
var sharedBuffer;
var sharedArray;
var photonsFired  = 0;
var coloredPixels = 0;
var scene;

var frameSkipperValue = 0; // 100;
var frameSkipperCount = 0;

var needsUpdate = false;

var workers = [];



function init() {
    canvas = document.getElementById('canvas');
	canvas.width  = canvasSize;
	canvas.height = canvasSize;
	context = canvas.getContext('2d');
    imageDataObject = context.createImageData(canvasSize, canvasSize);


    // BVH debug test 
    // debugBvh();
    // console.log("returning early from function");
    // return;
    // BVH debug test - END 

    if(!Globals.RENDER_TYPE_NOISE) {
        console.warn("The line sampling method integrator is completely off and doesn't work in the continuous domain, RENDER_TYPE_NOISE = true is HIGHLY suggested for quality results");
    }


    var length = canvasSize * canvasSize * 3;
    var size = Float32Array.BYTES_PER_ELEMENT * length;
    var sharedBuffer = new SharedArrayBuffer(size);
    sharedArray = new Float32Array(sharedBuffer);
    for (let i = 0; i < length; i++) {
        // Atomics.store(sharedArray, i, 0);
        sharedArray[i] = 0;
    }

    let startWorkerObject = {
        type: "start",
        scene: { },
        canvasSize: canvasSize,
        sharedBuffer: sharedBuffer,
        workerIndex: 0,
        Globals: Globals,
    };

    let onWorkerMessage = e => {
        let message = e.data;
        let workerPhotonsFired = e.data.photonsFired;

        photonsFired += workerPhotonsFired;
        coloredPixels += e.data.coloredPixels;
        // for(let i = 0; i < canvasSize; i++)
        // for(let j = 0; j < canvasSize; j++) {
        //     let pixel = pixelBuffer[i][j];

        //     if(pixel.r === undefined) {
        //         pixel.r = 0;
        //         pixel.g = 0;
        //         pixel.b = 0;
        //     }

        //     pixel.r += workerComputedBuffer[i][j].r;
        //     pixel.g += workerComputedBuffer[i][j].g;
        //     pixel.b += workerComputedBuffer[i][j].b;
        // }
        console.log("photons fired: " + photonsFired + " -- colored pixels: " + coloredPixels);

        // needsUpdate = true;
    };


    // worker.postMessage(startWorkerObject);
    // worker.onmessage = onWorkerMessage;



    let workersCount = Globals.workersCount;

    for(let i = 0; i < workersCount; i++) {
        workers.push(new Worker("./libs/worker.js", { type: "module" }));
        startWorkerObject.workerIndex = i;
        workers[i].postMessage(startWorkerObject);
        workers[i].onmessage = onWorkerMessage;
    }


    window.addEventListener("keypress", function(e) {
        if(e.key == "k") {
            Globals.PHOTONS_PER_FRAME *= 2;

            for(let i = 0; i < workersCount; i++) {
                workers[i].postMessage({
                    type: "Globals-update",
                    Globals: Globals,
                });
            }
        }
        if(e.key == "j") {
            frameSkipperValue /= 2;
        }
    });


    requestAnimationFrame(renderSample);
}


function renderSample() {
    requestAnimationFrame(renderSample);
    // if(!needsUpdate) return;
    // needsUpdate = false;



    // *********** used only for animation
    frameSkipperCount++;
    if(frameSkipperCount < frameSkipperValue) return;
    else frameSkipperCount = 0;
    // *********** used only for animation - END


	var imageData = imageDataObject.data;

    // fill with base color
    for (var i = 0; i < canvasSize * canvasSize * 4; i += 4)
    {
        let pixelIndex = Math.floor(i / 4);
        let y = canvasSize - Math.floor(pixelIndex / canvasSize) - 1;
        let x = pixelIndex % canvasSize;

        let index = (y * canvasSize + x) * 3;

        // let r = Atomics.load(sharedArray, index + 0) / (photonsFired * 0.001);
        // let g = Atomics.load(sharedArray, index + 1) / (photonsFired * 0.001);
        // let b = Atomics.load(sharedArray, index + 2) / (photonsFired * 0.001);

        let r = sharedArray[index + 0] / (photonsFired * 0.1);
        let g = sharedArray[index + 1] / (photonsFired * 0.1);
        let b = sharedArray[index + 2] / (photonsFired * 0.1);


        r *= 255;
        g *= 255;
        b *= 255;

        if(r > 255) r = 255;
        if(g > 255) g = 255;
        if(b > 255) b = 255;

        imageData[i]     = r;
        imageData[i + 1] = g;
        imageData[i + 2] = b;
        imageData[i + 3] = 255;
    }

    context.putImageData(imageDataObject, 0, 0);
}



function debugBvh() {
    
    scene = new Scene();    
    
    let edgesCount = 500;
    for(let i = 0; i < edgesCount; i++) {
        let x  = ( Math.random() * 2 - 1 ) * 0.35;
        let y  = ( Math.random() * 2 - 1 ) * 0.35;
        let ex = ( Math.random() * 2 - 1 ) * 0.35;
        let ey = ( Math.random() * 2 - 1 ) * 0.35;

        let ox = Math.random() * 17.9 - 8.9;
        let oy = Math.random() * 17.9 - 8.9;

        // let edge = new Edge(x, y, x, y + 1);
        let edge = new Edge(x + ox, y + oy, ex + ox, ey + oy);
        scene.add(edge);
    }

    let ray  = new Ray(vec2.fromValues(6, 0), vec2.fromValues(-0.7, 0.7));

    scene.add(new Edge(-9, -9, -9, 9));

    let bvh = new BVH(scene._objects);
    bvh.debug(context, canvasSize, canvasSize, Globals.WORLD_SIZE / 2, Globals.WORLD_SIZE / 2, ray);
}