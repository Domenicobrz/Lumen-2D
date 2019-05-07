import { Geometry } from "./Geometry.js";
import { Edge } from "./Edge.js";
import { glMatrix, vec2, vec3 } from "../dependencies/gl-matrix-es6.js";

class Star extends Geometry {
    constructor(sides, x, y, radius1, radius2) {
        super();

        for(let i = 0; i < sides*2; i++) {
            let a1 = (i / (sides*2)) * Math.PI * 2;
            let a2 = ((i+1) / (sides*2)) * Math.PI * 2;

            let rad1 = radius1;
            let rad2 = radius2;
            if(i%2 === 1) {
                rad1 = radius2;
                rad2 = radius1;
            }

            let x1 = Math.cos(a1) * rad1;
            let y1 = Math.sin(a1) * rad1;
            let x2 = Math.cos(a2) * rad2;
            let y2 = Math.sin(a2) * rad2;
            
            let edge = new Edge(x2 + x, y2 + y, x1 + x, y1 + y);
            this.addPrimitive(edge);
        }
    }
}

export { Star }