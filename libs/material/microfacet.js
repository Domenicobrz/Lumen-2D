import { Material } from "./material.js";
import { glMatrix, vec2, mat2 } from "./../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";

class MicrofacetMaterial extends Material {
    constructor(options) {
        super(options);

        if(!options) options = { };

        this.roughness = options.roughness !== undefined ? options.roughness : 0.25;
    }

    computeScattering(ray, input_normal, t, contribution, worldAttenuation, wavelength) {

        // opacity test, if it passes we're going to let the ray pass through the object
        if(this.opacityTest(t, worldAttenuation, ray, contribution)) {
            return;
        }



        let dot = vec2.dot(ray.d, input_normal);
        let normal = vec2.clone(input_normal);
        if(dot > 0.0) {
            vec2.negate(normal, normal);
        }            

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

        









        let newOrigin = vec2.create();
        vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t - Globals.epsilon); 

        vec2.copy(ray.o, newOrigin);
        vec2.copy(ray.d, newDirection);    
    }
}

export { MicrofacetMaterial }