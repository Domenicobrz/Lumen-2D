window.addEventListener("load", init);


var canvas;
var context;
var imageDataObject;

var pixelBuffer = [];   // multidimensional array
var canvasSize = 400;
var samplesTaken = 0;
var scene;


var vec2 = glMatrix.vec2;
var needsUpdate = false;


// const worker = new Worker("./libs/worker.js");
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
            pixelBuffer[i].push({});//new Pixel(j, canvasSize - i - 1));
        }
    }



    let startWorkerObject = {
        type: "start",
        scene: { },
        canvasSize: canvasSize
    };

    let onWorkerMessage = e => {
        let message = e.data;
        let workerSamplesTaken = e.data.samplesTaken;
        let workerComputedBuffer = e.data.buffer;

        samplesTaken += workerSamplesTaken;
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

    for(let i = 0; i < 12; i++) {
        workers.push(new Worker("./libs/worker.js"));
        workers[i].postMessage(startWorkerObject);
        workers[i].onmessage = onWorkerMessage;
    }


    requestAnimationFrame(renderSample);
}


function renderSample() {
    requestAnimationFrame(renderSample);
    if(!needsUpdate) return;

    // samplesTaken++;
    // console.log("sample number: " + samplesTaken);

    // for(let i = canvasSize - 1; i >= 0; i--)
    // for(let j = 0; j < canvasSize; j++) {
    //     let pixel = pixelBuffer[i][j];

    //     rayTrace(pixel);

    //     // pixel.r = y / canvasSize;
    //     // pixel.g = 0;
    //     // pixel.b = 0;
    // }

    console.log(samplesTaken);

	var imageData = imageDataObject.data;

    // fill with base color
    for (var i = 0; i < canvasSize * canvasSize * 4; i += 4)
    {
        let pixelIndex = Math.floor(i / 4);
        let x = Math.floor(pixelIndex / canvasSize);
        let y = pixelIndex % canvasSize;

        let r = pixelBuffer[x][y].r / (samplesTaken * 0.5);
        let g = pixelBuffer[x][y].g / (samplesTaken * 0.5);
        let b = pixelBuffer[x][y].b / (samplesTaken * 0.5);

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
    needsUpdate = false;
}


