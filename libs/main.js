import { Globals } from "./globals.js";
import { Scene } from "./scene.js";
import { MatteMaterial } from "./material/matte.js";
import { Edge } from "./geometry/Edge.js";
import { BVH } from "./bvh.js";
import { Ray } from "./ray.js";
import { glMatrix, vec2, mat2, vec3 } from "./dependencies/gl-matrix-es6.js";
// import { CCapture } from "./dependencies/CCapture.js";
// import { CCapture } from "./dependencies/CCapture.js";
import { download } from "./dependencies/download.js";
import "./dependencies/webm-writer-0.2.0.js";



window.addEventListener("load", init);

var canvas;
var context;
var imageDataObject;

var canvasSize = Globals.canvasSize;
var sharedBuffer;
// used to track how many photons have been fired
var sharedBuffer2;
var sharedArray;
var sharedArray2;
var photonsFired  = 0;
var coloredPixels = 0;
var videoPhotonsCounter = 0;
var scene;


var needsUpdate = false;

var workers = [];
var videoWriter;

var activeWorkers = 0;
var currentVideoFrame = 0;


function init() {
    canvas = document.getElementById('canvas');
	canvas.width  = canvasSize.width;
	canvas.height = canvasSize.height;
	context = canvas.getContext('2d');
    imageDataObject = context.createImageData(canvasSize.width, canvasSize.height);

    // BVH debug test 
    // debugBvh();
    // console.log("returning early from function");
    // return;
    // BVH debug test - END 

    if(!Globals.RENDER_TYPE_NOISE) {
        console.warn("The line sampling method integrator is completely off and doesn't work in the continuous domain, RENDER_TYPE_NOISE = true is HIGHLY suggested for quality results");
    }


    var length = canvasSize.width * canvasSize.height * 3;
    var size = Float32Array.BYTES_PER_ELEMENT * length;
    var sharedBuffer = new SharedArrayBuffer(size); 
    // will be used to store information on photons traced
    var sharedBuffer2 = new SharedArrayBuffer(Globals.workersCount * 4); // needs to be a multiple of 4 for some reason 
    sharedArray = new Float32Array(sharedBuffer);
    sharedArray2 = new Float32Array(sharedBuffer2);
    for (let i = 0; i < length; i++) {
        sharedArray[i] = 0;
    }
    for (let i = 0; i < Globals.workersCount; i++) {
        sharedArray2[i] = 0;
    }

    let startWorkerObject = {
        type: "start",
        scene: { },
        canvasSize: canvasSize,
        sharedBuffer: sharedBuffer,
        sharedBuffer2: sharedBuffer2,
        workerIndex: 0,
        Globals: Globals,
        randomNumber: Math.random()
    };
    activeWorkers = Globals.workersCount;

    let onWorkerMessage = e => {

        if(e.data.type == "photons-fired-update") {

            let message = e.data;
            let workerPhotonsFired = e.data.photonsFired;
    
            photonsFired += workerPhotonsFired;
            coloredPixels += e.data.coloredPixels;
         
            console.log("photons fired: " + photonsFired + " -- colored pixels: " + coloredPixels);
        }

        if(e.data.type == "stop-render-acknowledge") {
            activeWorkers--;
        }
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




    videoWriter = new WebMWriter({
        quality: 1,    // WebM image quality from 0.0 (worst) to 1.0 (best)
        fileWriter: null, // FileWriter in order to stream to a file instead of buffering to memory (optional)
        fd: null,         // Node.js file handle to write to instead of buffering to memory (optional)
    
        // You must supply one of:
        frameDuration: null, // Duration of frames in milliseconds
        frameRate: 60,       // Number of frames per second
    });



    requestAnimationFrame(renderSample);
}






let prepareNextVideoFrameSteps = {
    STOP_WORKERS: 0,
    WAITING_WORKERS_BLOCK: 3,
    ALL_WORKERS_BLOCKED: 1,
    ALL_WORKERS_ACTIVE: 2,
    currentStep: 2,
}
function prepareNextVideoFrame() {
    if(prepareNextVideoFrameSteps.currentStep === prepareNextVideoFrameSteps.ALL_WORKERS_ACTIVE) {
        return true;
    }



    if(prepareNextVideoFrameSteps.currentStep === prepareNextVideoFrameSteps.STOP_WORKERS) {

        for(let i = 0; i < Globals.workersCount; i++) {
            workers[i].postMessage({ type: "stop-rendering" });
        }

        prepareNextVideoFrameSteps.currentStep = prepareNextVideoFrameSteps.WAITING_WORKERS_BLOCK;
    }

    if(prepareNextVideoFrameSteps.currentStep === prepareNextVideoFrameSteps.WAITING_WORKERS_BLOCK) {
        if(activeWorkers === 0) {
            prepareNextVideoFrameSteps.currentStep = prepareNextVideoFrameSteps.ALL_WORKERS_BLOCKED;
            resetAccumulatedSamples();
        }
    }

    if(prepareNextVideoFrameSteps.currentStep === prepareNextVideoFrameSteps.ALL_WORKERS_BLOCKED) {
        
        for(let i = 0; i < Globals.workersCount; i++) {
            workers[i].postMessage({ type: "compute-next-video-frame", frameNumber: currentVideoFrame });
        }

        activeWorkers = Globals.workersCount;
        prepareNextVideoFrameSteps.currentStep = prepareNextVideoFrameSteps.ALL_WORKERS_ACTIVE;
    }

    return false; // not completed
}


function resetAccumulatedSamples() {
    var length = canvasSize.width * canvasSize.height * 3;
    for (let i = 0; i < length; i++) {
        sharedArray[i] = 0;
    }
    for (let i = 0; i < Globals.workersCount; i++) {
        sharedArray2[i] = 0;
    }

    photonsFired  = 0;
    coloredPixels = 0;
    videoPhotonsCounter = 0;
}


function renderSample() {
    requestAnimationFrame(renderSample);
    if(Globals.registerVideo && !prepareNextVideoFrame()) return;

    // if(!needsUpdate) return;
    // needsUpdate = false;




	var imageData = imageDataObject.data;

    let mapped = vec3.create();
    let hdrColor = vec3.create();
    let gamma    = Globals.gamma;
    let exposure = Globals.exposure;


    // counting how many photons have been traced, each worker will update its slot in sharedArray2
    let photonsCount = 0;
    for (let i = 0; i < Globals.workersCount; i++) {
        photonsCount += sharedArray2[i];
    }



    // fill with base color
    for (var i = 0; i < canvasSize.width * canvasSize.height * 4; i += 4)
    {
        let pixelIndex = Math.floor(i / 4);
        let y = canvasSize.height - 1 - Math.floor(pixelIndex / canvasSize.width);
        let x = pixelIndex % canvasSize.width;

        let index = (y * canvasSize.width + x) * 3;

        // let r = Atomics.load(sharedArray, index + 0) / (photonsFired * 0.001);
        // let g = Atomics.load(sharedArray, index + 1) / (photonsFired * 0.001);
        // let b = Atomics.load(sharedArray, index + 2) / (photonsFired * 0.001);

        let r = sharedArray[index + 0] / (photonsCount);
        let g = sharedArray[index + 1] / (photonsCount);
        let b = sharedArray[index + 2] / (photonsCount);


        // tone mapping
        if(Globals.toneMapping) {
            // Exposure tone mapping
            // from: https://learnopengl.com/Advanced-Lighting/HDR
            mapped[0] = 1 - Math.exp(-r * exposure);
            mapped[1] = 1 - Math.exp(-g * exposure);
            mapped[2] = 1 - Math.exp(-b * exposure);

            mapped[0] = Math.pow(mapped[0], 1 / gamma);
            mapped[1] = Math.pow(mapped[1], 1 / gamma);
            mapped[2] = Math.pow(mapped[2], 1 / gamma);

            r = mapped[0] * 255;
            g = mapped[1] * 255;
            b = mapped[2] * 255;
        } else {
            r *= 255;
            g *= 255;
            b *= 255;
        }


        if(r > 255) r = 255;
        if(g > 255) g = 255;
        if(b > 255) b = 255;

        imageData[i + 0] = r;
        imageData[i + 1] = g;
        imageData[i + 2] = b;
        imageData[i + 3] = 255;
    }

    context.putImageData(imageDataObject, 0, 0);






    if(Globals.registerVideo) {
        if((photonsCount - videoPhotonsCounter) > Globals.photonsPerVideoFrame) {

            videoPhotonsCounter = photonsCount;    
    
            if(currentVideoFrame >= Globals.framesCount) {
                videoWriter.complete().then(function(webMBlob) {
                    download(webMBlob, "video.webm", 'video/webm');
                });
    
                videoPhotonsCounter = Infinity;
            } else {
                currentVideoFrame++;
                prepareNextVideoFrameSteps.currentStep = prepareNextVideoFrameSteps.STOP_WORKERS;
    
                console.log("new frame saved -- " + currentVideoFrame);
    
                videoWriter.addFrame(canvas);
            }
        }
    }
}



// function debugBvh() {
    
//     scene = new Scene();    
    
//     let edgesCount = 500;
//     for(let i = 0; i < edgesCount; i++) {
//         let x  = ( Math.random() * 2 - 1 ) * 0.35;
//         let y  = ( Math.random() * 2 - 1 ) * 0.35;
//         let ex = ( Math.random() * 2 - 1 ) * 0.35;
//         let ey = ( Math.random() * 2 - 1 ) * 0.35;

//         let ox = Math.random() * 17.9 - 8.9;
//         let oy = Math.random() * 17.9 - 8.9;

//         // let edge = new Edge(x, y, x, y + 1);
//         let edge = new Edge(x + ox, y + oy, ex + ox, ey + oy);
//         scene.add(edge);
//     }

//     let ray  = new Ray(vec2.fromValues(6, 0), vec2.fromValues(-0.7, 0.7));

//     scene.add(new Edge(-9, -9, -9, 9));

//     let bvh = new BVH(scene._objects);
//     // WORLD_SIZE has changed since this function was created! it now allows for differing widths and heights
//     bvh.debug(context, canvasSize, canvasSize, Globals.WORLD_SIZE / 2, Globals.WORLD_SIZE / 2, ray);
// }