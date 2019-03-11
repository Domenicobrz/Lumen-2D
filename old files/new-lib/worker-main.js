import { Scene } from "./scene.js";
import { StraightEdge } from "./geometry/StraightEdge.js";
import { Circle } from "./geometry/Circle.js";
import { Ray } from "./ray.js";
import { Pixel } from "./pixel.js";
import { MatteMaterial } from "./material/matte.js";
import { EmitterMaterial } from "./material/emitter.js";
import { glMatrix, vec2 } from "./dependencies/gl-matrix-es6.js";


window.addEventListener("load", init);

var canvas;
var context;
var imageDataObject;

var pixelBuffer = [];   // multidimensional array
var canvasSize = 800;
var photonsFired  = 0;
var coloredPixels = 0;
var scene;

var RENDER_TYPE_NOISE = true;
var PHOTONS_PER_FRAME = 100000;
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


    for(let i = 0; i < canvasSize; i++) {
        pixelBuffer.push([ ]);

        for(let j = 0; j < canvasSize; j++) {
            pixelBuffer[i].push(new Pixel(j, canvasSize - i - 1));
        }
    }





    let startWorkerObject = {
        type: "start",
        scene: { },
        canvasSize: canvasSize,
        PHOTONS_PER_FRAME: PHOTONS_PER_FRAME,
        RENDER_TYPE_NOISE: RENDER_TYPE_NOISE,
    };

    let onWorkerMessage = e => {
        let message = e.data;
        let workerPhotonsFired = e.data.photonsFired;
        let workerComputedBuffer = e.data.buffer;

        photonsFired += workerPhotonsFired;
        coloredPixels += e.data.coloredPixels;
        for(let i = 0; i < canvasSize; i++)
        for(let j = 0; j < canvasSize; j++) {
            let pixel = pixelBuffer[i][j];

            if(pixel.r === undefined) {
                pixel.r = 0;
                pixel.g = 0;
                pixel.b = 0;
            }

            pixel.r += workerComputedBuffer[i][j].r;
            pixel.g += workerComputedBuffer[i][j].g;
            pixel.b += workerComputedBuffer[i][j].b;
        }

        needsUpdate = true;
    };


    // worker.postMessage(startWorkerObject);
    // worker.onmessage = onWorkerMessage;

    for(let i = 0; i < 5; i++) {
        workers.push(new Worker("./new-lib/worker.js", { type: "module" }));
        workers[i].postMessage(startWorkerObject);
        workers[i].onmessage = onWorkerMessage;
    }







    window.addEventListener("keypress", function(e) {
        if(e.key == "k") {
            PHOTONS_PER_FRAME *= 2;
        }
        if(e.key == "j") {
            frameSkipperValue /= 2;
        }
    });


    requestAnimationFrame(renderSample);
}


function renderSample() {
    requestAnimationFrame(renderSample);
    if(!needsUpdate) return;
    needsUpdate = false;

    console.log("photons fired: " + photonsFired + " -- colored pixels: " + coloredPixels);


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

        let r = pixelBuffer[y][x].r / (photonsFired * 0.1);
        let g = pixelBuffer[y][x].g / (photonsFired * 0.1);
        let b = pixelBuffer[y][x].b / (photonsFired * 0.1);

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