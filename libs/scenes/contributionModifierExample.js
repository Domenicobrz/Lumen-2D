import { Edge } from "../geometry/Edge.js";
import { Circle } from "../geometry/Circle.js";
import { LambertMaterial } from "../material/lambert.js";
import { EmitterMaterial } from "../material/emitter.js";
import { Utils } from "../utils.js";
import { DielectricMaterial } from "../material/dielectric.js";
import { ContributionModifierMaterial } from "../material/contributionModifier.js";


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
        ior: 1.4,
        roughness: 0.14,
        dispersion: 0.15,
        absorption: 0.45
    });

    let triangleMaterial2 =  new DielectricMaterial({
        opacity: 1,
        transmittance: 1,
        ior: 1.4,
        roughness: 0.05,
        dispersion: 0.15,
        absorption: 0.35
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

    let edgesMaterial1 = new LambertMaterial({ opacity: 0.25 });
    let edgesMaterial2 = triangleMaterial2;
    let edgesMaterial3 = new ContributionModifierMaterial({ modifier: 0.2 });
    let edgesMaterial4 = new ContributionModifierMaterial({ modifier: 1 / 0.2 });

    for(let i = 0; i < 9; i++) {
        let radius = 2;
        // if(i === 1) radius = 1;

        let xt = 5;
        let yt = 5;

        let xo = Utils.rand() * 0.5 - 0.25; 
        let yo = Utils.rand() * 0.5 - 0.25;

        for(let j = 0; j < 4; j++) {
            let x1 = -1;    
            let y1 = -1;    

            let x2 = -1;    
            let y2 = +1;

            let x4 = +1;    
            let y4 = -1;

            let x3 = +1;    
            let y3 = +1;

            x1 *= radius;
            y1 *= radius;
            x2 *= radius;
            y2 *= radius;
            x3 *= radius;
            y3 *= radius;
            x4 *= radius;
            y4 *= radius;

            let xOff = xo * j;
            let yOff = yo * j;



            let ix = i % 3  - 1;
            let iy = Math.floor(i / 3) - 1;
            // let ix = 0;
            // let iy = 0;

            xOff += xt * ix;
            yOff += yt * iy;


            x1 += xOff;
            x2 += xOff;
            x3 += xOff;
            x4 += xOff;
            y1 += yOff;
            y2 += yOff;
            y3 += yOff;
            y4 += yOff;

            let blur = 0;
            let edgesMaterial = edgesMaterial3;
            if(((i * 9) + j) % 2 === 1) edgesMaterial = edgesMaterial4;
            if(i === 4) edgesMaterial = edgesMaterial2;

            scene.add(new Edge(x1, y1, x2, y2, blur), edgesMaterial);
            scene.add(new Edge(x2, y2, x3, y3, blur), edgesMaterial);
            scene.add(new Edge(x3, y3, x4, y4, blur), edgesMaterial);
            scene.add(new Edge(x4, y4, x1, y1, blur), edgesMaterial);

            radius *= 0.7;
        }
    }
    

  
    let y = 1;
    // let edge = new Edge(-7, y, -7, y-0.1);
    // let edge = new Edge(1.7, 9, 1.6, 9);
    // let edge2 = new Edge(-1.6, -9, -1.5, -9);

    // let elm = 9;
    // let lightMaterial = new BeamEmitterMaterial({ 
    //     // color: function() {

    //     //     let w = 680;
    //     //     if(Utils.rand() > 0) w = Utils.rand() * 360 + 380;

    //     //     return {
    //     //         wavelength: w,
    //     //         intensity: 20.5,
    //     //     }
    //     // }, 
    //     // opacity: 0,
    //     // // since the Scene class samples lightsources depending on their strenght, we can't know beforehand what's the value inside 
    //     // // the "color" property (it's a function!) so we *have* to specify a sampling value for this light source 
    //     // samplePower: 150,
    //     // // beamDirection: [1, 0] 
    //     color: [400 * elm, 900 * elm, 2500 * elm],
    //     beamDirection: [1.85, -1] 
    // });
    // let lightMaterial2 = new BeamEmitterMaterial({ 
    //     // samplePower: 150,      
    //     color: [2500 * elm, 900 * elm, 400 * elm],
    //     beamDirection: [-1.85, 1] 
    // });
    // scene.add(edge, lightMaterial);
    // scene.add(edge2, lightMaterial2);

    scene.add(
        new Circle(16, 7.5, 3), 
        new EmitterMaterial({ 
            opacity: 0,
            color: [40, 90, 250]
        })
    );

    // scene.add(
    //     new Circle(-16, 7.5, 3), 
    //     new EmitterMaterial({ 
    //         opacity: 0,
    //         color: [250, 90, 40]
    //     })
    // );
}

export { createScene };