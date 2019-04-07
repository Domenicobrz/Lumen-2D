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
import { ContributionModifierMaterial } from "./material/contributionModifier.js";
import { quickNoise } from "./dependencies/quick-noise.js";


function createScene(scene, workerData, motionBlurT, ctx) {

    // let edgeMaterial = new LambertMaterial({ opacity: 1 });
    let edgeMaterial = new EmitterMaterial({ opacity: 1, 
        color: 
        function() { return {
            wavelength: Math.random() * 310 + 380,
            intensity: 1.5,
        }  
    }, samplePower: 1 });
    let edgeMaterial2 = new LambertMaterial({ opacity: 1 });
    let tbound = 11;
    let lbound = 19.5;
    let rbound = 19.5;
    let bbound = 11;
    let ledge  = new Edge(-lbound, -bbound, -lbound,  tbound,    0, 1, 0);
    let redge  = new Edge( rbound, -bbound,  rbound,  tbound,    0, -1, 0);
    let tedge  = new Edge(-lbound,  tbound,  rbound,  tbound,    0, 0, -1);
    let bedge  = new Edge(-lbound, -bbound,  rbound, -bbound,    0, 0, 1);


    scene.add(ledge, edgeMaterial);
    scene.add(redge, edgeMaterial2);
    scene.add(tedge, edgeMaterial2);
    scene.add(bedge, edgeMaterial2);



    let seed = "juice921"; //Math.floor(workerData.randomNumber * 1000000000);
    // console.log(seed);
    Utils.setSeed(seed);
    let rand = Utils.rand;





    ctx.fillStyle = "rgb(127,127,127)";
    ctx.fillRect(-100, -100, 200, 200);

    for(let i = 0; i < 30; i++) {
        let angle = i / 30 * Math.PI * 2;
        let r = 7 + Math.sin(angle * 4) * 4;
        let x = Math.cos(angle) * 7;
        let y = Math.sin(angle) * 7;

        ctx.beginPath();
        ctx.lineWidth = 0.1;
        if(i% 2 == 0)
            ctx.strokeStyle = "rgb(80, 80, 80)";
        else
            ctx.strokeStyle = "rgb(160, 160, 160)";

        ctx.arc(x, y, r * 0.07, 0, 2 * Math.PI);
        ctx.stroke();
    }





    let triangleMaterial =  new DielectricMaterial({
        opacity: 1,
        transmittance: 1,
        ior: 1.5,
        roughness: 0.001,
        dispersion: 0.15,
        absorption: 0.65
    });

    scene.add(
        new Circle(0, 0, 5), 
        new LambertMaterial({ 
            opacity: 0.85,
        })
        // triangleMaterial,
    );
    
//     scene.add(
//         new Circle(-3.25, 0, 1), 
//         // triangleMaterial,
//         new LambertMaterial({ 
//             opacity: 0.95,
//         })
//     );
    
//     scene.add(
//         new Circle(3.25, 0, 1), 
//         new LambertMaterial({ 
//             opacity: 0.95,
//         })
//     );
}

export { createScene };