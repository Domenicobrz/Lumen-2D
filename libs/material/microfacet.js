import { Material } from "./material.js";
import { glMatrix, vec2, mat2 } from "./../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";

class MicrofacetMaterial extends Material {
    constructor(options) {
        super();

        if(!options) options = { };

                       // remember: 0 is a valid opacity option, so we need to check for undefined instead of just going   options.opacity || 1
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
        this.roughness = options.roughness !== undefined ? options.roughness : 0.25;
    }

    computeScattering(ray, input_normal, t, contribution, worldAttenuation, wavelength) {

        let scatterResult = { };

        // opacity test, if it passes we're going to let the ray pass through the object
        if(Math.random() > this.opacity) {

            // Compute contribution BEFORE CHANGING THE RAY.O ARRAY!
            // let dot = Math.abs(  vec2.dot(ray.d, input_normal)  );
            // let absorbtionDifference = 1 - dot;
            // let opacityDot = dot + absorbtionDifference * (1 - this.opacity);

            // contribution *= opacityDot;
            let wa = Math.exp(-t * worldAttenuation);
            contribution.r *= wa;
            contribution.g *= wa;
            contribution.b *= wa;


            let newOrigin = vec2.create();
            vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t + Globals.epsilon); // it's important that the epsilon value is subtracted/added instead of doing t * 0.999999 since that caused floating point precision issues
            vec2.copy(ray.o, newOrigin);

 
            return;
        }



        // we're going to pick a random point in the hemisphere
        let dot = vec2.dot(ray.d, input_normal);   // ** REMEMBER !! **    the dot between ray.d & normal here is expected to be LESS than zero! 
                                                   //                      that's because the incident light ray should normally be negated before making the dot product
        let normal = vec2.clone(input_normal);
        if(dot > 0.0) {     // if it's greater than zero, we have a problem!  see here ^^^
            vec2.negate(normal, normal);
        }            




        // Compute contribution BEFORE CHANGING THE RAY.O ARRAY!
        // one of your older bug involved placing those lines AFTER changing the ray.o array
        dot = Math.abs(  vec2.dot(ray.d, input_normal)  );

        
        let contrib = Math.exp(-t * worldAttenuation) * dot;
        contribution.r *= contrib;
        contribution.g *= contrib;
        contribution.b *= contrib;


        let newDirection = vec2.create();














        // evaluate BRDF
        let w_o = vec2.fromValues(-ray.d[0], -ray.d[1]);


        // normal rotation matrix
        let mat = mat2.fromValues(normal[1], -normal[0], normal[0], normal[1]);
        let imat = mat2.create();
        mat2.invert(imat, mat);
        vec2.transformMat2(w_o, w_o, imat);

        let thetaMin = Math.max(Math.asin(w_o[0]), 0.0) - (Math.PI / 2);
        let thetaMax = Math.min(Math.asin(w_o[0]), 0.0) + (Math.PI / 2);

        let s = this.roughness;
        let xi = Math.random();
        let a = Math.tanh(thetaMin/(2.0*s));
        let b = Math.tanh(thetaMax/(2.0*s));
        let thetaM =  2.0*s*Math.atanh(a + (b - a)*xi);
        
        let m = vec2.fromValues(Math.sin(thetaM), Math.cos(thetaM));
        
        let w_oDm = vec2.dot(w_o, m);
        m[0] = m[0] * (w_oDm * 2) - w_o[0];
        m[1] = m[1] * (w_oDm * 2) - w_o[1];
        // return m*(dot(w_o, m)*2.0) - w_o;
        vec2.transformMat2(m, m, mat);

        vec2.copy(newDirection, m);
        vec2.normalize(newDirection, newDirection);
        // evaluate BRDF - END

        












        // bounce off again
        let newOrigin = vec2.create();
        vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t - Globals.epsilon); // it's important that the epsilon value is subtracted/added instead of doing t * 0.999999 since that caused floating point precision issues
    

        vec2.copy(ray.o, newOrigin);
        vec2.copy(ray.d, newDirection);    

    }
}

export { MicrofacetMaterial }