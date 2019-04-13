import { EmitterMaterial } from "./material/emitter.js";
import { LambertMaterial } from "./material/lambert.js";
import { glMatrix, vec2 } from "./dependencies/gl-matrix-es6.js";
import { BVH } from "./bvh.js";

class Scene {
    constructor(args) {
        this._objects  = [];
        this._bvh;

        // using a cumulative distribution function to sample emitters
        this._emittersCdfArray = [];
        this._emittersCdfMax   = 0;
        this.args = args;
    }

    reset() {
        this._emittersCdfArray = [];
        this._emittersCdfMax   = 0;
        this._objects          = [];
        this._bvh              = undefined;
    }

    add(object, material) {
        object.material = material || new LambertMaterial();
        this._objects.push(object);

        if(object.material instanceof EmitterMaterial) {
            let prevCdfValue = 0;
            if(this._emittersCdfArray.length !== 0) 
                prevCdfValue = this._emittersCdfArray[this._emittersCdfArray.length - 1].cdfValue;

            let sampleValue;
            if(object.material.samplePower) {
                sampleValue = object.material.samplePower;
            } else {
                sampleValue = (object.material.color[0] + object.material.color[1] + object.material.color[2]) * object.material.sampleWeight;
            }   

            let newCdfValue = prevCdfValue + sampleValue;
            this._emittersCdfArray.push({ object: object, cdfValue: newCdfValue });

            this._emittersCdfMax = newCdfValue;
        }
    }

    // Uses a binary search to choose an emitter, the probability of choosing an emitter over the other depends on the emitter's color strenght
    // Emitter.sampleWeight can be used to change the cdf value for that particular sample
    getEmitter() {
        let t = Math.random();
        let sampledCdfValue = t * this._emittersCdfMax;

        // binary search
        let iLow = 0;
        let iHigh = this._emittersCdfArray.length - 1;

        if(this._emittersCdfArray.length === 1) return this._emittersCdfArray[0].object;

        while(iLow <= iHigh) {
            let iMiddle = Math.floor((iLow + iHigh) / 2);

            let iMiddleCdfValue = this._emittersCdfArray[iMiddle].cdfValue;
            let prevCdfValue = 0;
            if(iMiddle > 0) prevCdfValue = this._emittersCdfArray[iMiddle - 1].cdfValue;

            if(sampledCdfValue > prevCdfValue && sampledCdfValue < iMiddleCdfValue) {
                iLow = iMiddle; // found
                break;
            }
            else if(sampledCdfValue < prevCdfValue) {
                iHigh = iMiddle - 1;
            } else {
                iLow = iMiddle + 1;
            }
        }

        return this._emittersCdfArray[iLow].object;
    }

    intersect(ray) {

        if(!this._bvh) {
            this._bvh = new BVH(this._objects, {
                showDebug: this.args.showBVHdebug
            });
        }

        let result = this._bvh.intersect(ray);

        return result;
    }
}

export { Scene }