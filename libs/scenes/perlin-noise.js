import { Edge } from "./geometry/Edge.js";
import { Circle } from "./geometry/Circle.js";
import { LambertMaterial } from "./material/lambert.js";
import { EmitterMaterial } from "./material/emitter.js";
import { Utils } from "./utils.js";
import { DielectricMaterial } from "./material/dielectric.js";
import { quickNoise } from "./dependencies/quick-noise.js";


function createScene(scene, workerData, motionBlurT, ctx, frameNumber) {

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



    let seed = Math.floor(workerData.randomNumber * 1000000000);
    console.log(seed);
    Utils.setSeed(seed);
    let rand = Utils.rand;



    let triangleMaterial =  new DielectricMaterial({
        opacity: 1,
        transmittance: 1,
        ior: 1.4,
        roughness: 0.000004,
        dispersion: 0.05,
        absorption: 0.45
    });

    let sides = 5;
    for(let j = 0; j < 1; j++) {
        let xOff = 0;
        let yOff = 0;

        let radius = 5;

        for(let i = 0; i < sides; i++) {
            let angle1 = (i / sides) * Math.PI * 2;
            let angle2 = ((i+1) / sides) * Math.PI * 2;

            angle1 += Math.PI / 2;
            angle2 += Math.PI / 2;

            for(let i = 0; i < 100; i++) {
                radius += quickNoise.noise(i * 0.2, i * 0.2, i * 0.2) * 0.2;

                let tx1 = Math.cos(angle1) * radius;
                let ty1 = Math.sin(angle1) * radius;
                let tx2 = Math.cos(angle2) * radius;
                let ty2 = Math.sin(angle2) * radius;


                let t1 = (i / 99);
                let t2 = ((i+1) / 99);
                let dx = tx2-tx1;
                let dy = ty2-ty1;

                scene.add(
                    new Edge(
                        tx1 + dx * t1 + xOff, 
                        ty1 + dy * t1 + yOff, 
                        tx1 + dx * t2 + xOff, 
                        ty1 + dy * t2 + yOff), 
                    new LambertMaterial({opacity: 0.92})
                );
            }
        }
    }
    
    scene.add(
        new Circle(0,0, 7), 
        triangleMaterial,
    );

    scene.add(
        new Circle(-21, 0, 3), 
        new EmitterMaterial({ 
            opacity: 0,
            color: function() {

                let w = 680;
                if(Math.random() > 0) w = Math.random() * 360 + 380;

                return {
                    wavelength: w,
                    intensity: 10.5,
                }
            }, 
            // since the Scene class samples lightsources depending on their strenght, we can't know beforehand what's the value inside 
            // the "color" property (it's a function!) so we *have* to specify a sampling value for this light source 
            samplePower: 150,
        })
    );
}

export { createScene };