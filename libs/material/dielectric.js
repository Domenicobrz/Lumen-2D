import { Material } from "./material.js";
import { glMatrix, vec2, mat2 } from "./../dependencies/gl-matrix-es6.js";
import { Globals } from "../globals.js";

class DielectricMaterial extends Material {
    constructor(options) {
        super();

        if(!options) options = { };

                       // remember: 0 is a valid opacity option, so we need to check for undefined instead of just going   options.opacity || 1
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
        this.roughness = options.roughness !== undefined ? options.roughness : 0.15;
        this.ior = options.ior !== undefined ? options.ior : 1.4;
        this.transmittance = options.transmittance !== undefined ? options.transmittance : 1;
        this.dispersion = options.dispersion !== undefined ? options.dispersion : 0;
    }

    computeScattering(ray, input_normal, t, contribution, worldAttenuation, wavelength) {

        let scatterResult = { };

        // opacity test, if it passes we're going to let the ray pass through the object
        if(Math.random() > this.opacity) {

            // Compute contribution BEFORE CHANGING THE RAY.O ARRAY!
            let dot = Math.abs(  vec2.dot(ray.d, input_normal)  );
            let absorbtionDifference = 1 - dot;
            let opacityDot = dot + absorbtionDifference * (1 - this.opacity);

            contribution *= opacityDot;
            contribution *= Math.exp(-t * worldAttenuation);


            let newOrigin = vec2.create();
            vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t + Globals.epsilon); // it's important that the epsilon value is subtracted/added instead of doing t * 0.999999 since that caused floating point precision issues
            vec2.copy(ray.o, newOrigin);

            
            
            scatterResult.contribution = contribution;
 
            return { contribution: contribution };
        }



        // we're going to pick a random point in the hemisphere
        let dot = vec2.dot(ray.d, input_normal);   // ** REMEMBER !! **    the dot between ray.d & normal here is expected to be LESS than zero! 
                                                   //                      that's because the incident light ray should normally be negated before making the dot product
        let normal = vec2.clone(input_normal);
        if(dot > 0.0) {     // if it's greater than zero, we have a problem!  see here ^^^
            vec2.negate(normal, normal);
        }            




        // Compute contribution BEFORE CHANGING THE RAY.O ARRAY!
        // one of your older bug involved placing those lines AFTER changing the ray.o array
        dot = Math.abs(  vec2.dot(ray.d, input_normal)  );
        contribution *= dot;
        contribution *= Math.exp(-t * worldAttenuation);
        



        let newDirection = vec2.create();














        // evaluate BRDF
        let w_o = vec2.fromValues(-ray.d[0], -ray.d[1]);


        // normal rotation matrix
        let mat = mat2.fromValues(input_normal[1], -input_normal[0], input_normal[0], input_normal[1]);
        // let mat = mat2.fromValues(normal[1], -normal[0], normal[0], normal[1]);
        let imat = mat2.create();
        mat2.invert(imat, mat);
        vec2.transformMat2(w_o, w_o, imat);


        // function dielectricReflectance(eta, cosThetaI, cosThetaT) {
        //     let sinThetaTSq = eta * eta * (1 - cosThetaI * cosThetaI);
        //     if (sinThetaTSq > 1) {
        //         cosThetaT = 0;
        //         return 1.0;
        //     }
        //     cosThetaT = Math.sqrt(1 - sinThetaTSq);
        //     let Rs = (eta * cosThetaI - cosThetaT) / (eta * cosThetaI + cosThetaT);
        //     let Rp = (eta*cosThetaT - cosThetaI)/(eta*cosThetaT + cosThetaI);
        //     return (Rs * Rs + Rp * Rp) * 0.5;
        // }

        // function sampleVisibleNormal(sigma, xi, theta0, theta1) {
        //     let sigmaSq = sigma*sigma;
        //     let invSigmaSq = 1 / sigmaSq;

        //     let cdf0 = Math.tanh(theta0 * 0.5 * invSigmaSq);
        //     let cdf1 = Math.tanh(theta1 * 0.5 * invSigmaSq);

        //     return 2 * sigmaSq * Math.atanh(cdf0 + (cdf1 - cdf0) * xi);  
        // }


        let sigma = this.roughness;
        let ior = wavelength !== undefined ? this.getIOR(wavelength) : this.ior;

        let PI_HALF = Math.PI * 0.5;
        let theta  = Math.asin(Math.min(Math.abs(w_o[0]), 1.0));
        let theta0 = Math.max(theta - PI_HALF, -PI_HALF);
        let theta1 = Math.min(theta + PI_HALF,  PI_HALF);

        // let thetaM = sampleVisibleNormal(sigma, Math.random(), theta0, theta1);
        // expanded to:
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


        // let F = dielectricReflectance(etaM, Math.abs(wiDotM), cosThetaT);
        // expanded to:
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



        // return m*(dot(w_o, m)*2.0) - w_o;
        vec2.transformMat2(m, m, mat);

        vec2.copy(newDirection, m);
        vec2.normalize(newDirection, newDirection);
        // evaluate BRDF - END

        


        



        // bounce off again
        let newOrigin = vec2.create();

        if(!refracted) t = t - Globals.epsilon;
        else           t = t + Globals.epsilon; // refracted rays needs to "pass through"

        vec2.scaleAndAdd(newOrigin, ray.o, ray.d, t); // it's important that the epsilon value is subtracted/added instead of doing t * 0.999999 since that caused floating point precision issues
    

        vec2.copy(ray.o, newOrigin);
        vec2.copy(ray.d, newDirection);    


        return { contribution: contribution };
    }


    getIOR(wavelength) {
        let iorType = 2;

        if(iorType === 0) {

            let B1 = 3 * 1.03961212;
            let C1 = 3 * 0.00600069867;
            let B2 = 3 * 0.231792344;
            let C2 = 3 * 0.0200179144;
            let B3 = 3 * 1.01046945;
            let C3 = 3 * 103.560653;
            let w2 = (wavelength*0.001) * (wavelength*0.001);

            let ior = Math.sqrt(1 + (B1 * w2) / (w2 - C1) + (B2 * w2) / (w2 - C2) + (B3 * w2) / (w2 - C3));
            return (ior / 1.4);
        } else if (iorType === 1) {

            let B1 = 12 * 1.03961212;
            let C1 = 12 * 0.00600069867;
            let B2 = 12 * 0.231792344;
            let C2 = 12 * 0.0200179144;
            let B3 = 12 * 1.01046945;
            let C3 = 12 * 103.560653;
            let w2 = (wavelength*0.001) * (wavelength*0.001);

            return Math.sqrt(1 + (B1 * w2) / (w2 - C1) + (B2 * w2) / (w2 - C2) + (B3 * w2) / (w2 - C3));
        } else if (iorType === 2) {

            // let t = ((wavelength - 400) / 100) * 2 - 1;
            let t = ((wavelength - 380) / 360) * 2 - 1;
            // return (this.ior + t * this.dispersion * Math.pow(Math.random(), 0.5));
            // return (this.ior + t * this.dispersion * Math.pow(Math.random(), 1));
            // return (this.ior + t * this.dispersion * Math.pow(Math.random(), 2.0));
            return (this.ior + t * this.dispersion);

        } else if (iorType === 3) {

            let B1 = 30;
            let B2 = 2;
            let B3 = 1;

            let C1 = 0.29;
            let C2 = 0.49;
            let C3 = 0.59;
            let w2 = (wavelength*0.001) * (wavelength*0.001);

            let ii = 1.4;

            return Math.sqrt(1 + (B1 * w2) / (w2 - C1) + (B2 * w2) / (w2 - C2) + (B3 * w2) / (w2 - C3));// / ii;
        }
    }
}

export { DielectricMaterial }