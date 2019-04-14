import { Edge } from "./geometry/Edge.js";
import { LambertMaterial } from "./material/lambert.js";
import { BeamEmitterMaterial } from "./material/beamEmitter.js";
import { Utils } from "./utils.js";
import { DielectricMaterial } from "./material/dielectric.js";


function createScene(scene, workerData, motionBlurT, ctx, frameNumber) {

    let edgeMaterial = new LambertMaterial({ opacity: 1 });
    let tbound = 16;
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
    Utils.setSeed(seed);
    let rand = Utils.rand;



    for(let i = 0; i < 3; i++) {
        let angle1 = (i / 3) * Math.PI * 2;
        let angle2 = ((i+1) / 3) * Math.PI * 2;

        angle1 += Math.PI / 2;
        angle2 += Math.PI / 2;

        let radius = 4;

        let tx1 = Math.cos(angle1) * radius;
        let ty1 = Math.sin(angle1) * radius;
        let tx2 = Math.cos(angle2) * radius;
        let ty2 = Math.sin(angle2) * radius;

        scene.add(
            new Edge(tx2, ty2, tx1, ty1), 
            new DielectricMaterial({
                opacity: 1,
                transmittance: 0.5,
                ior: 1.4,
                roughness: 0.15,
                dispersion: 0.125,
            })
        );
    }

    let edge = new Edge(-16, -3.1, -16, -3.2);

    scene.add(
        edge, 
        new BeamEmitterMaterial({ 
            color: function() {
                return {
                    wavelength: Math.random() * 360 + 380,
                    intensity: 1.5,
                }
            }, 
            // since the Scene class samples lightsources depending on their strenght, we can't know beforehand what's the value inside 
            // the "color" property (it's a function!) so we *have* to specify a sampling value for this light source            
            samplePower: 150,
            beamDirection: [1, 0.3] 
        })
    );
}

export { createScene };