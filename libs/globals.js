var Globals = {
    epsilon: 0.00005,

    // if set to true, uses Float64Arrays, which are 2x slower to work on
    highPrecision: false,


    RENDER_TYPE_NOISE: true,
    PHOTONS_PER_FRAME: 10000,

    WORLD_SIZE: 20,     // effectively means the horizontal extent will be
                        // [ -WORLD_SIZE/2 ,  +WORLD_SIZE/2 ]
                        // the specified size is related to the height of the viewport, the width depends on the aspect ratio
    worldAttenuation: 0.2, 
    LIGHT_BOUNCES: 25,
    skipBounce: 0,      // skips n bounces before drawing the color value to the screen


    canvasSize: { 
        width:  1910,
        height: 995,
    },


    workersCount: 5,


    // Reinhard tonemapping settings
    toneMapping: true,
    gamma: 2.2,
    exposure: 1,
    // Reinhard tonemapping settings - END
}

export { Globals };