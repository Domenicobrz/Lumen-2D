import { Geometry } from "./Geometry.js"
import { glMatrix, vec2 } from "./../dependencies/gl-matrix-es6.js";
import { AABB } from "./AABB.js";

class Edge extends Geometry {
    constructor(x, y, dx, dy, blur, nx, ny) {
        super();

        this.v0 = vec2.fromValues(x, y);
        this.v1 = vec2.fromValues(dx, dy);
        this.aabb = new AABB();
        this.aabb.addVertex(this.v0);
        this.aabb.addVertex(this.v1);


        this.blur = blur || 0;
        if(this.blur > 0) {
            let minx = Math.min(x, dx) - this.blur;
            let miny = Math.min(y, dy) - this.blur;
            let maxx = Math.max(x, dx) + this.blur;
            let maxy = Math.max(y, dy) + this.blur;
            let blurV0 = vec2.fromValues(minx, miny);
            let blurV1 = vec2.fromValues(maxx, maxy);
            this.aabb.addVertex(blurV0);
            this.aabb.addVertex(blurV1);
        }

        this.center = vec2.fromValues((this.v0[0] + this.v1[0]) / 2, 
                                      (this.v0[1] + this.v1[1]) / 2);


        if(nx !== undefined && ny !== undefined) {
            this.normal = vec2.fromValues(nx, ny);
            vec2.normalize(this.normal, this.normal);
        } else {
            let nx = dx - x;
            let ny = dy - y;
            this.normal = vec2.fromValues(-ny, nx);
            vec2.normalize(this.normal, this.normal);
        }
    }

    intersect(ray) {
        let p0_x = ray.o[0]; 
        let p0_y = ray.o[1]; 
        let p1_x = ray.o[0] + ray.d[0]; 
        let p1_y = ray.o[1] + ray.d[1]; 
        let p2_x = this.v0[0];
        let p2_y = this.v0[1];
        let p3_x = this.v1[0]; 
        let p3_y = this.v1[1];
        if(this.blur > 0) {
            // perturb this edge's center
            // since the AABB was expanded to fit this perturbation we can be sure
            // everything will stay inside the AABB bounds
            let randomAngle = Math.random() * Math.PI * 2;
            let randomRadius = this.blur * Math.random();
            let offx = randomRadius * Math.cos(randomAngle);
            let offy = randomRadius * Math.sin(randomAngle);
            p2_x += offx;
            p2_y += offy;            
            p3_x += offx;
            p3_y += offy;
        }

        let s1_x, s1_y, s2_x, s2_y;
        s1_x = p1_x - p0_x;     s1_y = p1_y - p0_y;
        s2_x = p3_x - p2_x;     s2_y = p3_y - p2_y;

        let s, t;
        s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
        t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

        if (s >= 0 && s <= 1 && t >= 0) { // && t <= 1) {   <-- the original version of the algorithm was restricted to two line segments instead of ray-segment intersections
            let result = {
                t: t,
                normal: this.normal 
            }
            return result;
        }

        return false; // No collision
    }

    getRandomPoint() {
        let t = Math.random();

        let x = this.v0[0] * t + this.v1[0] * (1 - t);
        let y = this.v0[1] * t + this.v1[1] * (1 - t);

        let randomPoint = vec2.fromValues(x, y);

        return {
            p: randomPoint,
            normal: this.normal
        }
    }
}

export { Edge }
