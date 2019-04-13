import { Material } from "./material.js";
import { glMatrix, vec2, mat2 } from "./../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";

class DielectricMaterial extends Material {
    constructor(options) {
        super(options);

        if(!options) options = { };

        this.roughness     = options.roughness !== undefined ? options.roughness : 0.15;
        this.ior           = options.ior !== undefined ? options.ior : 1.4;
        this.transmittance = options.transmittance !== undefined ? options.transmittance : 1;
        this.dispersion    = options.dispersion !== undefined ? options.dispersion : 0;
        this.absorption    = options.absorption !== undefined ? options.absorption : 0.1;
    }

    setSellmierCoefficients(b1, b2, b3, c1, c2, c3, d) {

        /*
        B1 = 12 * 1.03961212;
        B2 = 12 * 0.231792344;
        B3 = 12 * 1.01046945;
        C1 = 12 * 0.00600069867;
        C2 = 12 * 0.0200179144;
        C3 = 12 * 103.560653;
        */

        this.b1 = b1;
        this.b2 = b2;
        this.b3 = b3;

        this.c1 = c1;
        this.c2 = c2;
        this.c3 = c3;

        this.d  = d;
    }

    computeScattering(ray, input_normal, t, contribution, worldAttenuation, wavelength) {


        // opacity test, if it passes we're going to let the ray pass through the object
        if(this.opacityTest(t, worldAttenuation, ray, contribution)) {
            return;
        }



        let dot = vec2.dot(ray.d, input_normal); 
                                                 
        let normal = vec2.clone(input_normal);
        if(dot > 0.0) {    
            vec2.negate(normal, normal);
        }            

        // dot = Math.abs(  vec2.dot(ray.d, input_normal)  );
        // contribution *= dot; 




        /* a dielectric material in Lumen2D "should" specify an absorption value:
           
           imagine two mirror objects reflecting the same beam in the same direction
           with an infinite number of bounces. 
           
           |             |
           | -->  x  <-- |
           |             |
   
           what's the "fluency" at point x ?
           It would be "infinite"! if we don't use an absorption coefficient,
           and we set a very high light-bounce limit (e.g. 400) the light that enters a dielectric poligon
           would bounce around it (thanks to fresnel reflection) a lot of times thus increasing its
           "brightness" on screen, and that could make the dielectric shape look brighter than its lightsource
        */

        let absorption = (1 - this.absorption);
        let wa = (Math.exp(-t * worldAttenuation)) * absorption;
        contribution.r *= wa;
        contribution.g *= wa;
        contribution.b *= wa;








        let newDirection = vec2.create();

        // evaluate BRDF    - from Tantalum
        let w_o = vec2.fromValues(-ray.d[0], -ray.d[1]);


        // normal rotation matrix
        let mat = mat2.fromValues(input_normal[1], -input_normal[0], input_normal[0], input_normal[1]);
        let imat = mat2.create();
        mat2.invert(imat, mat);
        vec2.transformMat2(w_o, w_o, imat);



        let sigma = this.roughness;
        let ior = wavelength !== undefined ? this.getIOR(wavelength) : this.ior;

        let PI_HALF = Math.PI * 0.5;
        let theta  = Math.asin(Math.min(Math.abs(w_o[0]), 1.0));
        let theta0 = Math.max(theta - PI_HALF, -PI_HALF);
        let theta1 = Math.min(theta + PI_HALF,  PI_HALF);


        let xi = Math.random();
        let sigmaSq = sigma*sigma;
        let invSigmaSq = 1 / sigmaSq;

        let cdf0 = Math.tanh(theta0 * 0.5 * invSigmaSq);
        let cdf1 = Math.tanh(theta1 * 0.5 * invSigmaSq);

        let thetaM = 2 * sigmaSq * Math.atanh(cdf0 + (cdf1 - cdf0) * xi);  


        let m = vec2.fromValues(Math.sin(thetaM), Math.cos(thetaM));

        let wiDotM = vec2.dot(w_o, m);
        let cosThetaT;
        let etaM = wiDotM < 0 ? ior : 1 / ior;


        let F = 0;
        let cosThetaI = Math.abs(wiDotM);
        let sinThetaTSq = etaM * etaM * (1 - cosThetaI * cosThetaI);
        if (sinThetaTSq > 1) {
            cosThetaT = 0;
            F = 1;
        } else {
            cosThetaT = Math.sqrt(1 - sinThetaTSq);
            let Rs = (etaM * cosThetaI - cosThetaT) / (etaM * cosThetaI + cosThetaT);
            let Rp = (etaM * cosThetaT - cosThetaI) / (etaM * cosThetaT + cosThetaI);
            F = (Rs * Rs + Rp * Rp) * 0.5;            
        }

        F += 1 - this.transmittance;

        if (wiDotM < 0) cosThetaT = -cosThetaT;

        let refracted = false;
        if (Math.random() < F) {
            // reflection
            m[0] = 2 * wiDotM * m[0] - w_o[0];
            m[1] = 2 * wiDotM * m[1] - w_o[1];
        } else {
            // refraction
            m[0] = (etaM * wiDotM - cosThetaT) * m[0] - etaM * w_o[0];            
            m[1] = (etaM * wiDotM - cosThetaT) * m[1] - etaM * w_o[1];      
            refracted = true;
        }

        vec2.transformMat2(m, m, mat);

        vec2.copy(newDirection, m);
        vec2.normalize(newDirection, newDirection);
        // evaluate BRDF - END

        







        let newOrigin = vec2.create();

        if(!refracted) t = t - Globals.epsilon;
        else           t = t + Globals.epsilon; // refracted rays needs to "pass through"

        vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t); 

        vec2.copy(ray.o, newOrigin);
        vec2.copy(ray.d, newDirection);    
    }


    getIOR(wavelength) {
        let iorType = 0;
        if(this.b1 !== undefined) iorType = 1;  // if Sellmeier's coefficients are provided, use those


        if (iorType === 0) {
            let t = ((wavelength - 380) / 360) * 2 - 1;
            return (this.ior + t * this.dispersion);

        } else if (iorType === 1) {
            let B1 = this.b1;
            let B2 = this.b2;
            let B3 = this.b3;
            let C1 = this.c1;
            let C2 = this.c2;
            let C3 = this.c3;
            let w2 = (wavelength*0.001) * (wavelength*0.001);

            let res = Math.sqrt(1 + (B1 * w2) / (w2 - C1) + (B2 * w2) / (w2 - C2) + (B3 * w2) / (w2 - C3));
            return res / this.d;
        }
    }
}

export { DielectricMaterial }