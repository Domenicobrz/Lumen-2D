import { EmitterMaterial } from "./emitter.js";
import { Ray } from "../ray.js";
import { glMatrix, vec2 } from "./../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";

class BeamEmitterMaterial extends EmitterMaterial {
    constructor(options) {
        super(options);

        options.beamDirection = options.beamDirection !== undefined ? options.beamDirection : vec2.fromValues(-1, 0);
        this.beamDirection = options.beamDirection;
    }

    getPhoton(geometryObject) {
        let res = geometryObject.getRandomPoint();
        let point = res.p;
        // avoids self-intersections
        point[0] += res.normal[0] * 0.00001;    // normals are always normalized to a length of 1, so there shouldn't be a precision problem with *= 0.00001
        point[1] += res.normal[1] * 0.00001;
        let normal = res.normal;

        let newDirection = vec2.clone(this.beamDirection);
        vec2.normalize(newDirection, newDirection);

        return {
            ray:   new Ray(point, newDirection),
            color: this.color
        }
    }
}

export { BeamEmitterMaterial }