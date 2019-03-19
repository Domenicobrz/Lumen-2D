var Globals = {
    epsilon: 0.0001,

    RENDER_TYPE_NOISE: true,
    PHOTONS_PER_FRAME: 8000,

    WORLD_SIZE: 20,     // effectively means the horizontal extent will be
                        // [ -WORLD_SIZE/2 ,  +WORLD_SIZE/2 ]
    LIGHT_BOUNCES: 15,
}

export { Globals };