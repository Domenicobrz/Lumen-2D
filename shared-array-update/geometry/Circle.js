import { Geometry } from "./Geometry.js"
import { glMatrix, vec2 } from "./../dependencies/gl-matrix-es6.js";

class Circle extends Geometry {
    constructor(x, y, radius) {
        super();

        this.center = vec2.fromValues(x, y);
        this.radius = radius;
    }

    intersect(ray) {
        let e = ray.d     // e=ray.dir

        let h = vec2.create();
        vec2.sub(h, this.center, ray.o);          // h=r.o-c.M

        let lf = vec2.dot(e, h);                  // lf=e.h
        let s  = this.radius * this.radius - vec2.dot(h,h) + lf * lf;   // s=r^2-h^2+lf^2
        if (s < 0.0) return false;               // no intersection points ?
        s = Math.sqrt(s);                         // s=sqrt(r^2-h^2+lf^2)

        let intersectionPoints = 0;        
        if (lf < s) {                             // S1 behind A ?
            if (lf+s >= 0) {                      // S2 before A ?
                s = -s;                           // swap S1 <-> S2
                intersectionPoints = 1;           // one intersection point
            } 
        } else intersectionPoints = 2;            // 2 intersection points

        if(intersectionPoints === 0) return false;
        

        let S1 = vec2.create();
        let S2 = vec2.create();

        vec2.scale(S1, e, lf-s);                  // S1.set(PVector.mult(e, lf-s));  
        let t = vec2.length(S1);
        vec2.add(S1, S1, ray.o);                  // S1.add(ray.origin); // S1=A+e*(lf-s)

        vec2.scale(S2, e, lf+s);                  // S2.set(PVector.mult(e, lf+s));  
        vec2.add(S2, S2, ray.o);                  // S2.add(ray.origin); // S2=A+e*(lf+s)


        let normal = vec2.create();
        vec2.sub(normal, S1, ray.o);
        vec2.normalize(normal, normal);


        let result = {
            // point: S1,
            t: t,
            normal: normal,
        }

        return result;
    }



    // used to sample a point if this object is an emitter
    getRandomPoint() {
        let randomAngle = Math.random() * Math.PI * 2;

        let x = Math.cos(randomAngle) * this.radius + this.center[0];
        let y = Math.sin(randomAngle) * this.radius + this.center[1];
        let randomPoint = vec2.fromValues(x, y);

        let normal = vec2.create();
        vec2.subtract(normal, randomPoint, this.center);
        vec2.normalize(normal, normal);

        return {
            p: randomPoint,
            normal: normal
        }
    }
}

export { Circle }
