import { Material } from "./material.js";
import { glMatrix, vec2, mat2 } from "./../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";

class LambertMaterial extends Material {
    constructor(options) {
        super(options);

        if(!options) options = { };

        this.color   = options.color !== undefined ? options.color : [1,1,1];
    }

    computeScattering(ray, input_normal, t, contribution, worldAttenuation, wavelength) {

        
        // opacity test, if it passes we're going to let the ray pass through the object
        if(this.opacityTest(t, worldAttenuation, ray, contribution, this.color)) {
            return;
        }



        let dot = vec2.dot(ray.d, input_normal);
        let normal = vec2.clone(input_normal);
        if(dot > 0.0) { 
            vec2.negate(normal, normal);
        }            


        dot = Math.abs(  vec2.dot(ray.d, input_normal)  );



        let contrib = Math.exp(-t * worldAttenuation)  *  dot;
        contribution.r *= contrib * this.color[0];
        contribution.g *= contrib * this.color[1];
        contribution.b *= contrib * this.color[2];


        

        let newDirection = vec2.create();

        // evaluate BRDF
        let xi = Math.random();
        let sinThetaI = 2 * xi - 1;
        let cosThetaI = Math.sqrt(1 - sinThetaI*sinThetaI);
        let tv1 = vec2.fromValues(sinThetaI, cosThetaI);

        // normal rotation matrix
        let m = mat2.fromValues(normal[1], -normal[0], normal[0], normal[1]);
        vec2.transformMat2(tv1, tv1, m);

        vec2.copy(newDirection, tv1);
        // evaluate BRDF - END

        

        // bounce off again
        let newOrigin = vec2.create();
        // it's important that the epsilon value is subtracted/added instead of doing t * 0.999999 since that caused floating point precision issues
        vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t - Globals.epsilon);
        

        vec2.copy(ray.o, newOrigin);
        vec2.copy(ray.d, newDirection);    

    }
}

export { LambertMaterial }