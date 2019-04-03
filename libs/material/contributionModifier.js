import { Material } from "./material.js";
import { glMatrix, vec2, mat2 } from "./../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";

class ContributionModifierMaterial extends Material {
    constructor(options) {
        super();

        if(!options) options = { };

        this.modifier = options.modifier !== undefined ? options.modifier : 0;
    }

    computeScattering(ray, input_normal, t, contribution, worldAttenuation, wavelength) {

        let scatterResult = { };

        // Compute contribution BEFORE CHANGING THE RAY.O ARRAY!
        let dot = vec2.dot(ray.d, input_normal);
        
        if (dot < 0) { // light is entering the surface
            contribution += this.modifier;      
        } else {       // light is exiting the surface, restore original contribution
            contribution -= this.modifier;            
        }

        contribution *= Math.exp(-t * worldAttenuation);


        let newOrigin = vec2.create();            // light needs to always pass through the object with this material
        vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t + Globals.epsilon); 
        vec2.copy(ray.o, newOrigin);

        scatterResult.contribution = contribution;
 
        return { contribution: contribution };
    }
}

export { ContributionModifierMaterial }