import { Geometry } from "./Geometry.js"
import { glMatrix, vec2 } from "./../dependencies/gl-matrix-es6.js";

class StraightEdge extends Geometry {
    constructor(x, y, dx, dy) {
        super();

        this.v0 = vec2.fromValues(x, y);
        this.v1 = vec2.fromValues(dx, dy);

        this.normal = x === dx ? vec2.fromValues(1, 0) : vec2.fromValues(0, 1);
    }

    intersect(ray) {
        
        let horizontalEdge = this.v0[1] === this.v1[1];
        
        if(horizontalEdge) {
            if(ray.o[1] > this.v0[1] && ray.d[1] > 0) return false;
            if(ray.o[1] < this.v0[1] && ray.d[1] < 0) return false;

            let dist = Math.abs(ray.o[1] - this.v0[1]);
            let t = Math.abs(dist / ray.d[1]);

            let contact = vec2.clone(ray.o);
            let scaleDir = vec2.clone(ray.d);
            vec2.scale(scaleDir, scaleDir, t);      
            vec2.add(contact, contact, scaleDir);       // contact = ray.o + ray.d * t;

            if(contact[0] > this.v0[0] && contact[0] > this.v1[0]) return false;
            if(contact[0] < this.v0[0] && contact[0] < this.v1[0]) return false;

            let result = {
                // point: contact,
                t: t,
                normal: this.normal,
            }

            return result;
        } else {
            if(ray.o[0] > this.v0[0] && ray.d[0] > 0) return false;
            if(ray.o[0] < this.v0[0] && ray.d[0] < 0) return false;

            let dist = Math.abs(ray.o[0] - this.v0[0]);
            let t = Math.abs(dist / ray.d[0]);

            let contact = vec2.clone(ray.o);
            let scaleDir = vec2.clone(ray.d);
            vec2.scale(scaleDir, scaleDir, t);      
            vec2.add(contact, contact, scaleDir);       // contact = ray.o + ray.d * t;

            if(contact[1] > this.v0[1] && contact[1] > this.v1[1]) return false;
            if(contact[1] < this.v0[1] && contact[1] < this.v1[1]) return false;

            let result = {
                // point: contact,
                t: t,
                normal: this.normal 
            }

            return result;
        }
    }


    getRandomPoint() {
        // NOTE: THIS WON'T WORK FOR NON-STRAIGHT EDGES!! 
        let tx = Math.random();
        let ty = Math.random();

        let x = this.v0[0] * tx + this.v1[0] * (1 - tx);
        let y = this.v0[1] * ty + this.v1[1] * (1 - ty);

        let randomPoint = vec2.fromValues(x, y);

        return {
            p: randomPoint,
            normal: this.normal
        }
    }
}

export { StraightEdge }
