import { glMatrix, vec2 } from "./../dependencies/gl-matrix-es6.js";

class CanvasBoundsIntersection {
    constructor(WORLD_SIZE_X, WORLD_SIZE_Y) {
        this.min = vec2.fromValues(-WORLD_SIZE_X / 2, -WORLD_SIZE_Y / 2);
        this.max = vec2.fromValues(+WORLD_SIZE_X / 2, +WORLD_SIZE_Y / 2);
    }

    intersect(ray, result) {
        let dirfrac_x = 1 / ray.d[0];
        let dirfrac_y = 1 / ray.d[1];

        let t1 = (this.min[0] - ray.o[0]) * dirfrac_x;
        let t2 = (this.max[0] - ray.o[0]) * dirfrac_x;
        let t3 = (this.min[1] - ray.o[1]) * dirfrac_y;
        let t4 = (this.max[1] - ray.o[1]) * dirfrac_y;

        let tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
        let tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

        // if tmax < 0, ray (line) is intersecting AABB, but the whole AABB is behind us
        if (tmax < 0) return false;

        // if tmin > tmax, ray doesn't intersect AABB
        if (tmin > tmax) return false;
        
        result.tmin = tmin;
        result.tmax = tmax;

        return true;
    }
}

export { CanvasBoundsIntersection };