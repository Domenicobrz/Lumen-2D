class Primitive {
    constructor() {
        this.material = undefined;
    }

    computeAABB()    { /* not implemented */ }

    intersect(ray)   { /* not implemented */ }
    setMaterial(material)   { 
        this.material = material;
    }
    getMaterial() {
        return this.material;
    }

    getRandomPoint() { /* not implemented */ }

    flipNormal()   { /* not implemented */ }
    rotate(radians)  { /* not implemented */ }
    translate(point) { /* not implemented */ }
    scale(amount)    { /* not implemented */ }
}

export { Primitive }