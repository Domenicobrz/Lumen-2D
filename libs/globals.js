var Globals = {
    epsilon: 0.000025,

    RENDER_TYPE_NOISE: true,
    PHOTONS_PER_FRAME: 10000,

    WORLD_SIZE: 20,     // effectively means the horizontal extent will be
                        // [ -WORLD_SIZE/2 ,  +WORLD_SIZE/2 ]
                        // the specified size is related to the height of the viewport, the width depends on the aspect ratio
    worldAttenuation: 0.2, 
    LIGHT_BOUNCES: 15,

    canvasSize: { 
        width:  1910,
        height: 995,
    },


    workersCount: 1,


    // Reinhard tonemapping settings
    toneMapping: true,
    gamma: 2.2,
    exposure: 1,
    // Reinhard tonemapping settings - END
}

export { Globals };