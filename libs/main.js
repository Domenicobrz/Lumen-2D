import { Globals } from "./globals.js";
import { glMatrix, vec2, mat2, vec3 } from "./dependencies/gl-matrix-es6.js";
import { download } from "./dependencies/download.js";
import "./dependencies/webm-writer-0.2.0.js";



window.addEventListener("load", init);

var canvas;
var context;
var imageDataObject;

var canvasSize = Globals.canvasSize;
var sharedBuffer;
var sharedArray;
// used to track how many photons have been fired
var sharedInfoBuffer;
var sharedInfoArray;
var photonsFired  = 0;
var coloredPixels = 0;
var videoPhotonsCounter = 0;


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


    if(!Globals.RENDER_TYPE_NOISE) {
        console.warn("The line sampling integrator is deprecated, RENDER_TYPE_NOISE now always defaults to true");
    }


    var canvasPixelsCount = canvasSize.width * canvasSize.height * 3;
    var size = Float32Array.BYTES_PER_ELEMENT * canvasPixelsCount;
    var sharedBuffer = new SharedArrayBuffer(size); 
    // will be used to store information on photons traced
    var sharedInfoBuffer = new SharedArrayBuffer(Globals.workersCount * 4); 
    sharedArray = new Float32Array(sharedBuffer);
    sharedInfoArray = new Float32Array(sharedInfoBuffer);
    for (let i = 0; i < canvasPixelsCount; i++) {
        sharedArray[i] = 0;
    }
    for (let i = 0; i < Globals.workersCount; i++) {
        sharedInfoArray[i] = 0;
    }

    let startWorkerMessage = {
        type: "start",
        sharedBuffer: sharedBuffer,
        sharedInfoBuffer: sharedInfoBuffer,
        workerIndex: 0,
        Globals: Globals,
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




    let workersCount = Globals.workersCount;
    for(let i = 0; i < workersCount; i++) {
        workers.push(new Worker("./libs/worker.js", { type: "module" }));
        startWorkerMessage.workerIndex = i;
        workers[i].postMessage(startWorkerMessage);
        workers[i].onmessage = onWorkerMessage;
    }




    videoWriter = new WebMWriter({
        quality: 1,    // WebM image quality from 0.0 (worst) to 1.0 (best)
        fileWriter: null, // FileWriter in order to stream to a file instead of buffering to memory (optional)
        fd: null,         // Node.js file handle to write to instead of buffering to memory (optional)
    
        // You must supply one of:
        frameDuration: null, // Duration of frames in milliseconds
        frameRate: Globals.framesPerSecond, // Number of frames per second
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


    // stop every active webworker
    if(prepareNextVideoFrameSteps.currentStep === prepareNextVideoFrameSteps.STOP_WORKERS) {

        for(let i = 0; i < Globals.workersCount; i++) {
            workers[i].postMessage({ type: "stop-rendering" });
        }

        prepareNextVideoFrameSteps.currentStep = prepareNextVideoFrameSteps.WAITING_WORKERS_BLOCK;
    }

    // wait until all webworkers have received the stop message and acknowledged it,
    // then reset the current canvas state to prepare for a new frame
    if(prepareNextVideoFrameSteps.currentStep === prepareNextVideoFrameSteps.WAITING_WORKERS_BLOCK) {
        if(activeWorkers === 0) {
            prepareNextVideoFrameSteps.currentStep = prepareNextVideoFrameSteps.ALL_WORKERS_BLOCKED;
            resetAccumulatedSamples();
        }
    }

    // restart all webworkers and start computing the next video frame
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
        sharedInfoArray[i] = 0;
    }

    photonsFired  = 0;
    coloredPixels = 0;
    videoPhotonsCounter = 0;
}


function renderSample() {
    requestAnimationFrame(renderSample);
    if(Globals.registerVideo && !prepareNextVideoFrame()) return;


	var imageData = imageDataObject.data;

    let mapped = vec3.create();
    let gamma    = Globals.gamma;
    let exposure = Globals.exposure;


    // counting how many photons have been traced, each worker will update its own slot in sharedInfoArray
    let photonsCount = 0;
    for (let i = 0; i < Globals.workersCount; i++) {
        photonsCount += sharedInfoArray[i];
    }


    for (var i = 0; i < canvasSize.width * canvasSize.height * 4; i += 4)
    {
        let pixelIndex = Math.floor(i / 4);
        let y = canvasSize.height - 1 - Math.floor(pixelIndex / canvasSize.width);
        let x = pixelIndex % canvasSize.width;

        let index = (y * canvasSize.width + x) * 3;

        let r = sharedArray[index + 0] / (photonsCount);
        let g = sharedArray[index + 1] / (photonsCount);
        let b = sharedArray[index + 2] / (photonsCount);


        // Exposure tone mapping
        // from: https://learnopengl.com/Advanced-Lighting/HDR
        if(Globals.toneMapping) {
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
        // if the amount of photons fired since last frame exceeds the value in Globals.photonsPerVideoFrame
        // begin webworkers synchronization to reset their state and compute a new frame
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
    
                console.log("video frame saved: " + currentVideoFrame);
    
                videoWriter.addFrame(canvas);
            }
        }
    }
}