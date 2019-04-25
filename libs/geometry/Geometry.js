class Geometry {
    constructor() {
        this.primitives = [];
    }

    addPrimitive(primitive)      { 
        this.primitives.push(primitive);
    }
    setMaterial(material)        { 
        for(let i = 0; i < this.primitives.length; i++) {
            this.primitives[i].setMaterial(material);
        }
    }
    setMaterials(materialsArray) {
        for(let i = 0; i < this.primitives.length; i++) {
            this.primitives[i].setMaterial(materialsArray[i]);
        }
    }
    getPrimitives() {
        return this.primitives;
    }
    rotate(radians)  {
        for(let i = 0; i < this.primitives.length; i++) {
            this.primitives[i].rotate(radians);
        }

        return this;
    }
    translate(point) {
        for(let i = 0; i < this.primitives.length; i++) {
            this.primitives[i].translate(point);
        }

        return this;
    }
    scale(amount)    {
        for(let i = 0; i < this.primitives.length; i++) {
            this.primitives[i].scale(amount);
        }

        return this;
    }
    flipNormal()    {
        for(let i = 0; i < this.primitives.length; i++) {
            this.primitives[i].flipNormal();
        }

        return this;
    }
}

export { Geometry }