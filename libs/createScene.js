import { Scene } from "./scene.js";
import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { Ray } from "./ray.js";
import { Pixel } from "./pixel.js";
import { LambertMaterial } from "./material/lambert.js";
import { EmitterMaterial } from "./material/emitter.js";
import { BeamEmitterMaterial } from "./material/beamEmitter.js";
import { glMatrix, vec2 } from "./dependencies/gl-matrix-es6.js";
import { Utils } from "./utils.js";
import { MicrofacetMaterial } from "./material/microfacet.js";
import { DielectricMaterial } from "./material/dielectric.js";
import { ContributionModifierMaterial } from "./material/contributionModifier.js";
import { quickNoise } from "./dependencies/quick-noise.js";


function createScene(scene, workerData, motionBlurT, ctx, frameNumber) {

    let edgeMaterial = new LambertMaterial({ opacity: 1 });
    let tbound = 11;
    let lbound = 19.5;
    let rbound = 19.5;
    let bbound = 11;
    let ledge  = new Edge(-lbound, -bbound, -lbound,  tbound,    0, 1, 0);
    let redge  = new Edge( rbound, -bbound,  rbound,  tbound,    0, -1, 0);
    let tedge  = new Edge(-lbound,  tbound,  rbound,  tbound,    0, 0, -1);
    let bedge  = new Edge(-lbound, -bbound,  rbound, -bbound,    0, 0, 1);


    scene.add(ledge, edgeMaterial);
    scene.add(redge, edgeMaterial);
    scene.add(tedge, edgeMaterial);
    scene.add(bedge, edgeMaterial);



    let seed = "235554"; //Math.floor(workerData.randomNumber * 1000000000);
    // console.log(seed);
    Utils.setSeed(seed);
    let rand = Utils.rand;




    let edge  = new Edge(0, 0, 1, 0);
    let edge2  = new Edge(0, 0, 1, 0);
    scene.add(edge, new BeamEmitterMaterial({ color: [250, 250, 250], beamDirection: [-1, 0.5] }));
    scene.add(edge2, new BeamEmitterMaterial({ color: [250, 250, 250], beamDirection: [1, 0.5] }));




    
    // let triangleMaterial =  new DielectricMaterial({
    //     opacity: 1,
    //     transmittance: 1,
    //     ior: 1.5,
    //     roughness: 0.001,
    //     dispersion: 0.15,
    //     absorption: 0.65
    // });

   

    // ctx.fillStyle = "rgb(180, 180, 180)";
    // ctx.beginPath();
    // ctx.arc(0, 2, 5, 0, 2 * Math.PI);
    // ctx.fill();




    // makeCircles(scene, 0, 0, 0, 7, 0, frameNumber, ctx);
    
    // for(let i = 0; i < 60; i++) {
    //     let angle1 = (i / 60) * Math.PI * 2;
    //     let x1 = Math.cos(angle1) * 5;
    //     let y1 = Math.sin(angle1) * 5;

    //     let angle2 = ((i+1) / 60) * Math.PI * 2;
    //     let x2 = Math.cos(angle2) * 5;
    //     let y2 = Math.sin(angle2) * 5;


    //     let ss = 0.95;
    //     let edge = new Edge(x2, y2, x1, y1);
    //     let edge2 = new Edge(x1 * ss, y1 * ss, x2 * ss, y2 * ss);
    //     let material1 = new LambertMaterial({ opacity: 0.7 });
    //     // let material2 = new LambertHollowMaterial({ opacity: 0.7 });

    //     scene.add(edge, material1);
    //     // scene.add(edge2, material2);
    // }
   





    
    // scene.add(
    //     new Circle(-15, 0, 2), 
    //     new EmitterMaterial({ 
    //         opacity: 0,
    //         color: [400, 400, 400] })
    // );

    // let x = 15, y = 5;
    // for(let i = 0; i < 5; i++) {

    //     let xDir = i % 2 === 0 ? 1 : -1;
    //     x = -x;
    //     y -= 1.5;

    //     scene.add(
    //         new Edge(x, y, x, y + 0.1), 
    //         new BeamEmitterMaterial({ 
    //             opacity: 0,
    //             beamDirection: [xDir, 0],
    //             // color: [400, 400, 400] 
    //             color: function() {

    //                 let i = 1.5;
    //                 let w = 680;

    //                 if(Math.random() > 0) w = Math.random() * 360 + 380;

    //                 if(w > 400 && w < 450) i = 2;

    //                 return {
    //                     wavelength: w,
    //                     intensity: i * 15,
    //                 }
    //             }, 
    //             // since the Scene class samples lightsources depending on their strenght, we can't know beforehand what's the value inside 
    //             // the "color" property (it's a function!) so we *have* to specify a sampling value for this light source 
    //             samplePower: 150,
    //         })
    //     );
    // }
}





function makeCircles(scene, depth, x, y, r, sa, frameNumber, ctx) {

    let material1 = new LambertMaterial({ opacity: 0.65, });
    let material2 = new DielectricMaterial({ 
        opacity: 1,
        transmittance: 1,
        ior: 1.5,
        roughness: 0.1,
        dispersion: 0.15,
        absorption: 0.45
    });

    let material = material1;
    if(depth === 1) material = material2;
    // if(depth === 0) material = new LambertMaterial({ opacity: 0.7 });
    if(depth === 2) material = material2;
    if(depth === 4) {
        ctx.fillStyle = "rgb(250, 250, 250)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
    }

    // if(Utils.rand() > 0.8 && depth > 1) {
    //     let r = 1250 * Utils.rand() * ( 1 + depth * 0.3);
    //     let g = 1250 * Utils.rand() * ( 1 + depth * 0.3);
    //     let b = 1250 * Utils.rand() * ( 1 + depth * 0.3);
    //     material = new EmitterMaterial( { opacity: 0.7, color: [r,g,b] });
    // }


    if(depth < 4 && depth > 0) scene.add(new Circle(x, y, r), material);
    if(depth > 3) return;

    let t = (frameNumber / 30);
    t = t * t * (3 - 2 * t);

    sa = sa + Utils.rand() * Math.PI + t * 0.3;

    for(let i = 0; i < 3; i++) {

        let slice = (Math.PI * 2) / 3;
        let angle = sa + slice * i;// + Utils.rand() * slice * 0.5;

        let nr = (r / 2.5);
        let nx = x + Math.cos(angle) * (r-nr - r * 0.025);
        let ny = y + Math.sin(angle) * (r-nr - r * 0.025);

        makeCircles(scene, depth + 1, nx, ny, nr, sa, frameNumber, ctx);
    }
}




export { createScene };