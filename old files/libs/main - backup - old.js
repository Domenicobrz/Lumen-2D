window.addEventListener("load", init);


var canvas;
var context;
var imageDataObject;

var pixelBuffer = [];   // multidimensional array
var canvasSize = 80;
var samplesTaken = 0;
var scene;


var vec2 = glMatrix.vec2;

function init() {

    canvas = document.getElementById('canvas');
	canvas.width  = canvasSize;
	canvas.height = canvasSize;
	context = canvas.getContext('2d');
    imageDataObject = context.createImageData(canvasSize, canvasSize);


    for(let i = 0; i < canvasSize; i++) {
        pixelBuffer.push([ ]);

        for(let j = 0; j < canvasSize; j++) {
            pixelBuffer[i].push(new Pixel(j, canvasSize - i - 1));
        }
    }


    scene = new Scene();


    // let circle = new Circle(0, 0, 2);

    let ledge = new StraightEdge(vec2.fromValues(-9, -9), vec2.fromValues(-9, 9));
    let redge = new StraightEdge(vec2.fromValues(9, -9), vec2.fromValues(9, 9));
    let tedge = new StraightEdge(vec2.fromValues(-9, 9), vec2.fromValues(9, 9));
    let bedge = new StraightEdge(vec2.fromValues(-9, -9), vec2.fromValues(9, -9));

    let emissionEdge1 = new StraightEdge(vec2.fromValues(-0.5, 6), vec2.fromValues(0.5, 6));
    let emissionEdge2 = new StraightEdge(vec2.fromValues(-0.5, -6), vec2.fromValues(0.5, -6));

    // let ray = new Ray(
    //     vec2.fromValues(0.5, -4),
    //     vec2.fromValues(0, 1)
    // );

    scene.add(ledge);
    scene.add(redge);
    scene.add(tedge);
    scene.add(bedge);
    scene.add(emissionEdge1, { type: "emitter", color: [5, 1, 0] });
    scene.add(emissionEdge2, { type: "emitter", color: [0, 1, 7] });

    requestAnimationFrame(renderSample);
}


function renderSample() {
    requestAnimationFrame(renderSample);

    samplesTaken++;
    console.log("sample number: " + samplesTaken);

    for(let i = canvasSize - 1; i >= 0; i--)
    for(let j = 0; j < canvasSize; j++) {
        let pixel = pixelBuffer[i][j];

        rayTrace(pixel);

        // pixel.r = y / canvasSize;
        // pixel.g = 0;
        // pixel.b = 0;
    }


	var imageData = imageDataObject.data;

    // fill with base color
    for (var i = 0; i < canvasSize * canvasSize * 4; i += 4)
    {
        let pixelIndex = Math.floor(i / 4);
        let x = Math.floor(pixelIndex / canvasSize);
        let y = pixelIndex % canvasSize;

        let r = pixelBuffer[x][y].r / (samplesTaken * 0.5);
        let g = pixelBuffer[x][y].g / (samplesTaken * 0.5);
        let b = pixelBuffer[x][y].b / (samplesTaken * 0.5);

        r *= 255;
        g *= 255;
        b *= 255;

        if(r > 255) r = 255;
        if(g > 255) g = 255;
        if(b > 255) b = 255;

        imageData[i]     = r;
        imageData[i + 1] = g;
        imageData[i + 2] = b;
        imageData[i + 3] = 255;
    }

    context.putImageData(imageDataObject, 0, 0);
}



function rayTrace(pixel) {
    let WORLD_SIZE = 20;    // effectively means the horizontal extent will be   [ -WORLD_SIZE/2 ,  +WORLD_SIZE/2 ]
    let LIGHT_BOUNCES = 7;

    let u = (pixel.i / canvasSize) * 2 - 1;
    let v = (pixel.j / canvasSize) * 2 - 1;

    // world coordinates
    let wx = u * WORLD_SIZE * 0.5;
    let wy = v * WORLD_SIZE * 0.5;

    let rayAngle = Math.random() * (Math.PI * 2);

    let ray = new Ray(
        vec2.fromValues(wx, wy),
        vec2.fromValues(Math.cos(rayAngle), Math.sin(rayAngle))  // normalized by construction!
    );

    let contribution = 1.0;
    for(let i = 0; i < LIGHT_BOUNCES; i++) {
        let result = scene.intersect(ray);
        
        // if we had an intersection
        if(result.t) {
            let object = result.object;
            let material = object.material;


            let dot = vec2.dot(ray.d, result.normal);
            if(dot < 0.0) dot = -dot;
            contribution *= dot;

            let prbefore = pixel.r;

            if(material.type == "emitter") {
                pixel.r += material.color[0] * contribution;
                pixel.g += material.color[1] * contribution;
                pixel.b += material.color[2] * contribution;
                return;
            }

            let prafter = pixel.r;

            if(prbefore > prafter) {
                console.log("here's the problem");
            }


            // bounce off again
            let newOrigin = vec2.create();
            vec2.scaleAndAdd(newOrigin, ray.o, ray.d, result.t * 0.999);

            if(material == "matte") {
                // we're going to pick a random point in the hemisphere
                let newDirection = vec2.create();
                let nv = result.normal;
                let nu = vec2.fromValues(-result.normal[1], result.normal[0]);

                let angleInHemisphere = Math.random() * Math.PI;
                let nudx = Math.cos(angleInHemisphere) * nu[0];
                let nudy = Math.cos(angleInHemisphere) * nu[1];
                let nvdx = Math.sin(angleInHemisphere) * nv[0];
                let nvdy = Math.sin(angleInHemisphere) * nv[1];

                newDirection[0] = nudx + nvdx;
                newDirection[1] = nudy + nvdy;
                vec2.normalize(newDirection, newDirection);

                vec2.copy(ray.o, newOrigin);
                vec2.copy(ray.d, newDirection);            
            }
        }
    }
}

class Scene {
    constructor() {
        this._objects = [];
    }

    add(object, material) {
        object.material = material || { type: "matte" };
        this._objects.push(object);
    }

    intersect(ray) {

        let minT = 999999999999999999;
        let intersectionResult = { };

        for(let i = 0; i < this._objects.length; i++) {
            let object = this._objects[i];
            let result = object.intersect(ray);

            if(result) {
                if(result.t < minT) {
                    minT = result.t;
                    intersectionResult.object = object;
                    intersectionResult.t = minT;
                    intersectionResult.normal = vec2.clone(result.normal);
                }
            }
        }

        return intersectionResult;
    }
}

class Ray {
    constructor(origin, direction) {
        this.o = origin;
        this.d = direction;
    }
}

class Circle {
    constructor(x, y, radius) {
        this.center = vec2.fromValues(x, y);
        this.radius = radius;
    }

    intersect(ray) {
        let e = ray.d     // e=ray.dir
        vec2.normalize(e,e) // e=g/|g|

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
        vec2.add(S1, S1, ray.o);                  // S1.add(ray.origin); // S1=A+e*(lf-s)

        vec2.scale(S2, e, lf+s);                  // S2.set(PVector.mult(e, lf+s));  
        vec2.add(S2, S2, ray.o);                  // S2.add(ray.origin); // S2=A+e*(lf+s)


        let result = { };
        result.S1 = S1;
        result.S2 = S2;

        return result;
    }
}

class StraightEdge {
    constructor(v0, v1) {
        this.v0 = v0;
        this.v1 = v1;

        this.normal = v0[0] === v1[0] ? vec2.fromValues(1, 0) : vec2.fromValues(0, 1);
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
                point: contact,
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
                point: contact,
                t: t,
                normal: this.normal 
            }

            return result;
        }
    }
}

class Pixel {
    constructor(i, j) {
        this.i = i;
        this.j = j;
    
        this.r = 0;
        this.g = 0;
        this.b = 0;
    }
}