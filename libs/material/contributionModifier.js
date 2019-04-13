import { Material } from "./material.js";
import { glMatrix, vec2, mat2 } from "./../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";

class ContributionModifierMaterial extends Material {
    constructor(options) {
        super(options);

        if(!options) options = { };

        this.modifier = options.modifier !== undefined ? options.modifier : 0;
    }

    computeScattering(ray, input_normal, t, contribution, worldAttenuation, wavelength) {

        let dot = vec2.dot(ray.d, input_normal);
        
        if (dot < 0) { // light is entering the surface
            contribution.r *= this.modifier;      
            contribution.g *= this.modifier;      
            contribution.b *= this.modifier;      
        } else {       // light is exiting the surface, restore original contribution
            // restore contribution previous to hitting this object
            contribution.r *= (1 / this.modifier);    
            contribution.g *= (1 / this.modifier);    
            contribution.b *= (1 / this.modifier);    
        }


        let wa = Math.exp(-t * worldAttenuation);
        contribution.r *= wa;
        contribution.g *= wa;
        contribution.b *= wa;


        let newOrigin = vec2.create();            // light needs to always pass through the object with this material
        vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t + Globals.epsilon); 
        vec2.copy(ray.o, newOrigin);
    }
}

export { ContributionModifierMaterial }