


importScripts('dependencies/gl-matrix.js');
importScripts('tracingFunctions.js');


var canvasSize;
var scene;
var pixelBuffer = [];
var vec2 = glMatrix.vec2;
var samplesTaken = 0;


onmessage = e => {

    if(e.data.type == "start") {
        canvasSize = e.data.canvasSize;
        scene = e.data.scene;

        for(let i = 0; i < canvasSize; i++) {
            pixelBuffer.push([ ]);
    
            for(let j = 0; j < canvasSize; j++) {
                pixelBuffer[i].push(new Pixel(j, canvasSize - i - 1));
            }
        }


        scene = new Scene();


        // let circle = new Circle(0, 0, 2);
    
        let ledge = new StraightEdge(vec2.fromValues(-9, -9), vec2.fromValues(-9, 9));
        let redge = new StraightEdge(vec2.fromValues(9, -9), vec2.fromValues(9, 9));
        let tedge = new StraightEdge(vec2.fromValues(-9, 9), vec2.fromValues(9, 9));
        let bedge = new StraightEdge(vec2.fromValues(-9, -9), vec2.fromValues(9, -9));
    
        let emissionEdge1 = new StraightEdge(vec2.fromValues(-0.5, 6), vec2.fromValues(0.5, 6));
        let emissionEdge2 = new StraightEdge(vec2.fromValues(-0.5, -6), vec2.fromValues(0.5, -6));
    
        // let ray = new Ray(
        //     vec2.fromValues(0.5, -4),
        //     vec2.fromValues(0, 1)
        // );
    
        scene.add(ledge);
        scene.add(redge);
        scene.add(tedge);
        scene.add(bedge);
        scene.add(emissionEdge1, { type: "emitter", color: [5, 1, 0] });
        scene.add(emissionEdge2, { type: "emitter", color: [0, 1, 7] });



        requestAnimationFrame(renderSample);
    }

};



function renderSample() {
    requestAnimationFrame(renderSample);

    samplesTaken++;

    for(let i = canvasSize - 1; i >= 0; i--)
    for(let j = 0; j < canvasSize; j++) {
        let pixel = pixelBuffer[i][j];
        // we need to reset the value stored previously each time we compute a new sample otherwise main.js accumulates astronomical numbers
        pixel.r = 0;
        pixel.g = 0;
        pixel.b = 0;
    }


    for(let r = 0; r < 10; r++) {

        for(let i = canvasSize - 1; i >= 0; i--)
        for(let j = 0; j < canvasSize; j++) {
            let pixel = pixelBuffer[i][j];
            rayTrace(pixel);
        }
    }

    postMessage({
        samplesTaken: 10,
        buffer: pixelBuffer,
    });
}