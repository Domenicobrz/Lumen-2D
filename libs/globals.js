var Globals = {

    // Sampling 
    epsilon: 0.00005,
    highPrecision: false, // if set to true, uses Float64Arrays, which are 2x slower to work with
    USE_STRATIFIED_SAMPLING: true,
    // variable determining how many samples are drawn from a line
    // eg. if a light ray is "200 pixels long" the amount of pixels drawn
    // would be     floor(light_ray_pixel_length * samplingRatioPerPixelCovered);
    // range: [0...1]
    // values towards one will draw more samples per line, so expect more pixels drawn but
    // a lower number of photons fired
    // values towards zero will draw less samples per line, so expect less pixels drawn but
    // a bigger number of photons fired
    samplingRatioPerPixelCovered: 0.14,
    LIGHT_BOUNCES: 35,
    skipBounce: 0,      // skips n bounces before drawing the color value to the screen

    // Threading 
    workersCount: 5,
    PHOTONS_PER_UPDATE: 50000,
    
    // Environment
    WORLD_SIZE: 20,     // effectively means the horizontal extent will be
                        // [ -WORLD_SIZE/2 ,  +WORLD_SIZE/2 ]
                        // the specified size is related to the height of the viewport, the width depends on the aspect ratio
    worldAttenuation: 0.2, 
    
    // Video export
    registerVideo: false,
    photonsPerVideoFrame: 5000000,
    framesPerSecond: 30,
    framesCount: 30,
    frameStart: 0,

    // Motion blur
    motionBlur: false,
    motionBlurFramePhotons: 15000, 

    // Offscreen canvas -- activating an oc canvas slows down render times by about 1.7x
    deactivateOffscreenCanvas: true,
    offscreenCanvasCPow: 2,

    // Canvas size
    canvasSize: { 
        width:  800,
        height: 800,
    },

    // Reinhard tonemapping
    toneMapping: true,
    gamma: 2.2,
    exposure: 1,
}

export { Globals };