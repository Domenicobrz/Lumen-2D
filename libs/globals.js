var Globals = {
    epsilon: 0.00005,

    // if set to true, uses Float64Arrays, which are 2x slower to work with
    highPrecision: false,

    // number of webworkers to spawn 
    workersCount: 5,

    RENDER_TYPE_NOISE: true,
    PHOTONS_PER_UPDATE: 10000,
    USE_STRATIFIED_SAMPLING: true,
    // variable determining how many samples are drawn from a line
    // eg. if a light ray is "200 pixels long" the amount of pixels actually drawn
    // would be     floor(light_ray_pixel_length * samplingRatioPerPixelCovered);
    // range: [0...1]
    // values towards one will draw more samples per line, so expect more pixels drawn but
    // a lower number of photons fired
    // values towards zero will draw less samples per line, so expect less pixels drawn but
    // a bigger number of photons fired
    samplingRatioPerPixelCovered: 0.14,

    WORLD_SIZE: 20,     // effectively means the horizontal extent will be
                        // [ -WORLD_SIZE/2 ,  +WORLD_SIZE/2 ]
                        // the specified size is related to the height of the viewport, the width depends on the aspect ratio
    worldAttenuation: 0.2, 
    LIGHT_BOUNCES: 35,
    skipBounce: 0,      // skips n bounces before drawing the color value to the screen







    registerVideo: false,
    photonsPerVideoFrame: 10000,
    framesPerSecond: 30,
    framesCount: 30,
    frameStart: 0,

    motionBlur: false,
    motionBlurFramePhotons: 15000, 

    // activating an oc canvas slows down render times by about 1.8x
    deactivateOffscreenCanvas: true,
    offscreenCanvasCPow: 2,






    canvasSize: { 
        width:  400,
        height: 400,
    },




    // Reinhard tonemapping settings
    toneMapping: true,
    gamma: 2.2,
    exposure: 1,
    // Reinhard tonemapping settings - END
}

export { Globals };