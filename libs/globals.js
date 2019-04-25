var Globals = {

    // Sampling 
    epsilon: 0.00005,
    highPrecision: false, // if set to true, uses Float64Arrays which are 2x slower to work with
    USE_STRATIFIED_SAMPLING: true,
    samplingRatioPerPixelCovered: 0.14,
    LIGHT_BOUNCES: 35,
    skipBounce: 0,      

    // Threading 
    workersCount: 5,
    PHOTONS_PER_UPDATE: 50000,
    
    // Environment
    WORLD_SIZE: 20, 
    worldAttenuation: 0.01, 
    
    // Video export
    registerVideo: false,
    photonsPerVideoFrame: 5000000,
    framesPerSecond: 30,
    framesCount: 30,
    frameStart: 0,

    // Motion blur
    motionBlur: true,
    motionBlurFramePhotons: 5000, 

    // Offscreen canvas
    deactivateOffscreenCanvas: true, // setting it to false slows down render times by about 1.7x
    offscreenCanvasCPow: 1.1,

    // Canvas size
    canvasSize: { 
        width:  1300,
        height: 1000,
    },

    // Reinhard tonemapping
    toneMapping: true,
    gamma: 2.2,
    exposure: 1,
}

export { Globals };