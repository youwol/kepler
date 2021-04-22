import { 
    Color, BufferGeometry, Mesh, BufferAttribute, 
    Material, MeshStandardMaterial, DoubleSide, 
    MeshBasicMaterial
} from "three"

import { fromValueToColor } from '../utils/lut-utils'
import { Lut } from "../utils/Lut"
import { createBufferGeometry } from './bufferUtils'
import { IsoContoursParameters } from './createIsoContourLines'
import { ASerie, IArray, normalize } from '@youwol/dataframe'

/**
 * @see [[createIsoContourFilled]]
 * @category Skin Parameters
 */
export class IsoContoursFilledParameters extends IsoContoursParameters {
    public readonly opacity: number = 1
    public readonly lut: string = 'Rainbow'
    public readonly lockLut: boolean = true
    public readonly reversedLut: boolean

    constructor(
        {
            lut, 
            lockLut, 
            opacity,
            reversedLut}:
        {
            lut?: string, 
            lockLut?: boolean, 
            opacity?: number,
            reversedLut?: boolean
        }={})
    {
        super()
        this.set('lockLut', lockLut)
        this.set('reversedLut', reversedLut)
        this.lut = lut || 'Rainbow'
        if (lut !== undefined) this.lut = lut
        if (opacity !== undefined) this.opacity = opacity
    }
}

/**
 * @example
 * ```ts
 * const skin = createIsoContourFilled({
 *     geometry : mesh.geometry,
 *     attribute: dataframe.get('u'),
 *     parameters: new IsoContoursFilledParameters({
 *         lut: 'Insar',
 *         nbr: 10,
 *         min; 0.2,
 *         max: 0.8
 *     })
 * })
 * 
 * scene.add(skin)
 * ```
 * @category Skins
 */
export function createIsoContourFilled(
    {geometry, attribute, material, parameters}:
    {geometry: BufferGeometry, attribute: ASerie, material?: Material, parameters?: IsoContoursFilledParameters})
    : Mesh
{
    if (geometry === undefined) {
        throw new Error('geometry is undefined')
    }

    if (geometry.getAttribute('position') === undefined) {
        throw new Error('geometry.position is undefined')
    }

    if (geometry.index === null) {
        throw new Error('geometry.index is null')
    }

    if (attribute === undefined) {
        throw new Error('attribute is undefined')
    }

    if (attribute.itemSize !== 1) {
        throw new Error('attribute must be a scalar attribute (itemSize = 1)')
    }

    if (parameters === undefined) {
        parameters = new IsoContoursFilledParameters
    }

    const iso = new IsoContoursFill(parameters)
    const result = iso.run(attribute, geometry)
    if (result.position.length === 0) return undefined

    const mesh = new Mesh()
    mesh.geometry = createBufferGeometry(result.position, result.index)

    if (material !== undefined) {
        mesh.material = material
    } else {
        const mat = new MeshBasicMaterial({
            //color: color,
            side: DoubleSide,
            vertexColors: true,
            wireframe: false, 
            flatShading: false
        })
        //mat.wireframe = true
        mesh.material = mat
    }
    mesh.material.polygonOffset = true
    mesh.material.polygonOffsetFactor = 1

    if (parameters.opacity !== 1) {
        mesh.material.opacity = parameters.opacity
        mesh.material.transparent = true
    } else {
        mesh.material.transparent = false
    }
    
    return mesh
}

class IsoSegment {
      p1  = [0,0,0]
      p2  = [0,0,0]
      //n1  = [0,0,1]
      //n2  = [0,0,1]
      iso = 0
}

class TriInfo {
    reversed = false
    p1 = [0,0,0]
    p2 = [0,0,0]
    p3 = [0,0,0]
    //n1 = [1,0,0]
    //n2 = [1,0,0]
    //n3 = [1,0,0]
    v1 = 0
    v2 = 0
    v3 = 0
    notIntersectedPolygonValue = 0
}

const front = (container: Array<any>) => container[0]
const back  = (container: Array<any>) => container[container.length-1]

function createPoint(p1: number[], p2: number[], w: number) {
    const W  =1.-w
    return [
        w*p1[0] + W*p2[0],
        w*p1[1] + W*p2[1],
        w*p1[2] + W*p2[2]
    ]
}

function isoValue(v1: number, v2: number, iso: number) {
    return 1. - (Math.abs(iso - v1) / Math.abs(v2 - v1))
}

class IsoContoursFill {
    attr: IArray = undefined
    nodes_: BufferAttribute = undefined
    segment_list_: Array<IsoSegment> = []
    increment_ = 0.05
    min_ = 0
    max_ = 1
    color_ = new Color('#000000')
    lutTable_: Lut = new Lut('Insar', 64)
    params: IsoContoursFilledParameters = undefined

    position_: Array<number>  = []
    index_ : Array<number>    = []
    colors_: Array<number>    = []
    //isoValues_: Array<number> = []

    get position()  {return this.position_}
    get index()     {return this.index_}
    get color()     {return this.colors_}

    constructor(parameters: IsoContoursFilledParameters) {
        this.params = parameters

        this.min_ = parameters.min
        this.max_ = parameters.max
        this.color_ = new Color(parameters.color)
        this.lutTable_ = new Lut(parameters.lut, 64)
        this.lutTable_.setMin(this.min_)
        this.lutTable_.setMax(this.max_)
    }

    run(attr: ASerie, geometry: BufferGeometry): any {
        this.attr       = normalize(attr.array)
        this.increment_ = (this.max_-this.min_)/this.params.nbr
        const index     = geometry.index
        const array     = index.array
        this.nodes_     = geometry.getAttribute('position') as BufferAttribute
        //this.isoValues_ = generateIsosBySpacing(this.min_, this.max_, this.increment_)

        for (let i=0; i<array.length; i += 3) {
            this.classify(array[i], array[i+1], array[i+2])
        }

        return {
            position: this.position_,
            index: this.index_,
            color: this.colors_
        }
    }

    normalizedAttr(v: number) {
        return (v-this.min_) / (this.max_-this.min_)
    }

    getNode(i: number) {
        return [this.nodes_.getX(i), this.nodes_.getY(i), this.nodes_.getZ(i)]
    }

    classify(n0: number, n1: number, n2: number) {
        const t = new TriInfo

        t.v1 = this.attr[n0]
        t.p1 = this.getNode(n0)

        t.v2 = this.attr[n1]
        t.p2 = this.getNode(n1)

        t.v3 = this.attr[n2]
        t.p3 = this.getNode(n2)

        let vv1: number[], vv2: number[], vv3: number[]
        let hh1=0, hh2=0, hh3=0

        if (t.v1 <= t.v2 && t.v1 <= t.v3) {
            vv1 = t.p1
            hh1 = t.v1
            if (t.v2 <= t.v3) {
                vv2 = t.p2; vv3 = t.p3
                hh2 = t.v2; hh3 = t.v3
            } else {
                vv2 = t.p3; vv3 = t.p2
                hh2 = t.v3; hh3 = t.v2
                t.reversed = true
            }
        } else if (t.v2 <= t.v1 && t.v2 <= t.v3) {
            vv1 = t.p2; hh1 = t.v2;
            if (t.v1 <= t.v3) {
                vv2 = t.p1; vv3 = t.p3
                hh2 = t.v1; hh3 = t.v3
                t.reversed = true
            } else {
                vv2 = t.p3; vv3 = t.p1
                hh2 = t.v3; hh3 = t.v1
            }
        } else if (t.v3 <= t.v1 && t.v3 <= t.v2) {
            vv1 = t.p3; hh1 = t.v3;
            if (t.v1 <= t.v2) {
                vv2 = t.p1; vv3 = t.p2
                hh2 = t.v1; hh3 = t.v2
            } else {
                vv2 = t.p2; vv3 = t.p1
                hh2 = t.v2; hh3 = t.v1
                t.reversed = true
            }
        } else {
            return
        }

        t.p1 = vv1; t.p2 = vv2; t.p3 = vv3
        t.v1 = hh1; t.v2 = hh2; t.v3 = hh3

        this.createSegmentList(t)
        this.createPolygons(t)
    }

    createSegmentList(t: TriInfo) {
        this.segment_list_ = []

        // snap iso contours with zero
        const begin_value = this.increment_ * Math.round(this.min_ / this.increment_)
        t.notIntersectedPolygonValue = this.min_
        const max_itr = (Math.min(t.v3, this.max_) - begin_value) / this.increment_
        let local_incr = this.increment_

        if (max_itr > 100) {
            local_incr = (Math.min(t.v3, this.max_) - begin_value) / 100.0
        }

        for (let d = begin_value; (d < t.v3) && (d < this.max_); d += local_incr) {
            if (d > t.v1) {
                this.addSegment(d, t)
                //console.log('adding ',d)
            } else {
                t.notIntersectedPolygonValue = d
            }
        }
    }

    addSegment(iso: number, t: TriInfo) {
        const segment = new IsoSegment
        segment.iso = iso
        const v1 = t.v1
        const v2 = t.v2
        const v3 = t.v3
        const p1 = t.p1
        const p2 = t.p2
        const p3 = t.p3

        if (iso < t.v2) {
            segment.p1 = createPoint(p1, p2, isoValue(v1, v2, iso))
            segment.p2 = createPoint(p1, p3, isoValue(v1, v3, iso))
        }
        else {
            segment.p1 = createPoint(p2, p3, isoValue(v2, v3, iso))
            segment.p2 = createPoint(p1, p3, isoValue(v1, v3, iso))
        }

        this.segment_list_.push(segment)
    }

    createPolygons(t: TriInfo) {
        let bypass = false
        if (t.reversed) {
            if (this.segment_list_.length === 0) {
                this.addTri(t.p1, t.p3, t.p2, t.notIntersectedPolygonValue)
                return
            }

            //draw polygons in CCW

            // The first one
            let seg = front(this.segment_list_)

            if (seg.iso < t.v2)
                this.addTri(t.p1, seg.p2, seg.p1, t.notIntersectedPolygonValue)
            else {
                bypass = true
                this.addQuad(t.p1, seg.p2, seg.p1, t.p2, t.notIntersectedPolygonValue)
            }

            // inside the face
            for (let i=1; i<this.segment_list_.length; ++i) {
                const seg1 = this.segment_list_[i] // IsoSegment
            
                if (seg1.iso < t.v2) {
                    this.addQuad(seg.p1, seg1.p1, seg1.p2, seg.p2, seg.iso)
                }
                else {
                    if (bypass) {
                        this.addQuad(seg.p1, seg.p2, seg1.p2, seg1.p1, seg.iso)
                    }
                    else {
                        bypass = true
                        this.addPoly(t.p2, seg.p1, seg.p2, seg1.p2, seg1.p1, seg.iso)
                    }
                }
                seg = seg1
            }

            // the last one
            seg = back(this.segment_list_)
            if (bypass)
                this.addTri(seg.p1, seg.p2, t.p3, seg.iso)
            else {
                this.addQuad(t.p2, seg.p1, seg.p2, t.p3, seg.iso)
            }
        }

        //draw polygons in CW
        else {
            if (this.segment_list_.length === 0) {
                this.addTri(t.p1, t.p2, t.p3, t.notIntersectedPolygonValue)
                return
            }

            let seg = front(this.segment_list_)

            // The first one
            if (seg.iso < t.v2)
                this.addTri(t.p1, seg.p1, seg.p2, t.notIntersectedPolygonValue)
            else {
                bypass = true
                this.addQuad(t.p1, t.p2, seg.p1, seg.p2, t.notIntersectedPolygonValue)
            }

            // inside the face
            for (let i=1; i < this.segment_list_.length; ++i) {
                const seg1 = this.segment_list_[i]
                if (seg1.iso < t.v2) {
                    this.addQuad(seg.p1, seg1.p1, seg1.p2, seg.p2, seg.iso)
                }
                else {
                    if (bypass) {
                        this.addQuad(seg.p1, seg1.p1, seg1.p2, seg.p2, seg.iso)
                    }
                    else {
                        bypass = true
                        this.addPoly(t.p2, seg1.p1, seg1.p2, seg.p2, seg.p1, seg.iso)
                    }
                }
                seg = seg1
            }

            // the last one
            seg = back(this.segment_list_)
            if (bypass)
                this.addTri(seg.p1, t.p3, seg.p2, seg.iso)
            else {
                this.addQuad(t.p2, t.p3, seg.p2, seg.p1, seg.iso)
            }
        }
    }

    addTri(
        point1 : number[],
        point2 : number[],
        point3 : number[],
        iso: number)
      {
        const c = fromValueToColor(iso, {
            defaultColor: this.color_, 
            lutTable: this.lutTable_,
            reverse: this.params.reversedLut, 
            min    : this.min_, 
            max    : this.max_
        })
        const id = this.position_.length/3
        this.position_.push(...point1, ...point2, ...point3)
        this.index_.push(id, id+1, id+2)
        this.colors_.push(...c, ...c, ...c)
    }

    addQuad(
        point1 : number[],
        point2 : number[],
        point3 : number[],
        point4 : number[],
        iso: number)
    {
        //return
        const c = fromValueToColor(iso, {
            defaultColor  : this.color_, 
            lutTable: this.lutTable_,
            reverse: this.params.reversedLut, 
            min    : this.min_, 
            max    : this.max_
        })
        const id = this.position_.length/3
        this.position_.push(...point1, ...point2, ...point3, ...point4)
        this.index_.push(
            id, id+1, id+2, 
            id, id+2, id+3
        )
        this.colors_.push(...c, ...c, ...c, ...c)
    }

    addPoly(
        point1 : number[],
        point2 : number[],
        point3 : number[],
        point4 : number[],
        point5 : number[],
        iso: number)
    {
        //return
        const c = fromValueToColor(iso, {
            defaultColor  : this.color_, 
            lutTable: this.lutTable_,
            reverse: this.params.reversedLut, 
            min    : this.min_, 
            max    : this.max_
        })
        const id = this.position_.length/3
        this.position_.push(...point1, ...point2, ...point3, ...point4, ...point5)
        this.index_.push(
            id, id+1, id+2, 
            id, id+2, id+3, 
            id, id+3, id+4
        )
        this.colors_.push(...c, ...c, ...c, ...c, ...c)
    }

}
