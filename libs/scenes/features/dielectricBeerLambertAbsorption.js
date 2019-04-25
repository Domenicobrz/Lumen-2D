import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { LambertMaterial } from "./material/lambert.js";
import { ExperimentalDielectricMaterial } from "./material/experimentalDielectric.js";
import { LambertEmitterMaterial } from "./material/lambertEmitter.js";


/**
 * 
 * Assing these values to the Globals object
 * 
 *      WORLD_SIZE = 20;
 *      worldAttenuation = 0.05;
 *      LIGHT_BOUNCES: 10,
 *
 */

var scene;
function createScene(gscene, workerData, motionBlurT, ctx, frameNumber) {

    scene = gscene;
    createWorldBounds(scene);

    Pentagon(0, 0, 5, 0, true, new ExperimentalDielectricMaterial({
            opacity: 1,
            transmittance: 1,
            ior: 1.5,
            absorption: 0.35,
            dispersion: 0.27,
            roughness: 0.05,
            volumeAbsorption: [0, 0.15, 0.25],
            reflectionStrenght: 2.35,
        }));

    let lightSource2 = new Circle(0, 13, 3);
    let lightMaterial2 = new LambertEmitterMaterial({ 
        opacity: 0, 
        color: function() {
            let w = Math.random() * 360 + 380;
            let it = 1;
            if(w < 450) it = 1.5;

            return {
                wavelength: w,
                intensity: 18 * it,
            }
        },
        sampleStrenght: 150,
    });
    scene.add(lightSource2, lightMaterial2);
}

function Pentagon(x, y, radius1, rotation, nothollow, material) {
    
    if(!material) material = new LambertMaterial({ opacity: 0.7 });

    for(let i = 0; i < 5; i++) {
        let angle1 = (i / 5) * Math.PI * 2;
        let angle2 = ((i+1) / 5) * Math.PI * 2;

        let x1 = Math.cos(angle1) * radius1;
        let y1 = Math.sin(angle1) * radius1;

        let x2 = Math.cos(angle2) * radius1;
        let y2 = Math.sin(angle2) * radius1;

        x1 += x;
        x2 += x;

        y1 += y;
        y2 += y;

        scene.add(new Edge(x2, y2, x1, y1), material);
    }
}

function createWorldBounds(scene) {
    let edgeMaterial = new LambertMaterial({ opacity: 1 });
    let tbound = 11   * 2;
    let lbound = 19.5 * 2;
    let rbound = 19.5 * 2;
    let bbound = 11   * 2;
    let ledge  = new Edge(-lbound, -bbound, -lbound,  tbound,    0, 1, 0);
    let redge  = new Edge( rbound, -bbound,  rbound,  tbound,    0, -1, 0);
    let tedge  = new Edge(-lbound,  tbound,  rbound,  tbound,    0, 0, -1);
    let bedge  = new Edge(-lbound, -bbound,  rbound, -bbound,    0, 0, 1);

    scene.add(ledge, edgeMaterial);
    scene.add(redge, edgeMaterial); 
    scene.add(tedge, edgeMaterial);
    scene.add(bedge, edgeMaterial);
}

export { createScene };