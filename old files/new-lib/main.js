import { Scene } from "./scene.js";
import { StraightEdge } from "./geometry/StraightEdge.js";
import { Circle } from "./geometry/Circle.js";
import { Ray } from "./ray.js";
import { Pixel } from "./pixel.js";
import { MatteMaterial } from "./material/matte.js";
import { EmitterMaterial } from "./material/emitter.js";

var vec2 = glMatrix.vec2;


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
var PHOTONS_PER_FRAME = 1000;
var frameSkipperValue = 0; // 100;
var frameSkipperCount = 0;


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


    scene = new Scene();


    let edgeMaterial = new MatteMaterial();
    let ledge = new StraightEdge(-10, -10, -10,  10);
    let redge = new StraightEdge( 10, -10,  10,  10);
    let tedge = new StraightEdge(-10,  10,  10,  10);
    let bedge = new StraightEdge(-10, -10,  10, -10);

    let circleLight = new StraightEdge(7, -8, -7, -8);



    let testcircle1 = new Circle(0,  -2, 3);
    let testcircle2 = new Circle(-6, -2.5, 1);
    let testcircle3 = new Circle(6, -3, 1.5);


    scene.add(ledge, edgeMaterial);
    scene.add(redge, edgeMaterial);
    scene.add(tedge, edgeMaterial);
    scene.add(bedge, edgeMaterial);

    scene.add(testcircle1, new MatteMaterial({ opacity: 0.85 }));
    scene.add(testcircle2, new MatteMaterial({ opacity: 0.85 }));
    scene.add(testcircle3, new MatteMaterial({ opacity: 0.7 }));

    // var s = 4.75;
    // scene.add(circleLight, new EmitterMaterial({ color: [0, 15*s, 3*s],  opacity: 0.0 }));
    scene.add(new Circle(8,-8, 0.15), new EmitterMaterial({ color: [1000,20,20],  opacity: 0.0 }));
    // scene.add(new Circle(-8,8, 1.5), new EmitterMaterial({ color: [20,20,200], opacity: 0.0 }));

    for(let i = -15; i < 15; i++) 
        for(let j = 0; j < 8; j++) {

            let s = 125;
            let r = Math.random() * s;
            let g = Math.random() * s;
            let b = Math.random() * s;
            scene.add(new Circle(i * 0.75, j * 0.5 + 5, 0.05), new EmitterMaterial({ color: [r,g,b], opacity: 0.0 }));
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


    // *********** used only for animation
    frameSkipperCount++;
    if(frameSkipperCount < frameSkipperValue) return;
    else frameSkipperCount = 0;
    // *********** used only for animation - END



    let photonCount = PHOTONS_PER_FRAME;
    let photonMult  = photonCount / 10;

    for(let i = 0; i < photonCount; i++) {
        emitPhotons();
    }

    
    photonsFired += photonCount;
    console.log("photons fired: " + photonsFired + " - colored pixels: " + coloredPixels);


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

            colorPhoton(ray, result.t, WORLD_SIZE, color, contribution, worldAttenuation);

            let object = result.object;
            let material = object.material;

            let scatterResult = object.material.computeScattering(ray, result.normal, result.t, contribution, worldAttenuation);
            contribution = scatterResult.contribution;
        }
    }
}