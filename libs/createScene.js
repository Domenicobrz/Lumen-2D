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


function createScene(scene) {

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


    let cs = 9.5;

    let count = 35;
    let radius = 7.5;
    let edgeMaterial2 = new DielectricMaterial({ roughness: 0.2, transmittance: 1, ior: 2.1 });

    let colors2 = [
        [5, 15, 10],
        [5, 13, 4],
        [11, 8, 3],
        [12, 8, 3],
        [20, 4, 2],
        [30, 1, 1],
    ];
    // for(let i = 0; i < 5; i++) {
    //     let angle1 = (i / 5)       * Math.PI * 2;
    //     let angle2 = ((i + 1) / 5) * Math.PI * 2;

    //     angle1 = (angle1 + (Math.PI * 0.5)) % (Math.PI * 2);
    //     angle2 = (angle2 + (Math.PI * 0.5)) % (Math.PI * 2);

    //     let radius = 2.5;

    //     let px1 = Math.cos(angle1) * radius;
    //     let py1 = Math.sin(angle1) * radius;
    
    //     let px2 = Math.cos(angle2) * radius;
    //     let py2 = Math.sin(angle2) * radius;

    //     scene.add(new Edge(px2, py2, px1, py1), edgeMaterial2);

    //     // let beamColor = [ colors2[i][0] * cs, colors2[i][1] * cs, colors2[i][2] * cs ]; 
    //     // scene.add(new Edge(ex1, ey1, ex2, ey2), new BeamEmitterMaterial({ color: beamColor, beamDirection: [dx, dy] }));
    // }

    let inserted = [{
        x: 0,
        y: 0,
        r: 1.5
    }];
    
    for(let j = 0; j < 1300; j++) {
        let offx = Utils.rand() * 35 - 17.5;
        let offy = Utils.rand() * 20 - 10;

        let radius = Utils.rand() * 1 + 0.3;
        let angle = Utils.rand() * Math.PI * 2;


        let intersects = false;
        for(let i = 0; i < inserted.length; i++) {
            // check for collisions with other triangles
            let obj = inserted[i];
            let distSq = (obj.x - offx) * (obj.x - offx) + 
                         (obj.y - offy) * (obj.y - offy); 
            let radSumSq = (obj.r + radius) * (obj.r + radius); 

            intersects = false;

            if (distSq == radSumSq) {
                intersects = true; 
                console.log("detected intersection");
                break;
            }
            else if (distSq > radSumSq) {
                intersects = false; 
            }
            else {
                intersects = true; 
                break;
            }
        }
        if(intersects) continue;



        inserted.push({
            x: offx,
            y: offy,
            r: radius,
        });

        let material1 = new LambertMaterial({ opacity: 0.85 });
        let material2 = new DielectricMaterial({ opacity: 1, transmittance: 0.8, ior: 1.7, roughness: 0.1 });

        for(let i = 0; i < 3; i++) {
            let angle1 = (i / 3)       * Math.PI * 2;
            let angle2 = ((i + 1) / 3) * Math.PI * 2;

            angle1 = (angle1 + angle) % (Math.PI * 2);
            angle2 = (angle2 + angle) % (Math.PI * 2);


            let px1 = Math.cos(angle1) * radius;
            let py1 = Math.sin(angle1) * radius;
        
            let px2 = Math.cos(angle2) * radius;
            let py2 = Math.sin(angle2) * radius;

            let material = j % 3 === 0 ? material2 : material1;

            scene.add(new Edge(px2 + offx, py2 + offy, px1 + offx, py1 + offy), material);
        }
    }
    
    



    // scene.add(new Circle(0, 0, 1), new EmitterMaterial({ color: [40, 40, 40], opacity: 0 }));
    let by = 0;
    // scene.add(new Edge(-5, by+1, -4.9, by+1), new BeamEmitterMaterial({ color: [50 * cs, 16 * cs, 4 * cs], opacity: 0, beamDirection: [0.67,1] }));
    // scene.add(new Edge(4.9, by, 5, by), new BeamEmitterMaterial({ color: [60 * cs, 2 * cs, 1 * cs], opacity: 0, beamDirection: [-0.67,1] }));
    let cs2 = cs * 20;
    scene.add(new Circle(0, 0, 0.5), new BeamEmitterMaterial({ color: [50 * cs, 16 * cs, 4 * cs], opacity: 1, }));
    scene.add(new Circle(0, 0, 0.01), new EmitterMaterial({ color: [50 * cs2, 16 * cs2, 4 * cs2], opacity: 0, sampleWeight: 0.01 }));
    // scene.add(new Circle(+Utils.rand() * 10, 0, 0.5), new EmitterMaterial({ color: [60 * cs, 2 * cs, 1 * cs], opacity: 0,  }));

    // scene.add(new Edge(0, by-1, 0, by-1+0.1), new BeamEmitterMaterial({ color: [50 * cs, 16 * cs, 4 * cs], opacity: 0, beamDirection: [1,0] }));
    // scene.add(new Edge(0, by+1, 0, by+1-0.1), new BeamEmitterMaterial({ color: [60 * cs, 2 * cs, 1 * cs], opacity: 0, beamDirection: [-1,0] }));


    
    let colors = [
        [5, 15, 10],
        [5, 13, 4],
        [11, 8, 3],
        [12, 8, 3],
        [20, 4, 2],
        [30, 1, 1],
    ];

    for(let i = 0; i < colors.length; i++) {
        let beamwidth = 0.1;
        let color = colors[i];

        let x = -15 + i * beamwidth * 60.5;
        let y = 10.5 + i * 0.2;

        //   scene.add(new Circle(x, y, 0.5, 11), new EmitterMaterial(
        //     { opacity: 0, 
        //       color: [color[0] * cs, color[1] * cs, color[2] * cs], 
        //       beamDirection: [0, -1] }));    
    }





}

export { createScene };