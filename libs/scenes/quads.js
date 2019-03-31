import { Scene } from "../scene.js";
import { Edge } from "../geometry/Edge.js";
import { Circle } from "../geometry/Circle.js";
import { Ray } from "../ray.js";
import { Pixel } from "../pixel.js";
import { LambertMaterial } from "../material/lambert.js";
import { MatteMaterial } from "../material/matte.js";
import { EmitterMaterial } from "../material/emitter.js";
import { BeamEmitterMaterial } from "../material/beamEmitter.js";
import { glMatrix, vec2 } from "../dependencies/gl-matrix-es6.js";
import { Utils } from "../utils.js";
import { MicrofacetMaterial } from "../material/microfacet.js";
import { DielectricMaterial } from "../material/dielectric.js";


function createScene(scene, workerData) {

    let edgeMaterial = new LambertMaterial({ opacity: 1 });
    let tbound = 13;
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



    let lss = 23;
    let xs = 20;
    // scene.add(new Circle(0, 9, 0.5), new EmitterMaterial({ opacity: 0,          color: [ 100*lss, 100*lss, 100*lss ] }));
    // scene.add(new Edge(-xs, -3, -xs, -3.4), new BeamEmitterMaterial({ opacity: 0, color: [ 250*lss, 15 *lss, 10 *lss ], beamDirection: [1, 0] }));
    // scene.add(new Edge(+xs, 3, +xs, 3.4), new BeamEmitterMaterial({ opacity: 0, color: [ 180 *lss, 70 *lss, 30*lss ], beamDirection: [-1, 0] }));

    scene.add(new Circle(-xs, 0, 2.5), new EmitterMaterial({ opacity: 0, color: [ 55*lss, 50 *lss, 210 *lss ], beamDirection: [1, 0] }));
    scene.add(new Circle(+xs, 0, 2.5), new EmitterMaterial({ opacity: 0, color: [ 230 *lss, 110 *lss, 50*lss ], beamDirection: [-1, 0] }));





    let material1 = new LambertMaterial({ opacity: 0.8 });
    let material2 = new DielectricMaterial({ opacity: 1, transmittance: 0.8, ior: 1.5, roughness: 0.1 });
    let material3 = new EmitterMaterial({ opacity: 1, color: [1000, 100, 10] });
    let material4 = new EmitterMaterial({ opacity: 1, color: [45000, 4500, 10], sampleWeight: 0.01 });


    for(let i = 0; i < 10; i++) {
        for(let j = 0; j < 10; j++) {
        
            let xoff = ((i / 9) * 2 - 1) * 7;
            let yoff = ((j / 9) * 2 - 1) * 7;
            let angleIncr = (i * 10 + j) * 0.02;

            let material = (i+j) % 3 === 0 ? material2 : material1;
            if((i + j) % 2 === 0) continue;

            let radius = 0.7 + Math.sin((i * 10 + j) * 0.1) * 0.3;


            for(let r = 0; r < 4; r++) {
                let angle1 = (r / 4) * Math.PI * 2;
                let angle2 = ((r+1) / 4) * Math.PI * 2;
                angle1 += angleIncr;
                angle2 += angleIncr;
                angle1 = angle1 % (Math.PI * 2);
                angle2 = angle2 % (Math.PI * 2);


                let px1 = Math.cos(angle1) * radius;
                let py1 = Math.sin(angle1) * radius;

                let px2 = Math.cos(angle2) * radius;
                let py2 = Math.sin(angle2) * radius;

                let edgeIndex = (i * 100 + j * 10 + r * 4);

                // if(edgeIndex % 60 !== 0)
                    scene.add(new Edge(px1 + xoff, py1 + yoff, px2 + xoff, py2 + yoff), material);
                // else
                    // scene.add(new Edge(px1 + xoff, py1 + yoff, px2 + xoff, py2 + yoff), material3);

            }
        
        }
    }  
}

export { createScene };