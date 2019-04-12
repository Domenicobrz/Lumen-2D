import { Globals } from "./globals.js";
import { glMatrix, vec2, mat2, vec3 } from "./dependencies/gl-matrix-es6.js";
import { VideoManager } from "./videoManager.js";

window.addEventListener("load", init);

var canvas;
var context;
var imageDataObject;

var canvasSize = Globals.canvasSize;
var sharedArray;
// used to track how many photons have been fired by each worker
var sharedInfoArray;

var photonsFired  = 0;
var coloredPixels = 0;

var workers = [];

var videoManager;

function init() {
    canvas = document.getElementById('canvas');
	canvas.width  = canvasSize.width;
	canvas.height = canvasSize.height;
	context = canvas.getContext('2d');
    imageDataObject = context.createImageData(canvasSize.width, canvasSize.height);

    

    var canvasPixelsCount = canvasSize.width * canvasSize.height * 3;
    var size = Float32Array.BYTES_PER_ELEMENT * canvasPixelsCount;
    var sharedBuffer = new SharedArrayBuffer(size); 
    // will be used to store information on photons traced
    var sharedInfoBuffer = new SharedArrayBuffer(Globals.workersCount * 4); 
    sharedArray     = new Float32Array(sharedBuffer);
    sharedInfoArray = new Float32Array(sharedInfoBuffer);
    for (let i = 0; i < canvasPixelsCount; i++) {
        sharedArray[i] = 0;
    }
    for (let i = 0; i < Globals.workersCount; i++) {
        sharedInfoArray[i] = 0;
    }

    

    startWebworkers(sharedBuffer, sharedInfoBuffer);


    videoManager = new VideoManager(Globals, workers, canvas);
    videoManager.addEventListener("reset-samples", resetAccumulatedSamples);


    requestAnimationFrame(renderSample);
}


function startWebworkers(sharedBuffer, sharedInfoBuffer) {
    let startWorkerMessage = {
        messageType: "start",
        sharedBuffer: sharedBuffer,
        sharedInfoBuffer: sharedInfoBuffer,
        workerIndex: 0,
        Globals: Globals,
    };

    let onWorkerMessage = e => {
        if(e.data.messageType == "photons-fired-update") {

            let message = e.data;
            let workerPhotonsFired = e.data.photonsFired;
    
            photonsFired += workerPhotonsFired;
            coloredPixels += e.data.coloredPixels;
         
            console.log("photons fired: " + photonsFired + " -- colored pixels: " + coloredPixels);
        }

        if(e.data.messageType == "stop-render-acknowledge") {
            videoManager.onWorkerAcknowledge();
        }
    };

    let onWorkerError = e => {
        console.log(e);
    }

    let workersCount = Globals.workersCount;
    for(let i = 0; i < workersCount; i++) {
        workers.push(new Worker("./libs/worker.js", { type: "module" }));
        startWorkerMessage.workerIndex = i;
        workers[i].postMessage(startWorkerMessage);
        workers[i].onmessage = onWorkerMessage;
    }
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
}


function renderSample() {
    requestAnimationFrame(renderSample);
    if(Globals.registerVideo && videoManager.preparingNextFrame) return;


	var imageData = imageDataObject.data;

    let mappedColor = vec3.create();
    let gamma       = Globals.gamma;
    let exposure    = Globals.exposure;


    // counting how many photons have been traced, each worker will update its own slot in sharedInfoArray
    let photonsCount = 0;
    for (let i = 0; i < Globals.workersCount; i++) {
        photonsCount += sharedInfoArray[i];
    }


    for (var i = 0; i < canvasSize.width * canvasSize.height * 4; i += 4) {
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
            mappedColor[0] = 1 - Math.exp(-r * exposure);
            mappedColor[1] = 1 - Math.exp(-g * exposure);
            mappedColor[2] = 1 - Math.exp(-b * exposure);

            mappedColor[0] = Math.pow(mappedColor[0], 1 / gamma);
            mappedColor[1] = Math.pow(mappedColor[1], 1 / gamma);
            mappedColor[2] = Math.pow(mappedColor[2], 1 / gamma);

            r = mappedColor[0] * 255;
            g = mappedColor[1] * 255;
            b = mappedColor[2] * 255;
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
        videoManager.update(photonsCount);
    }
}