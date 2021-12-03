export class Vector {
    public x = 0
    public y = 0

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
  
    equals(other: Vector) {
        return this.x === other.x && this.y === other.y
    }
  
    add(other: Vector) {
      return new Vector(this.x + other.x, this.y + other.y)
    }
  
    mulScalar(scalar: number) {
        return new Vector(this.x * scalar, this.y * scalar)
    }
  
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }
  
    normalize() {
        var l = this.length()
        this.x /= l
        this.y /= l
    }
  
    distanceTo(other: Vector) {
        var dx = other.x - this.x
        var dy = other.y - this.y
        return Math.sqrt(dx * dx + dy * dy)
    }  
}
