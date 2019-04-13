import { Material } from "./material.js";
import { Ray } from "../ray.js";
import { glMatrix, vec2, mat2, vec3 } from "../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";
import { EmitterMaterial } from "./emitter.js";

class LambertEmitterMaterial extends EmitterMaterial {
    constructor(options) {
        super(options);
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