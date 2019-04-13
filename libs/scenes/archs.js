import { Edge } from "../geometry/Edge.js";
import { Circle } from "../geometry/Circle.js";
import { LambertMaterial } from "../material/lambert.js";
import { EmitterMaterial } from "../material/emitter.js";
import { glMatrix, vec2 } from "../dependencies/gl-matrix-es6.js";
import { Utils } from "../utils.js";
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
    let xs = 24;
    // scene.add(new Circle(0, 9, 0.5), new EmitterMaterial({ opacity: 0,          color: [ 100*lss, 100*lss, 100*lss ] }));
    // scene.add(new Edge(-xs, -3, -xs, -3.4), new BeamEmitterMaterial({ opacity: 0, color: [ 250*lss, 15 *lss, 10 *lss ], beamDirection: [1, 0] }));
    // scene.add(new Edge(+xs, 3, +xs, 3.4), new BeamEmitterMaterial({ opacity: 0, color: [ 180 *lss, 70 *lss, 30*lss ], beamDirection: [-1, 0] }));

    // scene.add(new Circle(-xs, 0, 5.5), new EmitterMaterial({ opacity: 0, color: [ 250*lss, 15 *lss, 10 *lss ], beamDirection: [1, 0] }));
    // scene.add(new Circle(+xs, 0, 5.5), new EmitterMaterial({ opacity: 0, color: [ 230 *lss, 110 *lss, 50*lss ], beamDirection: [-1, 0] }));





    let material1 = new LambertMaterial({ opacity: 0.8 });
    let material2 = new DielectricMaterial({ opacity: 1, transmittance: 0.8, ior: 1.5, roughness: 0.1 });
    let material3 = new EmitterMaterial({ opacity: 1, color: [1500, 150, 10] });
    let material4 = new EmitterMaterial({ opacity: 1, color: [45000, 4500, 10], sampleWeight: 0.01 });



    let nodes = [];
    let nodesCount = 300;
    let howCloseToAllowConnection = 1.5;
    let archsLimitPerNode = 3;
    for(let i = 0; i < nodesCount; i++) {
        let angle = rand() * Math.PI * 2;
        let radius = Math.pow(rand(), 0.65) * 8.5;

        let node = {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        };
        nodes.push(node);

        // if(i % 4 !== 0)
        //     scene.add(new Circle(node.x, node.y, 0.15), material1);
        // else 
        //     scene.add(new Circle(node.x, node.y, 0.15), material2);
        


        if(i % 8 > 2)
            scene.add(new Circle(node.x, node.y, 0.15), material1);
        else if (i % 8 === 0)
            scene.add(new Circle(node.x, node.y, 0.15), material2);
        else if (i % 8 === 1) {
            scene.add(new Circle(node.x, node.y, 0.15), material3);
            scene.add(new Circle(node.x, node.y, 0.0001), material4);            
        }


    }


    let existingArchs = { };
    let archsCount = { };
    for(let i = 0; i < nodesCount; i++) {
        let randomNodeIndex = Math.floor(rand() * nodesCount);
        let randomNode = nodes[randomNodeIndex];

        // let attempts = nodesCount * 2;
        for(let j = 0; j < nodesCount; j++) {
            let randomNodeIndex2 = j;
            let randomNode2 = nodes[randomNodeIndex2];

            if(archsCount[randomNodeIndex] > archsLimitPerNode) continue;
            if(archsCount[randomNodeIndex2] > archsLimitPerNode) continue;
            if(randomNodeIndex === randomNodeIndex2) continue;
            if (existingArchs[randomNodeIndex + " " + randomNodeIndex2]) continue;


            let v1 = vec2.fromValues(randomNode.x, randomNode.y);
            let v2 = vec2.fromValues(randomNode2.x, randomNode2.y);
            let v3 = vec2.create();
            vec2.sub(v3, v2, v1);

            if(vec2.length(v3) < howCloseToAllowConnection) {
                if(i % 8 > 2)
                    scene.add(new Edge(randomNode.x, randomNode.y, randomNode2.x, randomNode2.y), material1);
                else if (i % 8 === 0)
                    scene.add(new Edge(randomNode.x, randomNode.y, randomNode2.x, randomNode2.y), material2);
                // else if (i % 8 === 1)
                //     scene.add(new Edge(randomNode.x, randomNode.y, randomNode2.x, randomNode2.y), material3);



                existingArchs[randomNodeIndex + " " + randomNodeIndex2] = true;
                existingArchs[randomNodeIndex2 + " " + randomNodeIndex] = true;
                
                if(archsCount[randomNodeIndex] === undefined)  archsCount[randomNodeIndex] = 0;
                if(archsCount[randomNodeIndex2] === undefined)  archsCount[randomNodeIndex2] = 0;
                archsCount[randomNodeIndex]++;
                archsCount[randomNodeIndex2]++;
            }
        }
    }

}

export { createScene };