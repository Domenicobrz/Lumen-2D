import { Scene } from "./scene.js";
import { glMatrix, vec2 } from "./dependencies/gl-matrix-es6.js";
import { createScene } from "./createScene.js";


var canvasSize;
var scene;
var sceneArgs;
var pixelBuffer = [];
// var vec2 = glMatrix.vec2;
var coloredPixels = 0;
var frameSkipperValue = 0; // 100;
var frameSkipperCount = 0;
var sharedArray;
var sharedInfoArray;

var workerDataReference;
var workerIndex;

var WORLD_SIZE = {
    w: 0,
    h: 0,
};  
var LIGHT_BOUNCES; 

var USE_STRATIFIED_SAMPLING = false;
var SAMPLING_RATIO_PER_PIXEL_COVERED;

var Globals;
var motionBlurPhotonsCount = 0;

var offcanvas;
var offscreenCanvasCtx;
var offscreenCanvasPixels;
var offscreenPixelNormalizationFactor = 1 / 255;

var stopRendering = false;
var stopRenderingAcknowledge = false;

var currentVideoFrame = 0;

onmessage = e => {

    if(e.data.type == "start") {
        // passing globals from main.js since they could change while the app is running
        Globals = e.data.Globals;

        canvasSize = Globals.canvasSize;

        sharedArray = new Float32Array(e.data.sharedBuffer);
        sharedInfoArray = new Float32Array(e.data.sharedInfoBuffer);

        if(Globals.highPrecision)
            glMatrix.setMatrixArrayType(Float64Array);


        WORLD_SIZE.h = Globals.WORLD_SIZE;  
        WORLD_SIZE.w = Globals.WORLD_SIZE * (canvasSize.width / canvasSize.height);  
        LIGHT_BOUNCES = Globals.LIGHT_BOUNCES; 
        USE_STRATIFIED_SAMPLING = Globals.USE_STRATIFIED_SAMPLING;
        SAMPLING_RATIO_PER_PIXEL_COVERED = Globals.samplingRatioPerPixelCovered;

        workerDataReference = e.data;
        workerIndex = e.data.workerIndex;


        // we need a reference to this object since it will be used again inside the renderSample function
        sceneArgs = {
            showBVHdebug: workerIndex === 0 ? true : false,
        };
        scene = new Scene(sceneArgs);



        initOffscreenCanvas();
        createScene(scene, e.data, Math.random(), offscreenCanvasCtx, currentVideoFrame);
        // get data written to canvas
        offscreenCanvasPixels = offscreenCanvasCtx.getImageData(0, 0, offcanvas.width, offcanvas.height).data;

        requestAnimationFrame(renderSample);
    }

    if(e.data.type == "compute-next-video-frame") {
        currentVideoFrame = e.data.frameNumber;

        updateScene(Math.random());      
        motionBlurPhotonsCount = 0;

        stopRendering = false;
        stopRenderingAcknowledge = false;

        requestAnimationFrame(renderSample);
    }

    if(e.data.type == "stop-rendering") {
        stopRendering = true;
        stopRenderingAcknowledge = false;
    }

    if(e.data.type == "Globals-update") {
        Globals = e.data.Globals;
    }
};


function initOffscreenCanvas() {
    offcanvas = new OffscreenCanvas(Globals.canvasSize.width, Globals.canvasSize.height);
    offscreenCanvasCtx = offcanvas.getContext("2d");

    let verticalScale = Globals.canvasSize.height / WORLD_SIZE.h;
    
    offscreenCanvasCtx.translate(Globals.canvasSize.width / 2, Globals.canvasSize.height / 2);
    offscreenCanvasCtx.scale(verticalScale, verticalScale);

    offscreenCanvasCtx.fillStyle = "rgb(128,128,128)";
    offscreenCanvasCtx.fillRect(
        -WORLD_SIZE.w / 2 - 1, // -1 and +2 are added to make sure the edges are fully covered
        -WORLD_SIZE.h / 2 - 1, 
        +WORLD_SIZE.w + 2, 
        +WORLD_SIZE.h + 2);

    offscreenCanvasCtx.save();
}

function resetCanvasState() {
    offscreenCanvasCtx.fillStyle = "rgb(128,128,128)";
    offscreenCanvasCtx.fillRect(
        -WORLD_SIZE.w / 2 - 1, // -1 and +2 are added to make sure the edges are fully covered
        -WORLD_SIZE.h / 2 - 1, 
        +WORLD_SIZE.w + 2, 
        +WORLD_SIZE.h + 2);

    offscreenCanvasCtx.restore();
}



function updateScene(motionBlurT) {
    sceneArgs.showBVHdebug = false;
    scene.args = sceneArgs;
    scene.reset();
    resetCanvasState();
    createScene(scene, workerDataReference, motionBlurT, offscreenCanvasCtx, currentVideoFrame);
    offscreenCanvasPixels = offscreenCanvasCtx.getImageData(0, 0, offcanvas.width, offcanvas.height).data;        
}


function renderSample() {
    if(!stopRendering) {
        requestAnimationFrame(renderSample);
    } else if (!stopRenderingAcknowledge) {
        postMessage({
            type: "stop-render-acknowledge"
        });

        stopRenderingAcknowledge = true;
        return;
    }


    // also make sure to reset this
    coloredPixels = 0;

    let photonCount = Globals.PHOTONS_PER_FRAME;
    let photonMult  = photonCount / 10;

    for(let i = 0; i < photonCount; i++) {
        emitPhoton();
        sharedInfoArray[workerIndex] += 1;



        // ********** Motion blur logic 
        motionBlurPhotonsCount += 1;
        if(Globals.motionBlur && (motionBlurPhotonsCount >= Globals.motionBlurFramePhotons)) {
            updateScene(Math.random());
            motionBlurPhotonsCount = 0;
        }
        // ********** Motion blur logic - END
    }


    


    postMessage({
        type: "photons-fired-update",
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
        let SAMPLES = Math.max(  Math.floor(continuousSteps * SAMPLING_RATIO_PER_PIXEL_COVERED),  1  );
        let SAMPLES_STRENGHT = continuousSteps / SAMPLES; // think of it this way: if we should have sampled 30 pixels (with the line sampling method), but instead we're just 
                                                          // coloring two, then these two pixels need 15x times the amount of radiance
    
        let sample_step = t / SAMPLES;
        for(let i = 0; i < SAMPLES; i++) {

            let tt;
            if(USE_STRATIFIED_SAMPLING) {
                tt = sample_step * i;
                tt += sample_step * Math.random();    
            } else {
                tt = t * Math.random();
            }

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
    
                let index  = (py * canvasSize.width + px) * 3;
                let cindex = (py * canvasSize.width + px) * 4;



                let ocr = 1;
                let ocg = 1;
                let ocb = 1;

                if(!Globals.deactivateOffscreenCanvas) {
                    ocr = (offscreenCanvasPixels[cindex + 0] * offscreenPixelNormalizationFactor) * 2 - 1;
                    ocg = (offscreenCanvasPixels[cindex + 1] * offscreenPixelNormalizationFactor) * 2 - 1;
                    ocb = (offscreenCanvasPixels[cindex + 2] * offscreenPixelNormalizationFactor) * 2 - 1;
                    
                    // at this point ocr, ocg, ogb are in the range [-1 ... +1]
                    // offscreenCanvasCPow decides how "strong" the drawing effect is,
                    // by using an exponential function that extends the original  -1 ... +1 range
                    ocr = Math.exp(ocr * Globals.offscreenCanvasCPow);
                    ocg = Math.exp(ocg * Globals.offscreenCanvasCPow);
                    ocb = Math.exp(ocb * Globals.offscreenCanvasCPow);
                }



                let prevR = sharedArray[index + 0];
                let prevG = sharedArray[index + 1];
                let prevB = sharedArray[index + 2];

                let ss = SAMPLES_STRENGHT * contribution * attenuation * stepAttenuation;

                sharedArray[index + 0] = prevR + emitterColor[0] * ss * ocr;
                sharedArray[index + 1] = prevG + emitterColor[1] * ss * ocg;
                sharedArray[index + 2] = prevB + emitterColor[2] * ss * ocb;
            }
        }

        coloredPixels += SAMPLES;
    }
}


function getRGBfromWavelength(Wavelength) {
    let Gamma = 0.80;
    let IntensityMax = 255;
    let factor;
    let Red,Green,Blue;

    if((Wavelength >= 380) && (Wavelength<440)){
        Red = -(Wavelength - 440) / (440 - 380);
        Green = 0.0;
        Blue = 1.0;
    }else if((Wavelength >= 440) && (Wavelength<490)){
        Red = 0.0;
        Green = (Wavelength - 440) / (490 - 440);
        Blue = 1.0;
    }else if((Wavelength >= 490) && (Wavelength<510)){
        Red = 0.0;
        Green = 1.0;
        Blue = -(Wavelength - 510) / (510 - 490);
    }else if((Wavelength >= 510) && (Wavelength<580)){
        Red = (Wavelength - 510) / (580 - 510);
        Green = 1.0;
        Blue = 0.0;
    }else if((Wavelength >= 580) && (Wavelength<645)){
        Red = 1.0;
        Green = -(Wavelength - 645) / (645 - 580);
        Blue = 0.0;
    }else if((Wavelength >= 645) && (Wavelength<781)){
        Red = 1.0;
        Green = 0.0;
        Blue = 0.0;
    }else{
        Red = 0.0;
        Green = 0.0;
        Blue = 0.0;
    };

    // Let the intensity fall off near the vision limits

    if((Wavelength >= 380) && (Wavelength<420)){
        factor = 0.3 + 0.7*(Wavelength - 380) / (420 - 380);
    }else if((Wavelength >= 420) && (Wavelength<701)){
        factor = 1.0;
    }else if((Wavelength >= 701) && (Wavelength<781)){
        factor = 0.3 + 0.7*(780 - Wavelength) / (780 - 700);
    }else{
        factor = 0.0;
    };


    let rgb = [0,0,0];

    // Don't want 0^x = 1 for x <> 0
    rgb[0] = Red === 0 ? 0 : Math.floor(   Math.round(IntensityMax * Math.pow(Red * factor, Gamma))   );
    rgb[1] = Green === 0 ? 0 : Math.floor(   Math.round(IntensityMax * Math.pow(Green * factor, Gamma))   );
    rgb[2] = Blue === 0 ? 0 : Math.floor(   Math.round(IntensityMax * Math.pow(Blue * factor, Gamma))   );

    return rgb;
}

function getColorFromEmitterSpectrum(spectrum) {
    let color;

    if(spectrum.wavelength) {
        color = getRGBfromWavelength(spectrum.wavelength);

        color[0] *= spectrum.intensity;
        color[1] *= spectrum.intensity;
        color[2] *= spectrum.intensity;
    } else {
        color = spectrum.color;
    }

    return color;
}

function emitPhoton() {

    let emitter = scene.getEmitter();
    let photon = emitter.material.getPhoton(emitter);

    let ray = photon.ray;
    let spectrum = photon.spectrum;
    let wavelength = spectrum.wavelength; // may be undefined
    let color = getColorFromEmitterSpectrum(spectrum);


    let contribution = 1.0;                         // Globals.WORLD_SIZE refers to the vertical size of the world 
    let worldAttenuation = Globals.worldAttenuation * (1.0 / Globals.WORLD_SIZE);

    for(let i = 0; i < LIGHT_BOUNCES; i++) {
        let result = scene.intersect(ray);
        
        // if we had an intersection
        if(result.t) {


            let object = result.object;
            let material = object.material;
            

            if(i >= Globals.skipBounce)
                colorPhoton(ray, result.t /*(result.t - Globals.epsilon)*/, color, contribution, worldAttenuation);


            // ***** just used for animation 
            // let cd = Date.now();
            // while(Date.now() - cd < 10) { /* do nothing */ }
            // ***** just used for animation - END 

            let scatterResult = material.computeScattering(ray, result.normal, result.t, contribution, worldAttenuation, wavelength);
            contribution = scatterResult.contribution;


            // if you put a higher value (e.g. 0.01) here's what might happen: 
            // say you set worldAttenuation to a very high number, consequently, all your light sources were set at a very bright color,
            // at this point even a small contribution of 0.01 with a light source like: [ 3000, 3000, 3000 ] would be very visible,
            // but since you clamped it to 0.01 it wont show up at all! beware of this
            if(contribution < 0.0000000001) return;
        }
    }
}