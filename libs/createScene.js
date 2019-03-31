import { Scene } from "./scene.js";
import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { Ray } from "./ray.js";
import { Pixel } from "./pixel.js";
import { LambertMaterial } from "./material/lambert.js";
import { MatteMaterial } from "./material/matte.js";
import { EmitterMaterial } from "./material/emitter.js";
import { BeamEmitterMaterial } from "./material/beamEmitter.js";
import { glMatrix, vec2 } from "./dependencies/gl-matrix-es6.js";
import { Utils } from "./utils.js";
import { MicrofacetMaterial } from "./material/microfacet.js";
import { DielectricMaterial } from "./material/dielectric.js";


function createScene(scene, workerData) {

    let edgeMaterial = new LambertMaterial({ opacity: 1 });
    let tbound = 11;
    let lbound = 19.5;
    let rbound = 19.5;
    let bbound = 11;
    let ledge  = new Edge(-lbound, -bbound, -lbound,  tbound);
    let redge  = new Edge( rbound, -bbound,  rbound,  tbound);
    let tedge  = new Edge(-lbound,  tbound,  rbound,  tbound);
    let bedge  = new Edge(-lbound, -bbound,  rbound, -bbound);


    scene.add(ledge, edgeMaterial);
    scene.add(redge, edgeMaterial);
    scene.add(tedge, edgeMaterial);
    scene.add(bedge, edgeMaterial);



    // Utils.setSeed("juice921");
    let seed = Math.floor(workerData.randomNumber * 1000000000);
    console.log(seed);
    Utils.setSeed(seed);
    let rand = Utils.rand;






    let triangleMaterial =  new DielectricMaterial({
        opacity: 1,
        transmittance: 1,
        ior: 1.9,
        roughness: 0.000001,
        dispersion: 0,
        absorption: 0.1
    });

    // triangleMaterial.setSellmierCoefficients(
    //     12 * 1.03961212,
    //     12 * 0.231792344,
    //     12 * 1.01046945,
    //     12 * 0.00600069867,
    //     12 * 0.0200179144,
    //     12 * 13.560653,
    //     1
    // );

    // for(let j = 0; j < 210; j++) {
    //     let xOff = Utils.rand() * 30 - 15;
    //     let yOff = Utils.rand() * 20 - 10;

    //     let radius = 0.1 + Utils.rand() * 0.5;
    //     let ai = j * 0.2;

    //     for(let i = 0; i < 3; i++) {
    //         let angle1 = (i / 3) * Math.PI * 2;
    //         let angle2 = ((i+1) / 3) * Math.PI * 2;

    //         angle1 += Math.PI / 2 + ai;
    //         angle2 += Math.PI / 2 + ai;


    //         let tx1 = Math.cos(angle1) * radius;
    //         let ty1 = Math.sin(angle1) * radius;
    //         let tx2 = Math.cos(angle2) * radius;
    //         let ty2 = Math.sin(angle2) * radius;

    //         scene.add(
    //             new Edge(tx2 + xOff, ty2 + yOff, tx1 + xOff, ty1 + yOff), 
    //             triangleMaterial
    //         );
    //     }
    // }
    

    scene.add(
        new Circle(-2, 0, 4), 
        triangleMaterial
    );
    scene.add(
        new Circle(2, 0, 4), 
        triangleMaterial
    );
    // for(let i = 0; i < 10; i++)
    // scene.add( new Circle(10 + i * 0.9, 8, 1), triangleMaterial );
    // scene.add( new Circle(15.4, 8, 1), triangleMaterial );
    // scene.add( new Circle(15.8, 8, 1), triangleMaterial );

    let edge = new Edge(-16, -3.1, -16, -9.2);

    scene.add(
        edge, 
        new BeamEmitterMaterial({ 
            color: function() {

                let w = 680;
                if(Utils.rand() > 0) w = Utils.rand() * 360 + 380;

                return {
                    wavelength: w,
                    intensity: 1.5,
                }
            }, 
            // since the Scene class samples lightsources depending on their strenght, we can't know beforehand what's the value inside 
            // the "color" property (it's a function!) so we *have* to specify a sampling value for this light source 
            samplePower: 150,
            beamDirection: [0, -1] 
        })
    );

    // scene.add(
    //     new Circle(-15, 0, 2), 
    //     new EmitterMaterial({ 
    //         color: function() {

    //             let w = 680;
    //             if(Math.random() > 0) w = Math.random() * 360 + 380;

    //             return {
    //                 wavelength: w,
    //                 intensity: 1.5,
    //             }
    //         }, 
    //         // since the Scene class samples lightsources depending on their strenght, we can't know beforehand what's the value inside 
    //         // the "color" property (it's a function!) so we *have* to specify a sampling value for this light source 
    //         samplePower: 150,
    //     })
    // );
}

export { createScene };