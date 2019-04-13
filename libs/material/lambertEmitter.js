import { Material } from "./material.js";
import { Ray } from "../ray.js";
import { glMatrix, vec2, mat2, vec3 } from "../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";
import { EmitterMaterial } from "./emitter.js";

class LambertEmitterMaterial extends EmitterMaterial {
    constructor(options) {
        super(options);

        if(!options) options = { };

        this.color        = options.color !== undefined ? options.color : [1,1,1];
        this.sampleWeight = options.sampleWeight !== undefined ? options.sampleWeight : 1;
        // can be undefined, if it is, the color array will be used to get a sampling power for this lightsource
        this.samplePower  = options.samplePower;
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


        let contrib = Math.exp(-t * worldAttenuation)  *  dot;
        contribution.r *= contrib;
        contribution.g *= contrib;
        contribution.b *= contrib;






        
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


    getSpectrum(color) {
        let spectrum;
        
        if(Array.isArray(color)) {
            spectrum = {
                color: color
            }
        }

        if(typeof color === "function") {
            spectrum = color();
        }

        return spectrum;
    }

    getPhoton(geometryObject) {
        let res = geometryObject.getRandomPoint();
        let point = res.p;
        // avoids self-intersections
        point[0] += res.normal[0] * 0.00001;    // normals are always normalized to a length of 1, so there shouldn't be a precision problem with *= 0.00001
        point[1] += res.normal[1] * 0.00001;
        let input_normal = res.normal;
        

        let newDirection = vec2.create();

        // evaluate BRDF
        let xi = Math.random();
        let sinThetaI = 2 * xi - 1;
        let cosThetaI = Math.sqrt(1 - sinThetaI*sinThetaI);
        let tv1 = vec2.fromValues(sinThetaI, cosThetaI);

        // normal rotation matrix
        let m = mat2.fromValues(input_normal[1], -input_normal[0], input_normal[0], input_normal[1]);
        vec2.transformMat2(tv1, tv1, m);

        vec2.copy(newDirection, tv1);
        // evaluate BRDF - END

        let spectrum = this.getSpectrum(this.color);

        return {
            ray:   new Ray(point, newDirection),
            spectrum: spectrum
        }
    }
}

export { LambertEmitterMaterial }