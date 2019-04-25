import { Geometry } from "./Geometry.js";
import { Edge } from "./Edge.js";
import { glMatrix, vec2, vec3 } from "./../dependencies/gl-matrix-es6.js";

class CPoly extends Geometry {
    constructor(sides, x, y, radius) {
        super();

        for(let i = 0; i < sides; i++) {
            let a1 = (i / sides) * Math.PI * 2;
            let a2 = ((i+1) / sides) * Math.PI * 2;

            let x1 = Math.cos(a1) * radius;
            let y1 = Math.sin(a1) * radius;
            let x2 = Math.cos(a2) * radius;
            let y2 = Math.sin(a2) * radius;
            
            let edge = new Edge(x2 + x, y2 + y, x1 + x, y1 + y);
            this.addPrimitive(edge);
        }
    }
}

export { CPoly }