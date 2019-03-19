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

        // crea un BVHNode root e lo aggiungo alla queue
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

        // finchè la queue non è vuota
        while ( queue.length > 0 ) {
            // prende il primo nodo dalla queue e lo rimuove
            let node = queue.shift();

            // computa l'AABB del nodo corrente in base ai figli, e calcola un possibile splitting axis / point 
            let nodeAABB        = new AABB();
            let nodeCentersAABB = new AABB();  // used to decide the splitting axis
            for(let i = 0; i < node.objectsIndices.length; i++) {
                let objectIndex = node.objectsIndices[i];
                let object      = objects[objectIndex];

                nodeAABB.addAABB(object.aabb);
                nodeCentersAABB.addVertex(object.center);
            }
            node.aabb = nodeAABB;

            // se il nodo ha solo 2 figli, diventa una leaf
            if ( node.objectsIndices.length <= 2 ) {
                // diventa una leaf, dunque non computiamo altri eventuali figli
                node.leaf   = true;

                let object1, object2;
                if(node.objectsIndices[0] !== undefined) object1 = objects[node.objectsIndices[0]];
                if(node.objectsIndices[1] !== undefined) object2 = objects[node.objectsIndices[1]];

                if(object1) node.child1 = object1;
                if(object2) node.child2 = object2;                
            } // altrimenti, dobbiamo computare i figli
            else {  
                // scegli lo splitting axis
                let xAxisLength = Math.abs(nodeCentersAABB.min[0] - nodeCentersAABB.max[0]);
                let xAxisCenter = (nodeCentersAABB.min[0] + nodeCentersAABB.max[0]) / 2;
                let yAxisLength = Math.abs(nodeCentersAABB.min[1] - nodeCentersAABB.max[1]);
                let yAxisCenter = (nodeCentersAABB.min[1] + nodeCentersAABB.max[1]) / 2;
                let splitOnX    = xAxisLength > yAxisLength ? true : false;
                let splitCenter = xAxisLength > yAxisLength ? xAxisCenter : yAxisCenter;

                // crea i nodi figli
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


                // crea un array di indici per entrambi i figli
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
                
                // assicurati entrambi i figli abbiano almeno 1 elemento (puo' succedere che uno dei due array sia vuoto se tutti gli oggetti hanno lo stesso centro)
                // se ciò non accade, ripartiziona la metà degli elementi in entrambi i nodi
                if(node1.objectsIndices.length === 0) {
                    // m sarà ALMENO pari a 1. perchè se entriamo in questo if, node2.objectsIndices.length è pari ad ALMENO 3
                    let m = Math.floor(node2.objectsIndices.length / 2);
                    for (let i = 0; i < m; i++) {
                        node1.objectsIndices.push(node2.objectsIndices.shift());
                    }
                    stats.degenerateNodes++;
                }
                if(node2.objectsIndices.length === 0) {
                    // m sarà ALMENO pari a 1. perchè se entriamo in questo if, node1.objectsIndices.length è pari ad ALMENO 3
                    let m = Math.floor(node1.objectsIndices.length / 2);
                    for (let i = 0; i < m; i++) {
                        node2.objectsIndices.push(node1.objectsIndices.shift());
                    }
                    stats.degenerateNodes++;
                }

                // aggiungili alla queue
                queue.push(node1);
                queue.push(node2);
            }

            // rimuovi il nodo dalla queue dopo che lo abbiamo processato --- già fatto tramite .shift();
            // azzera il suo array di indici dei "figli temporanei", così evitiamo sprechi monumentali di memoria
            node.objectsIndices = [];
        }


        console.log("--- BVH stats ---");
        console.log("max depth: "        + stats.maxLevel);
        console.log("splits on x axis: " + stats.splitOnX);
        console.log("splits on y axis: " + stats.splitOnY);
        console.log("degenerate nodes: " + stats.degenerateNodes);
        console.log("--- END ---");
    }

    intersect(ray) {
        /*
        
        
naiveBVHHitRecord naiveBVH::traverseStack(naiveBVHNode* rootnode, Ray ray) {

	naiveBVHHitRecord rec = { INFINITY, nullptr };
	
	std::vector<naiveBVHNode*> toVisit;
	toVisit.push_back(rootnode);
	
	Primitive* closestPrim = nullptr;
	float mint = INFINITY;


	while (toVisit.size() != 0) {
		naiveBVHNode* node = toVisit.back();



		// vv NOT STRICTLY NEEDED - TEST PERFORMANCE WITH AND WITHOUT vv 
		// vv NOT STRICTLY NEEDED - TEST PERFORMANCE WITH AND WITHOUT vv 
		if (mint != INFINITY && node->boundingBox.intersect(ray) > mint) {
			toVisit.pop_back();
			continue;
		}
		// ^^ NOT STRICTLY NEEDED - TEST PERFORMANCE WITH AND WITHOUT ^^ 
		// ^^ NOT STRICTLY NEEDED - TEST PERFORMANCE WITH AND WITHOUT ^^ 






		if (node->flags & NAIVEBVH_INTERNALNODE) {
			naiveBVHNode* nodeleft = node->nodeleft;
			naiveBVHNode* noderight = node->noderight;
			toVisit.pop_back();


			float t1 = nodeleft->boundingBox.intersect(ray);
			float t2 = noderight->boundingBox.intersect(ray);

			if (t1 == INFINITY && t2 == INFINITY) continue;
			if (t1 != INFINITY && t2 == INFINITY) {
				if (t1 < mint) toVisit.push_back(nodeleft);
				continue;
			}
			if (t1 == INFINITY && t2 != INFINITY) {
				if (t2 < mint) toVisit.push_back(noderight);
				continue;
			}

			if (t1 < t2) {
				if (t1 < mint) toVisit.push_back(nodeleft);
				if (t2 < mint) toVisit.push_back(noderight);
			} else {
				if (t2 < mint) toVisit.push_back(noderight);
				if (t1 < mint) toVisit.push_back(nodeleft);
			}
		}

		if (node->flags & NAIVEBVH_LEAFNODE) {
			Primitive* left = node->left;
			Primitive* right = node->right;
			toVisit.pop_back();

			float t1 = left->intersect(ray);
			float t2 = right->intersect(ray);

			if (t1 == INFINITY && t2 == INFINITY) continue;
			
			if (t1 < t2) {
				if (t1 < mint) {
					mint = t1;
					closestPrim = left;
				}
			} else {
				if (t2 < mint) {
					mint = t2;
					closestPrim = right;
				}
			}
		}
	}

	
	if (mint != INFINITY) {
		rec = { mint, closestPrim };
	}

	return rec;
}
        */

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

    /**
     * used for debugging only
     * THIS FUNCTION ONLY DRAWS VERTICAL EDGES WITH A HEIGHT OF 1!
     * THIS FUNCTION ONLY DRAWS VERTICAL EDGES WITH A HEIGHT OF 1!
     * THIS FUNCTION ONLY DRAWS VERTICAL EDGES WITH A HEIGHT OF 1! 
     * @param {*} ctx 
     * @param {*} w 
     * @param {*} h 
     * @param {Number} hww -- half world width 
     * @param {Number} hwh -- half world height
     */
    debug(ctx, w, h, hww, hwh, ray) {
        
        function worldSpaceToPixel(aabb) {
            // u & v are coordinates in [0...1] space
            let uMin = (aabb.min[0] + hww) / (2 * hww);
            let vMin = (aabb.min[1] + hwh) / (2 * hwh);

            let uMax = (aabb.max[0] + hww) / (2 * hww);
            let vMax = (aabb.max[1] + hwh) / (2 * hwh);

            // calculate pixel space position
            let px = Math.floor(uMin * w);
            let py = Math.floor(vMin * h);

            let ex = Math.floor(uMax * w);
            let ey = Math.floor(vMax * h);

            let width  = ex - px;
            let height = ey - py;
            
            return {
                x: px,
                y: py,
                w: width,
                h: height,
            }
        }

        function worldSpaceEdgeToPixel(edge) {
            // u & v are coordinates in [0...1] space
            let uMin = (edge.v0[0] + hww) / (2 * hww);
            let vMin = (edge.v0[1] + hwh) / (2 * hwh);

            let uMax = (edge.v1[0] + hww) / (2 * hww);
            let vMax = (edge.v1[1] + hwh) / (2 * hwh);

            // calculate pixel space position
            let px = Math.floor(uMin * w);
            let py = Math.floor(vMin * h);

            let ex = Math.floor(uMax * w);
            let ey = Math.floor(vMax * h);
            
            return {
                x: px,
                y: py,
                ex: ex,
                ey: ey,
            }
        }
        
        let queue = [ this.root ];
        while(queue.length > 0) {
            let node = queue.shift();
            
            // draw edges and continue
            if(node.leaf) {
                ctx.globalAlpha = 1;
                ctx.strokeStyle = "rgb(25, 255, 47)";

                let edge1 = node.child1;
                let edge2 = node.child2;

                if(edge1) {
                    let linePos = worldSpaceEdgeToPixel(edge1);
                    ctx.beginPath();
                    ctx.moveTo(linePos.x, linePos.y);
                    ctx.lineTo(linePos.ex, linePos.ey);
                    ctx.globalAlpha = 1;
                    ctx.stroke();
                }
                if(edge2) {
                    let linePos = worldSpaceEdgeToPixel(edge2);
                    ctx.beginPath();
                    ctx.moveTo(linePos.x, linePos.y);
                    ctx.lineTo(linePos.ex, linePos.ey);
                    ctx.globalAlpha = 1;
                    ctx.stroke();
                }

                let rect = worldSpaceToPixel(node.aabb);
                ctx.globalAlpha = 0.2;
                ctx.strokeStyle = "rgb(0, 0, 0)";
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

                continue;
            }

            // pixel space
            let rect = worldSpaceToPixel(node.aabb);
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = "rgb(0, 0, 0)";
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

            queue.push(node.child1);
            queue.push(node.child2);
        }




        let res  = this.intersect(ray);
        console.log("average intersection calls: " + this.stats.averageIntersectionCalls);
        
        let t    = 0;
        if(res !== false && res !== undefined) t = res.t; 

        let edge = {
            v0: [ ray.o[0], ray.o[1] ],
            v1: [ ray.o[0] + ray.d[0] * t, ray.o[1] + ray.d[1] * t ],
        }

        let linePos = worldSpaceEdgeToPixel(edge);

        ctx.beginPath();
        ctx.moveTo(linePos.x, linePos.y);
        ctx.lineTo(linePos.ex, linePos.ey);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgb(255, 0, 0)";
        ctx.stroke();
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