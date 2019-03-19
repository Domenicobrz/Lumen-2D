import { glMatrix, vec2 } from "./../dependencies/gl-matrix-es6.js";

class AABB {
    constructor() {
        this.min = vec2.fromValues(+Infinity, +Infinity);
        this.max = vec2.fromValues(-Infinity, -Infinity);
    }

    addVertex(vertex) {
        if(vertex[0] < this.min[0]) this.min[0] = vertex[0];
        if(vertex[1] < this.min[1]) this.min[1] = vertex[1];
        
        if(vertex[0] > this.max[0]) this.max[0] = vertex[0];
        if(vertex[1] > this.max[1]) this.max[1] = vertex[1];
    }

    addAABB(aabb) {
        this.addVertex(aabb.min);
        this.addVertex(aabb.max);
    }

    intersect(ray) {
        // r.dir is unit direction vector of ray
        let dirfrac_x = 1 / ray.d[0];
        let dirfrac_y = 1 / ray.d[1];
        // dirfrac.z = 1.0f / r.d.z;
        // lb is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
        // r.org is origin of ray
        let t1 = (this.min[0] - ray.o[0]) * dirfrac_x;
        let t2 = (this.max[0] - ray.o[0]) * dirfrac_x;
        let t3 = (this.min[1] - ray.o[1]) * dirfrac_y;
        let t4 = (this.max[1] - ray.o[1]) * dirfrac_y;
        // let t5 = (this.min.z - r.org.z)*dirfrac.z;
        // let t6 = (this.max.z - r.org.z)*dirfrac.z;

        let t    = Infinity;
        let tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
        let tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

        // if tmax < 0, ray (line) is intersecting AABB, but the whole AABB is behind us
        if (tmax < 0) {
            t = tmax;
            return false;
        }

        // if tmin > tmax, ray doesn't intersect AABB
        if (tmin > tmax) {
            t = tmax;
            return false;
        }

        t = tmin;
        
        let result = {
            t: tmin,
        };

        return result;
    }
}

export { AABB }