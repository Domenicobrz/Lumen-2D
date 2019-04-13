import "./dependencies/webm-writer-0.2.0.js";
import { download } from "./dependencies/download.js";


class VideoManager {

    constructor(Globals, workers, canvas) {
        this.videoWriter = new WebMWriter({
            quality: 1,       // WebM image quality from 0.0 (worst) to 1.0 (best)
            fileWriter: null, // FileWriter in order to stream to a file instead of buffering to memory (optional)
            fd: null,         // Node.js file handle to write to instead of buffering to memory (optional)
        
            // You must supply one of:
            frameDuration: null, // Duration of frames in milliseconds
            frameRate: Globals.framesPerSecond, // Number of frames per second
        });

        this.currentVideoFrame = Globals.frameStart;
        this.activeWorkers = Globals.workersCount;

        this.videoPhotonsCounter = 0;
        this.preparingNextFrame = false;

        // reads as "next video frame steps"
        this.nvfSteps = {
            STOP_WORKERS: 0,
            WAITING_WORKERS_BLOCK: 3,
            ALL_WORKERS_BLOCKED: 1,
            ALL_WORKERS_ACTIVE: 2,
            currentStep: 2,
        }

        this.Globals = Globals;

        this.workers = workers;

        this.canvas = canvas;

        this.events = { };
    }



    onWorkerAcknowledge() {
        this.activeWorkers--;
    }


    prepareNextVideoFrame() {
        this.preparingNextFrame = true;

        if(this.nvfSteps.currentStep === this.nvfSteps.ALL_WORKERS_ACTIVE) {
            this.preparingNextFrame = false;
        }
    
    


        // stop every active webworker
        if(this.nvfSteps.currentStep === this.nvfSteps.STOP_WORKERS) {
    
            for(let i = 0; i < this.Globals.workersCount; i++) {
                this.workers[i].postMessage({ messageType: "stop-rendering" });
            }
    
            this.nvfSteps.currentStep = this.nvfSteps.WAITING_WORKERS_BLOCK;
        }
    
        // wait until all webworkers have received the stop message and acknowledged it,
        // then reset the current canvas state to prepare for a new frame
        if(this.nvfSteps.currentStep === this.nvfSteps.WAITING_WORKERS_BLOCK) {
            if(this.activeWorkers === 0) {
                this.nvfSteps.currentStep = this.nvfSteps.ALL_WORKERS_BLOCKED;
                this.fireEvent("reset-samples");
                this.videoPhotonsCounter = 0;
            }
        }
    
        // restart all webworkers and start computing the next video frame
        if(this.nvfSteps.currentStep === this.nvfSteps.ALL_WORKERS_BLOCKED) {
            
            for(let i = 0; i < this.Globals.workersCount; i++) {
                this.workers[i].postMessage({ messageType: "compute-next-video-frame", frameNumber: this.currentVideoFrame });
            }
    
            this.activeWorkers = this.Globals.workersCount;
            this.nvfSteps.currentStep = this.nvfSteps.ALL_WORKERS_ACTIVE;
        }





        // fire this function again until we're done with it
        if(this.preparingNextFrame) {
            requestAnimationFrame(this.prepareNextVideoFrame.bind(this));
        }
    }


    addEventListener(type, callback) {
        if(this.events[type] === undefined) {
            this.events[type] = [];
        }
        this.events[type].push(callback);
    }

    fireEvent(type) {
        if(this.events[type] === undefined) return;

        for(let i = 0; i < this.events[type].length; i++) {
            let callback = this.events[type][i];
            callback();
        }
    }

    update(photonsCount) {
        // if the amount of photons fired since last frame exceeds the value in Globals.photonsPerVideoFrame
        // begin webworkers synchronization to reset their state and compute a new frame
        if((photonsCount - this.videoPhotonsCounter) > this.Globals.photonsPerVideoFrame) {

            this.videoPhotonsCounter = photonsCount;    
    
            let framesComputed = this.currentVideoFrame - this.Globals.frameStart;

            if(framesComputed >= this.Globals.framesCount) {
                this.videoWriter.complete().then(function(webMBlob) {
                    download(webMBlob, "video.webm", 'video/webm');
                });
    
                this.videoPhotonsCounter = Infinity;
            } else {
                this.currentVideoFrame++;
                this.nvfSteps.currentStep = this.nvfSteps.STOP_WORKERS;
                this.preparingNextFrame = true;

                this.prepareNextVideoFrame();
    
                console.log("video frame saved: " + this.currentVideoFrame);
    
                this.videoWriter.addFrame(this.canvas);
            }
        }
    }
}

export { VideoManager };