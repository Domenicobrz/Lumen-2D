import { Material } from "./material.js";
import { glMatrix, vec2, mat2 } from "./../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";

class ContributionModifierMaterial extends Material {
    constructor(options) {
        super();

        if(!options) options = { };

        // the modifier needs to be a multiplicative value, because we can't 
        // "restore" contribution prior to a subtraction
        // here's why:  suppose the current contribution is 0.1, and modifier is a negative 0.3 value
        // you would subtract only 0.1 to prevent the contribution from being negative (negative contributions are skipped in worker.js 
        // for performance reasons) but when light exits the object, you would add 0.3! gaining a net 0.2 increase in contribution
        // this problem doesn't occur with muliplicative modifiers
        this.modifier = options.modifier !== undefined ? options.modifier : 0;
    }

    computeScattering(ray, input_normal, t, contribution, worldAttenuation, wavelength) {

        let scatterResult = { };

        // Compute contribution BEFORE CHANGING THE RAY.O ARRAY!
        let dot = vec2.dot(ray.d, input_normal);
        
        if (dot < 0) { // light is entering the surface
            contribution *= this.modifier;      

        } else {       // light is exiting the surface, restore original contribution
            // restore contribution previous to hitting this object
            contribution *= (1 / this.modifier);    
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