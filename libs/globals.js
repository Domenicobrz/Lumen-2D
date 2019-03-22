var Globals = {
    epsilon: 0.000025,

    RENDER_TYPE_NOISE: true,
    PHOTONS_PER_FRAME: 10000,

    WORLD_SIZE: 20,     // effectively means the horizontal extent will be
                        // [ -WORLD_SIZE/2 ,  +WORLD_SIZE/2 ]
    LIGHT_BOUNCES: 15,

    workersCount: 6,
}

export { Globals };