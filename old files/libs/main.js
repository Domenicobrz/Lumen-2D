window.addEventListener("load", init);


var canvas;
var context;
var imageDataObject;

var pixelBuffer = [];   // multidimensional array
var canvasSize = 800;
var photonsFired  = 0;
var coloredPixels = 0;
var scene;

var RENDER_TYPE_NOISE = true;
var PHOTONS_PER_FRAME = 1000;
var frameSkipperValue = 0; // 100;
var frameSkipperCount = 0;

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
 
    let ledge = new StraightEdge(vec2.fromValues(-10, -10), vec2.fromValues(-10,  10));
    let redge = new StraightEdge(vec2.fromValues( 10, -10), vec2.fromValues( 10,  10));
    let tedge = new StraightEdge(vec2.fromValues(-10,  10), vec2.fromValues( 10,  10));
    let bedge = new StraightEdge(vec2.fromValues(-10, -10), vec2.fromValues( 10, -10));

    let emissionEdge1 = new StraightEdge(vec2.fromValues(-0.5, 6), vec2.fromValues(0.5, 6));
    let emissionEdge2 = new StraightEdge(vec2.fromValues(-0.5, -6), vec2.fromValues(0.5, -6));

    let emissionPoint = new PointLight(vec2.fromValues(4, 4));
    // let emissionPoint2 = new PointLight(vec2.fromValues(-7, -4));


    let testedge  = new StraightEdge(vec2.fromValues( -5, -5), vec2.fromValues(-5, 5));
    let testedge4  = new StraightEdge(vec2.fromValues( 5, -5), vec2.fromValues(5, 5));
    let testedge3  = new StraightEdge(vec2.fromValues(-4, 4), vec2.fromValues(4, 4));
    let testedge2 = new StraightEdge(vec2.fromValues(-4, -4), vec2.fromValues(4, -4));


    scene.add(ledge);
    scene.add(redge);
    scene.add(tedge);
    scene.add(bedge);
    scene.add(testedge);
    scene.add(testedge2);
    scene.add(testedge3);
    scene.add(testedge4);
    // scene.add(emissionEdge1, { type: "emitter", color: [5, 1, 0] });
    // scene.add(emissionEdge2, { type: "emitter", color: [0, 1, 7] });
    var s = 1.5;
    scene.add(emissionPoint, { type: "emitter", color:  [1*s, 15*s, 8*s] });
    // scene.add(emissionPoint2, { type: "emitter", color: [2 *s, 5*s, 19*s] });



    window.addEventListener("keypress", function(e) {
        if(e.key == "k") {
            PHOTONS_PER_FRAME *= 2;
        }
        if(e.key == "j") {
            frameSkipperValue /= 2;
        }
    });


    requestAnimationFrame(renderSample);
}


function renderSample() {
    requestAnimationFrame(renderSample);


    // *********** used only for animation
    frameSkipperCount++;
    if(frameSkipperCount < frameSkipperValue) return;
    else frameSkipperCount = 0;
    // *********** used only for animation - END



    let photonCount = PHOTONS_PER_FRAME;
    let photonMult  = photonCount / 10;

    for(let i = 0; i < photonCount; i++) {
        emitPhotons();
    }

    
    photonsFired += photonCount;
    console.log("photons fired: " + photonsFired + " - colored pixels: " + coloredPixels);


	var imageData = imageDataObject.data;

    // fill with base color
    for (var i = 0; i < canvasSize * canvasSize * 4; i += 4)
    {
        let pixelIndex = Math.floor(i / 4);
        let y = canvasSize - Math.floor(pixelIndex / canvasSize) - 1;
        let x = pixelIndex % canvasSize;

        let r = pixelBuffer[y][x].r / (photonsFired * 0.1);
        let g = pixelBuffer[y][x].g / (photonsFired * 0.1);
        let b = pixelBuffer[y][x].b / (photonsFired * 0.1);

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



function colorPhoton(ray, t, WORLD_SIZE, emitterColor, contribution, worldAttenuation) {
    let worldPixelSize = WORLD_SIZE / canvasSize;
    let step = worldPixelSize;
    let steps = Math.floor(t / worldPixelSize);

    let worldPoint = vec2.create();
    let tmp        = vec2.create();
    let previousPixel = [-1, -1];


    if(!RENDER_TYPE_NOISE) {
        for(let i = 0; i < steps; i++) {
            vec2.scaleAndAdd(worldPoint, ray.o, ray.d, step * i);

            // convert world point to pixel coordinate
            let u = (worldPoint[0] + WORLD_SIZE / 2) / WORLD_SIZE;
            let v = (worldPoint[1] + WORLD_SIZE / 2) / WORLD_SIZE;

            let px = Math.floor(u * canvasSize);
            let py = Math.floor(v * canvasSize);

            let attenuation = Math.exp(-step * i * worldAttenuation);

            if(previousPixel[0] == px && previousPixel[1] == py || px >= canvasSize || py >= canvasSize || px < 0 || py < 0) {
                continue;
            } else {
                previousPixel[0] = px;
                previousPixel[1] = py;

                // color pixel
                // try {
                    pixelBuffer[py][px].r += emitterColor[0] * contribution * attenuation;
                    pixelBuffer[py][px].g += emitterColor[1] * contribution * attenuation;
                    pixelBuffer[py][px].b += emitterColor[2] * contribution * attenuation;
                // } catch {
                    // let y = 0;
                // }
            }
        }

        coloredPixels += steps;
    }




    if(RENDER_TYPE_NOISE) {
        // IMPORTANT:  WE NEED TO TAKE LESS SAMPLES IF THE RAY IS SHORT (proportionally)!! OTHERWISE we would increase radiance along short rays in an unproportional way
        // because we would add more emitterColor along those smaller rays 
        let SAMPLES = Math.floor(steps * 0.15);
        let SAMPLES_STRENGHT = steps / SAMPLES;
    
        for(let i = 0; i < SAMPLES; i++) {
            let tt = t * Math.random();
            vec2.scaleAndAdd(worldPoint, ray.o, ray.d, tt);
    
            // convert world point to pixel coordinate
            let u = (worldPoint[0] + WORLD_SIZE / 2) / WORLD_SIZE;
            let v = (worldPoint[1] + WORLD_SIZE / 2) / WORLD_SIZE;
    
            let px = Math.floor(u * canvasSize);
            let py = Math.floor(v * canvasSize);
    
            let attenuation = Math.exp(-tt * worldAttenuation);
    
            if(previousPixel[0] == px && previousPixel[1] == py || px >= canvasSize || py >= canvasSize || px < 0 || py < 0) {
                continue;
            } else {
                previousPixel[0] = px;
                previousPixel[1] = py;
    
                // color pixel
                // try {
                    pixelBuffer[py][px].r += emitterColor[0] * SAMPLES_STRENGHT * contribution * attenuation;
                    pixelBuffer[py][px].g += emitterColor[1] * SAMPLES_STRENGHT * contribution * attenuation;
                    pixelBuffer[py][px].b += emitterColor[2] * SAMPLES_STRENGHT * contribution * attenuation;
                // } catch {
                    // let y = 0;
                // }
            }
        }

        coloredPixels += SAMPLES;
    }
}

function emitPhotons() {
    let WORLD_SIZE = 20;    // effectively means the horizontal extent will be   [ -WORLD_SIZE/2 ,  +WORLD_SIZE/2 ]
    let LIGHT_BOUNCES = 7;


    let pointLight = scene.getEmitter();
    let radius = 2;

    let pointAngle = Math.random() * Math.PI * 2;
    let rayAngle = Math.random() * (Math.PI * 2);
    // let rayAngle = Math.random() * (Math.PI * 0.005) + 1.59;

    let ex = pointLight.center[0] + Math.cos(pointAngle) * radius;
    let ey = pointLight.center[1] + Math.sin(pointAngle) * radius;

    let ray = new Ray(
        vec2.fromValues(ex, ey),
        vec2.fromValues(Math.cos(rayAngle), Math.sin(rayAngle))  // normalized by construction!
    );

    let contribution = 1.0;
    let worldAttenuation = (1.0 / WORLD_SIZE)    * 0.2;


    for(let i = 0; i < LIGHT_BOUNCES; i++) {
        let result = scene.intersect(ray);
        
        // if we had an intersection
        if(result.t) {

            colorPhoton(ray, result.t, WORLD_SIZE, pointLight.material.color, contribution, worldAttenuation);

            let object = result.object;
            let material = object.material;


            let dot = Math.abs(  vec2.dot(ray.d, result.normal)  );
            contribution *= dot;
            contribution *= Math.exp(-result.t * worldAttenuation);

            // bounce off again
            let newOrigin = vec2.create();
            vec2.scaleAndAdd(newOrigin, ray.o, ray.d, result.t * 0.999);

            if(material == "matte" || material) {   // if it's a matte material, or a default material (basically means this if statement is for matte or generic materials)
                // we're going to pick a random point in the hemisphere
                let dot = vec2.dot(ray.d, result.normal);   // ** REMEMBER !! **    the dot between ray.d & normal here is expected to be LESS than zero! 
                                                            //                      that's because the incident light ray should be negated before making the dot product
                let normal = vec2.clone(result.normal);
                if(dot > 0.0) {     // if it's greater than zero, we have a problem!  see here ^^^
                    vec2.negate(normal, normal);
                }            
                
                let newDirection = vec2.create();
                let nv = normal;
                let nu = vec2.fromValues(-normal[1], normal[0]);

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
                
                // if(ray.d[0] == 0 && ray.d[1] == -1) {
                //     console.log("strange");
                // }
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

    getEmitter() {
        let emitters = [];

        for (let i = 0; i < this._objects.length; i++) {
            if (this._objects[i].material.type == "emitter")
                emitters.push(this._objects[i]);
        }

        return emitters[Math.floor(Math.random() * emitters.length)];
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

class PointLight {
    constructor(center) {
        this.center = center;
    }

    intersect(ray) {
        return false;
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