import { createTyped, Serie } from "@youwol/dataframe"
import { BufferAttribute, BufferGeometry } from "three"

export class IsoBand {
    public debug     : boolean = true
    private triangles: Tri[] = []
    private attr     : Serie = undefined
    private nodes    : BufferAttribute = undefined
    private normals  : BufferAttribute = undefined
    private geometry : BufferGeometry  = undefined

    constructor(geometry: BufferGeometry) {
        this.geometry = geometry
        this.nodes   = geometry.getAttribute('position') as BufferAttribute
        this.normals = geometry.getAttribute('normal') as BufferAttribute

        if (this.normals === undefined) {
            geometry.computeVertexNormals()
            this.normals = geometry.getAttribute('normal') as BufferAttribute
        }
    }

    run(attr: Serie, iso1: number, iso2: number) {
        this.attr      = attr
        const indices  = this.geometry.index.array
        this.triangles = []

        for (let i=0; i<indices.length; i += 3) {
            const t = this.createTriangle(indices[i], indices[i+1], indices[i+2])
            this.detect(t, iso1, iso2)
        }

        // At this point, we have a list of Tri
        // Have to transform into
        //   - positions: number[]
        //   - indices  : number[]
        //   - normals  : number[]

        // console.log(this.triangles)
        // console.log(this.triangles.length)

        {
            const positions: number[] = []
            const indices  : number[] = []
            let k = 0
            this.triangles.forEach( t => {
                positions.push(
                    t.p1[0], t.p1[1], t.p1[2],
                    t.p2[0], t.p2[1], t.p2[2],
                    t.p3[0], t.p3[1], t.p3[2]
                )
                indices.push(k++, k++, k++)
            })

            return {
                positions: Serie.create({array: createTyped(Float32Array, positions, false), itemSize: 3}),
                indices  : Serie.create({array: createTyped(Uint32Array, indices  , false)  , itemSize: 3})
            }
        }
    }

    private detect(t: Tri, iso1: number, iso2: number): void {
        if (this.debug) {
            console.assert(iso1 < iso2, iso1 +'<'+ iso2+' failed')
            console.assert(t.i1 < t.i2, t.i1 +'<'+ t.i2+' failed')
            console.assert(t.i2 < t.i3, t.i2 +'<'+ t.i3+' failed')
        }

        const iso = (iso1+iso2)/2

        const p1 = t.p1
        const p2 = t.p2
        const p3 = t.p3

        const n1 = t.n1
        const n2 = t.n2
        const n3 = t.n3

        const i1 = t.i1
        const i2 = t.i2
        const i3 = t.i3

        if (iso1 >= i3 || iso2 <= i1) { // case 0: empty triangle
            return
        }

        if (iso1 <= i1) {
            if (iso2 >= i3) { // case 1: full triangle
                this.add3(p1, p2, p3, n1, n2, n3, iso)
            }
            else if (iso2 < i2) { // case 3
                const a = this.generate(i1, i2, p1, p2, n1, n2, iso2)
                const b = this.generate(i1, i3, p1, p3, n1, n3, iso2)
                this.add3(p1, a.p, b.p,   n1, a.n, b.n,   iso2)
            }
            else if (iso2 <= i3) { // case 2
                const a = this.generate(i2, i3, p2, p3, n2, n3, iso2)
                const b = this.generate(i1, i3, p1, p3, n1, n3, iso2)
                this.add4(p1, p2, a.p, b.p,   n1, n2, a.n, b.n,   iso2)
            }
        }
        else if (iso1 > i1 && iso1 <= i2) {
            
            if (iso2 >= i3) { // case 4
                const a = this.generate(i1, i2, p1, p2, n1, n2, iso1)
                const b = this.generate(i1, i3, p1, p3, n1, n3, iso1)
                this.add4(a.p, p2, p3, b.p,   a.n, n2, n3, b.n,   iso1)
            }
            else if (iso2 < i2) { // case 6
                const a = this.generate(i1, i2, p1, p2, n1, n2, iso1)
                const b = this.generate(i1, i2, p1, p2, n1, n2, iso2)
                const c = this.generate(i1, i3, p1, p3, n1, n3, iso2)
                const d = this.generate(i1, i3, p1, p3, n1, n3, iso1)
                this.add4(a.p, b.p, c.p, d.p,   a.n, b.n, c.n, d.n,   iso)
                // this.add3(a.p, b.p, c.p,   a.n, b.n, c.n,   iso)
            }
            else if (iso2 < i3) { // case 5
                const a = this.generate(i1, i2, p1, p2, n1, n2, iso1)
                const b = this.generate(i2, i3, p2, p3, n2, n3, iso2)
                const c = this.generate(i1, i3, p1, p3, n1, n3, iso2)
                const d = this.generate(i1, i3, p1, p3, n1, n3, iso1)
                this.add5(a.p, p2, b.p, c.p, d.p,   a.n, n2, b.n, c.n, d.n,  iso)
            }
        }
        else if (iso1 > i2 && iso1 <= i3) {
            if (iso2 >= i3) { // case 7
                const a = this.generate(i2, i3, p2, p3, n2, n3, iso1)
                const b = this.generate(i1, i3, p1, p3, n1, n3, iso1)
                this.add3(a.p, p3, b.p,   a.n, n3, b.n, iso1)
            }
            else if (iso2 < i3) { // case 8
                const a = this.generate(i2, i3, p2, p3, n2, n3, iso1)
                const b = this.generate(i2, i3, p2, p3, n2, n3, iso2)
                // const c = this.generate(i3, i1, p3, p1, n3, n1, iso2)
                // const d = this.generate(i3, i1, p3, p1, n3, n1, iso1)
                const c = this.generate(i1, i3, p1, p3, n1, n3, iso2)
                const d = this.generate(i1, i3, p1, p3, n1, n3, iso1)
                this.add4(a.p, b.p, c.p, d.p,   a.n, b.n, c.n, d.n,   iso)
            }
        }
        else { // Error: unknown configuration
            throw new Error('unknown configuration')
        }
    }

    generate(i1: number, i2: number, p1: Point, p2: Point, n1: Point, n2: Point, iso: number): any {
        const w  = this.parametric(i1, i2, iso)
        return {
            p: this.createPoint (p1, p2, w),
            n: this.createNormal(n1, n2, w),
        }
    }

    private createPoint(p1: Point, p2: Point, w: number): Point {
        if (this.debug) {
            console.assert(w >= 0, w+'>=0 failed')
            console.assert(w <= 1, w+'<=1 failed')
        }
        const W = 1. - w
        return [
            w * p1[0] + W * p2[0],
            w * p1[1] + W * p2[1],
            w * p1[2] + W * p2[2]
        ]
    }

    private createNormal(p1: Point, p2: Point, w: number): Point {
        return this.createPoint(p1, p2, w)
    }

    private parametric(v1: number, v2: number, iso: number): number {
        if (this.debug) {
            console.assert(iso >= v1, iso+'>='+v1+' failed')
            console.assert(iso <= v2, iso+'<='+v2+' failed')
        }

        if (v2 > v1) {
            return 1. - (Math.abs(iso - v1) / Math.abs(v2 - v1))
        }
        else {
            return 1. - (Math.abs(iso - v2) / Math.abs(v1 - v2))
        }
    }

    private createTriangle(n0: number, n1: number, n2: number): Tri {
        return this.classifyTriangle({
            i1: this.getAttr  (n0),
            p1: this.getNode  (n0),
            n1: this.getNormal(n0),

            i2: this.getAttr  (n1),
            p2: this.getNode  (n1),
            n2: this.getNormal(n1),

            i3: this.getAttr  (n2),
            p3: this.getNode  (n2),
            n3: this.getNormal(n2)
        })
    }

    private classifyTriangle(t: Tri) {
        let nn1: Point, nn2: Point, nn3: Point
        let vv1: Point, vv2: Point, vv3: Point
        let hh1=0, hh2=0, hh3=0

        if (t.i1 <= t.i2 && t.i1 <= t.i3) {
            vv1 = t.p1
            hh1 = t.i1
            nn1 = t.n1
            if (t.i2 <= t.i3) {
                vv2 = t.p2; vv3 = t.p3
                hh2 = t.i2; hh3 = t.i3
                nn2 = t.n2; nn3 = t.n3
            } else {
                vv2 = t.p3; vv3 = t.p2
                hh2 = t.i3; hh3 = t.i2
                nn2 = t.n3; nn3 = t.n2
                // t.reversed = true
            }
        } else if (t.i2 <= t.i1 && t.i2 <= t.i3) {
            vv1 = t.p2
            hh1 = t.i2
            nn1 = t.n2
            if (t.i1 <= t.i3) {
                vv2 = t.p1; vv3 = t.p3
                hh2 = t.i1; hh3 = t.i3
                nn2 = t.n1; nn3 = t.n3
                // t.reversed = true
            } else {
                vv2 = t.p3; vv3 = t.p1
                hh2 = t.i3; hh3 = t.i1
                nn2 = t.n3; nn3 = t.n1
            }
        } else if (t.i3 <= t.i1 && t.i3 <= t.i2) {
            vv1 = t.p3
            hh1 = t.i3
            nn1 = t.n3
            if (t.i1 <= t.i2) {
                vv2 = t.p1; vv3 = t.p2
                hh2 = t.i1; hh3 = t.i2
                nn2 = t.n1; nn3 = t.n2
            } else {
                vv2 = t.p2; vv3 = t.p1
                hh2 = t.i2; hh3 = t.i1
                nn2 = t.n2; nn3 = t.n1
                // t.reversed = true
            }
        } else {
            throw new Error('Strange !')
        }

        t.p1 = vv1; t.p2 = vv2; t.p3 = vv3
        t.i1 = hh1; t.i2 = hh2; t.i3 = hh3
        t.n1 = nn1; t.n2 = nn2; t.n3 = nn3

        return t
    }

    private add3(p1: Point, p2: Point, p3: Point,
                 n1: Point, n2: Point, n3: Point,
                 iso: number
    ): void {
        this.triangles.push({p1, p2, p3, n1, n2, n3, i1: iso, i2: iso, i3: iso})
    }

    private add4(p1: Point, p2: Point, p3: Point, p4: Point,
                 n1: Point, n2: Point, n3: Point, n4: Point,
                 iso: number
    ): void {
        this.add3(p1, p2, p3, n1, n2, n3, iso)
        this.add3(p1, p3, p4, n1, n3, n4, iso)
    }

    private add5(p1: Point, p2: Point, p3: Point, p4: Point, p5: Point,
                 n1: Point, n2: Point, n3: Point, n4: Point, n5: Point,
                 iso: number
    ): void {
        this.add4(p1, p2, p3, p4, n1, n2, n3, n4, iso)
        this.add3(p1, p4, p5, n1, n4, n5, iso)
    }

    private getNode(i: number): Point {
        return [this.nodes.getX(i), this.nodes.getY(i), this.nodes.getZ(i)]
    }

    private getNormal(i: number): Point {
        return [this.normals.getX(i), this.normals.getY(i), this.normals.getZ(i)]
    }

    private getAttr(i: number): number {
        return this.attr.itemAt(i) as number
    }
}

// ================================================

type Point = [number, number, number]

type Tri = {
    // Value at the 3 points (attribute)
    i1: number
    i2: number
    i3: number

    // Position of the 3 points
    p1: Point
    p2: Point
    p3: Point

    // Normal at the 3 points
    n1: Point
    n2: Point
    n3: Point
}