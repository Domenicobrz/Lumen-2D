# Lumen 2D javascript renderer

<img src="https://user-images.githubusercontent.com/25647854/55956659-bf734b80-5c64-11e9-9e8c-92e5ebd43d41.jpg" width="30%"></img> <img src="https://user-images.githubusercontent.com/25647854/55956539-7e7b3700-5c64-11e9-81fb-96cf031d679b.jpg" width="30%"></img> <img src="https://user-images.githubusercontent.com/25647854/56071503-589e8100-5d8f-11e9-9253-fccd218fc56c.jpg" width="30%"></img> <img src="https://user-images.githubusercontent.com/25647854/55277200-b8138000-52fd-11e9-9181-2efc6d4b3870.jpg" width="30%"></img> <img src="https://user-images.githubusercontent.com/25647854/55277201-b8138000-52fd-11e9-9b63-00f1b1b53fad.jpg" width="30%"></img> <img src="https://user-images.githubusercontent.com/25647854/55277202-b8138000-52fd-11e9-92ef-1572bd32d696.jpg" width="30%"></img> <img src="https://user-images.githubusercontent.com/25647854/55277203-b8138000-52fd-11e9-9875-cdde005bf2f8.jpg" width="30%"></img> <img src="https://user-images.githubusercontent.com/25647854/55277204-b8ac1680-52fd-11e9-9ebd-a7b01ad17de7.jpg" width="30%"></img> <img src="https://user-images.githubusercontent.com/25647854/55277205-b8ac1680-52fd-11e9-8fe9-434ec8ddb154.jpg" width="30%"></img> 

 
How to use
======
1. **You need to enable this chrome flag to be able to use this project**
   
   --enable-experimental-web-platform-features
   
   This is currently required because the project uses es6 modules inside webworkers
2. Download the repo
3. Inside the script `createScene.js` you can code the scene you want to render
4. Then simply open index.html with a local server

Quick Docs
======

The project currently supports only two types of primitives (Edges and Circles) and five types of materials (Lambert, Microfacet, Dielectric, Emitter, BeamEmitter)

You can see few examples of how to make a scene script inside the `libs/scenes` folder

Primitives
------
### Edge
```javascript
let edge = new Edge(x1, y1, x2, y2,   
                    nx /* normal of the line -- optional */,
                    ny /* normal of the line -- optional */,
                    blur /* used for DOF effects -- optional, beware high values of this parameter are very costly */ );
```
### Circle
```javascript
let circle = new Circle(x1, y1,  /* center of the circle */
                        radius,  /* length of its radius */ 
                        blur /* used for DOF effects -- optional, beware high values of this parameter are very costly */ );
```
Materials
------
### Lambert
```javascript
let material = new LambertMaterial({ opacity: op /* between [0...1] -- optional, try it :) */ );
```
### Microfacet
```javascript
let material = new MicrofacetMaterial({ opacity: op /* same as lambert */
                                        roughness: rn /* between [0...1] -- optional */ });
```
### Dielectric

An extension of MicrofacetMaterial that also handles refraction

```javascript
let material = new DielectricMaterial({ opacity: op /* same as Lambert */
                                        roughness: rn /* same as Microfacet */ 
                                        ior: i /* index of refraction -- optional */
                                        transmittance: t /* how much light is reflected vs how much is transmitted -- optional */ });
```
### Emitter

Used for light sources, will take a random point from the primitive and will cast an omnidirectional light from it each time a photon is sampled

```javascript
let material = new EmitterMaterial({ opacity /* same as Lambert */
                                     color: [r,g,b] /* light source color, is NOT required to be in the range [0...1] or [0...255] */
                                     sampleWeight: sw /* read below -- optional */ });
```
Each light source is sampled with a probability that increases with the strenght of the values inside `color`, so the stronger the light source, the more often it is sampled among the available pool of light sources. To change the "sampling strenght" of a lightsource (e.g. if you have a very bright light source but you don't want to draw too many samples from it) you can change the `sampleWeight` parameter

### BeamEmitter

Same as Emitter but can specify a direction and the light source will only emit photons in that direction

```javascript
let material = new EmitterMaterial({ opacity /* same as Lambert */
                                     color: [r,g,b] /* same as Emitter */
                                     beamDirection: [ x, y, z ] /* the direction along which photons are emitted, doesn't need to be normalized */
                                     sampleWeight: sw /* same as Emitter */ });
```

Gotchas
======

Here's few things to keep in mind while using this project

1. The code is a mess. At this point it's not really meant to be a library but just a set of scripts to create cool pictures, eventually (maybe with your help) it will be refactored into a useable library

2. Don't use `Math.random()` inside createScene() !! Since createScene is launched from possibly many webWorkers each one will pick his own set of random values and your scene WILL be different in each webworker! Instead, use `Utils.rand()` which was created to give consistent random values between web workers


Credits
------
I can't thank [Benedikt Bitterli](https://benedikt-bitterli.me/) enough for his post [The Secret Life of Photons](https://benedikt-bitterli.me/tantalum/), where he presented the derivation and usage of few BRDFs which I used in this project