import { glMatrix, vec2, mat2 } from "./../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";

class Material {
    constructor(options) {
        if(!options) options = { };

        // remember: 0 is a valid opacity option, so we need to check for undefined instead of just going with: options.opacity || 1
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
    }

    opacityTest(t, worldAttenuation, ray, contribution) {
        // opacity test, if it passes we're going to let the ray pass through the object
        if(Math.random() > this.opacity) {

            let wa = Math.exp(-t * worldAttenuation);
            contribution.r *= wa;
            contribution.g *= wa;
            contribution.b *= wa;


            let newOrigin = vec2.create();
            // it's important that the epsilon value is subtracted/added instead of doing t * 0.999999 since that caused floating point precision issues
            vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t + Globals.epsilon); 
            vec2.copy(ray.o, newOrigin);

            return true;
        }

        return false;
    }

    computeScattering() {
        
    }
}

export { Material }