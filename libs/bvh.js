import { glMatrix, vec2 } from "./dependencies/gl-matrix-es6.js";
import { AABB } from "./geometry/AABB.js";

class BVH {
    constructor(objects, args) {
        let stats = {
            degenerateNodes: 0,
            maxLevel: 0,
            splitOnX: 0,
            splitOnY: 0,
            intersectionTests: 0,
            intersectionCalls: 0,
            averageIntersectionCalls: 0,
        }

        // create a BVHNode root and add it to the queue
        this.stats = stats;
        this.root           = new BVHNode();
        this.root.leaf           = false;
        this.root.level          = 0;
        this.root.objectsIndices = [];

        for(let i = 0; i < objects.length; i++) {
            this.root.objectsIndices.push(i);
        }

        let queue = [];
        queue.push(this.root);

        // until queue is not empty
        while ( queue.length > 0 ) {
            // remove the first node from the queue
            let node = queue.shift();

            // calculate a possible splitting axis / point 
            let nodeAABB        = new AABB();
            let nodeCentersAABB = new AABB();  // used to decide the splitting axis
            for(let i = 0; i < node.objectsIndices.length; i++) {
                let objectIndex = node.objectsIndices[i];
                let object      = objects[objectIndex];

                nodeAABB.addAABB(object.aabb);
                nodeCentersAABB.addVertex(object.center);
            }
            node.aabb = nodeAABB;

            // if the node has two children, it becomes a leaf
            if ( node.objectsIndices.length <= 2 ) {
                node.leaf   = true;

                let object1, object2;
                if(node.objectsIndices[0] !== undefined) object1 = objects[node.objectsIndices[0]];
                if(node.objectsIndices[1] !== undefined) object2 = objects[node.objectsIndices[1]];

                if(object1) node.child1 = object1;
                if(object2) node.child2 = object2;                
            } // otherwise we need to compute its children
            else {  
                // choose a splitting axis
                let xAxisLength = Math.abs(nodeCentersAABB.min[0] - nodeCentersAABB.max[0]);
                let xAxisCenter = (nodeCentersAABB.min[0] + nodeCentersAABB.max[0]) / 2;
                let yAxisLength = Math.abs(nodeCentersAABB.min[1] - nodeCentersAABB.max[1]);
                let yAxisCenter = (nodeCentersAABB.min[1] + nodeCentersAABB.max[1]) / 2;
                let splitOnX    = xAxisLength > yAxisLength ? true : false;
                let splitCenter = xAxisLength > yAxisLength ? xAxisCenter : yAxisCenter;

                // create child nodes
                let node1 = new BVHNode();
                let node2 = new BVHNode();
                node1.leaf = false;
                node2.leaf = false;
                node1.level = node.level + 1;
                node2.level = node.level + 1;
                node1.parent = node;
                node2.parent = node;

                node.child1 = node1;
                node.child2 = node2;


                // stats collection
                stats.maxLevel = Math.max(node1.level, stats.maxLevel);
                if(splitOnX) stats.splitOnX++;
                else         stats.splitOnY++;
                // stats collection - END


                node1.objectsIndices = [];
                node2.objectsIndices = [];
                let axisIndex = splitOnX ? 0 : 1;
                for (let i = 0; i < node.objectsIndices.length; i++) {
                    let objectIndex = node.objectsIndices[i];
                    let object = objects[objectIndex];
                    
                    if (object.center[axisIndex] > splitCenter) {
                        node2.objectsIndices.push(objectIndex);
                    } else {
                        node1.objectsIndices.push(objectIndex);
                    }
                }
                
                // make sure both children have at least one element (might happen that one of the two arrays is empty if all objects share the same center)
                // if that doesn't happen, partition elements in both nodes
                if(node1.objectsIndices.length === 0) {
                    // m will be at least 1. if we got in here, node2.objectsIndices.length is at least 3
                    let m = Math.floor(node2.objectsIndices.length / 2);
                    for (let i = 0; i < m; i++) {
                        node1.objectsIndices.push(node2.objectsIndices.shift());
                    }
                    stats.degenerateNodes++;
                }
                if(node2.objectsIndices.length === 0) {
                    // m will be at least 1. if we got in here, node1.objectsIndices.length is at least 3
                    let m = Math.floor(node1.objectsIndices.length / 2);
                    for (let i = 0; i < m; i++) {
                        node2.objectsIndices.push(node1.objectsIndices.shift());
                    }
                    stats.degenerateNodes++;
                }

                // push to queue
                queue.push(node1);
                queue.push(node2);
            }

            // reset the "temporary children" array of the node since we don't need it anymore
            node.objectsIndices = [];
        }


        if(args.showDebug) {
            console.log("--- BVH stats ---");
            console.log("max depth: "        + stats.maxLevel);
            console.log("splits on x axis: " + stats.splitOnX);
            console.log("splits on y axis: " + stats.splitOnY);
            console.log("degenerate nodes: " + stats.degenerateNodes);
            console.log("--- END ---");
        }
    }

    intersect(ray) {

        this.stats.intersectionTests++;

        let mint = Infinity;
        let closestObject;
        let closestResult;

        let toVisit = [this.root];

	    while (toVisit.length !== 0) {
            let node = toVisit.pop();
            this.stats.intersectionCalls++;
            

            if (!node.leaf) {
                let res1 = false;
                let res2 = false;
                if(node.child1) res1 = node.child1.aabb.intersect(ray);
                if(node.child2) res2 = node.child2.aabb.intersect(ray);

                // USE FALSE AND NOT THE CONTRACTED IF FORM -- ZERO WOULD TEST AS FALSE!! (and we might need to check for a value of 0 instead of false)
                if(res1 === false && res2 === false) {
                    continue;
                } else if (res1 !== false && res2 === false && (res1.t < mint)) {
                    toVisit.push(node.child1);
                } else if (res1 === false && res2 !== false && (res2.t < mint)) {
                    toVisit.push(node.child2);
                } else {
                    if (res1.t < res2.t) {
                        if (res2.t < mint) toVisit.push(node.child2);
                        if (res1.t < mint) toVisit.push(node.child1);
                    } else {
                        if (res1.t < mint) toVisit.push(node.child1);
                        if (res2.t < mint) toVisit.push(node.child2);
                    }
                }
            }

            if (node.leaf) {
                let res1 = false;
                let res2 = false;

                // here we don't test the intersection with the aabb, but with the object itself !
                if(node.child1) res1 = node.child1.intersect(ray);
                if(node.child2) res2 = node.child2.intersect(ray);

                if(res1 !== false && res1.t < mint) {
                    mint = res1.t;
                    closestObject = node.child1;
                    closestResult = res1;
                } 
                if(res2 !== false && res2.t < mint) {
                    mint = res2.t;
                    closestObject = node.child2;    
                    closestResult = res2;
                }
            }
        }

        this.stats.averageIntersectionCalls = this.stats.intersectionCalls / this.stats.intersectionTests;

        if(closestResult) 
            return { t: closestResult.t, normal: closestResult.normal, object: closestObject };
        else
            return false;
    }
}

class BVHNode {
    constructor() {
        this.parent;
        this.leaf;
        this.level;

        this.objectsIndices;

        this.child1;
        this.child2;
        
        this.aabb;
    }
}


export { BVH }