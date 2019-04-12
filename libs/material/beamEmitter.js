import { EmitterMaterial } from "./emitter.js";
import { Ray } from "../ray.js";
import { glMatrix, vec2, vec3 } from "./../dependencies/gl-matrix-es6.js";
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

        let normal = res.normal;

        let offsetDir = 1;
        if(vec2.dot(normal, this.beamDirection) < 0) 
            offsetDir = -1;

        // avoids self-intersections
        point[0] += res.normal[0] * 0.00001 * offsetDir;
        point[1] += res.normal[1] * 0.00001 * offsetDir;

        let newDirection = vec2.clone(this.beamDirection);
        vec2.normalize(newDirection, newDirection);

        return {
            ray:   new Ray(point, newDirection),
            spectrum: this.getSpectrum(this.color),
        }
    }
}

export { BeamEmitterMaterial }