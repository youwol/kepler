import { 
    Color, BufferGeometry, Mesh, BufferAttribute, 
    Material, MeshStandardMaterial, DoubleSide, 
    Float32BufferAttribute
} from "three"

import { fromValueToColor, createLut } from '../utils/lut-utils'
import { createBufferGeometry } from './bufferUtils'
import { IsoContoursParameters } from './isoContoursParameters'
import { Serie, IArray, array } from '@youwol/dataframe'
import { ColorMap, generateIsos, generateIsosBySpacing, lerp } from "../utils"

/**
 * @example
 * ```ts
 * const skin = createIsoContourFilled({
 *     geometry : mesh.geometry,
 *     attribute: dataframe.get('u'),
 *     parameters: new IsoContoursFilledParameters({
 *         lut: 'Insar',
 *         isoList: [1, 2, 3, 4, 7],
 *         min; 2,
 *         max: 10
 *     })
 * })
 * 
 * scene.add(skin)
 * ```
 * @category Skins
 */
export function createIsoContourFilled(
    mesh: Mesh, attribute: Serie,
    {material, parameters} : {material?: Material, parameters: IsoContoursParameters})
    : Mesh
{
    if (mesh === undefined) {
        throw new Error('mesh is undefined')
    }

    if (mesh.geometry === undefined) {
        throw new Error('mesh.geometry is undefined')
    }

    if (mesh.geometry instanceof BufferGeometry === false) {
        throw new Error('mesh.geometry is not a BufferGeometry')
    }

    if (mesh.geometry.getAttribute('position') === undefined) {
        throw new Error('mesh.geometry.position is undefined')
    }

    if (mesh.geometry.index === null) {
        throw new Error('mesh.geometry.index is null')
    }

    if (attribute === undefined) {
        throw new Error('attribute is undefined')
    }

    if (attribute.itemSize !== 1) {
        throw new Error('attribute must be a scalar attribute (itemSize = 1)')
    }

    const iso = new IsoContoursFill(parameters)
    const result = iso.run(attribute, mesh.geometry)
    if (result.position.length === 0) return undefined

    const nmesh = new Mesh()
    nmesh.geometry = createBufferGeometry(result.position, result.index)
    nmesh.geometry.setAttribute('color', new Float32BufferAttribute(result.color, 3))

    if (material !== undefined) {
        nmesh.material = material
    } else {
        const mat = new MeshStandardMaterial({
            color: new Color(parameters.color),
            side: DoubleSide,
            vertexColors: true,
            wireframe: false, 
            flatShading: false
        })
        //mat.wireframe = true
        nmesh.material = mat
    }
    nmesh.material.polygonOffset = true
    nmesh.material.polygonOffsetFactor = 1

    if (parameters.opacity !== 1) {
        nmesh.material.opacity = parameters.opacity
        nmesh.material.transparent = true
    } else {
        nmesh.material.transparent = false
    }

    nmesh.geometry.computeVertexNormals()
    
    return nmesh
}

// -------------------------------

class IsoContoursFill {
    attr: IArray = undefined
    nodes_: BufferAttribute = undefined
    segment_list_: Array<IsoSegment> = []
    vmin_  = 0
    vmax_  = 1
    color_ = new Color('#000000')
    lutTable_: ColorMap = createLut('Insar', 64)
    params: IsoContoursParameters = undefined

    position_: Array<number>  = []
    index_ : Array<number>    = []
    colors_: Array<number>    = []
    isoValues_: Array<number> = []

    get position()  {return this.position_}
    get index()     {return this.index_}
    get color()     {return this.colors_}

    constructor(parameters: IsoContoursParameters) {
        this.params = parameters
        this.color_     = new Color(parameters.color)
        this.lutTable_  = createLut(parameters.lut, 64)
        this.lutTable_.setMin(0)
        this.lutTable_.setMax(1)
        this.isoValues_ = parameters.isoList
    }

    run(attr: Serie, geometry: BufferGeometry): any {
        this.attr = attr.array
        const minmax = array.minMax(this.attr)
        this.vmin_   = minmax[0]
        this.vmax_   = minmax[1]
        
        if (this.isoValues_.length===0) {
            return {
                position: [],
                index: [],
                color: []
            }
        }

        const index = geometry.index
        const a     = index.array
        this.nodes_ = geometry.getAttribute('position') as BufferAttribute

        for (let i=0; i<a.length; i += 3) {
            this.classify(a[i], a[i+1], a[i+2])
        }

        return {
            position: this.position_,
            index: this.index_,
            color: this.colors_
        }
    }

    normalizeAttr(v: number) {
        return (v-this.vmin_) / (this.vmax_-this.vmin_)
    }

    private getNode(i: number) {
        return [this.nodes_.getX(i), this.nodes_.getY(i), this.nodes_.getZ(i)]
    }

    private classify(n0: number, n1: number, n2: number) {
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

    private createSegmentList(t: TriInfo) {
        this.segment_list_ = []
        t.notIntersectedPolygonValue = this.vmin_

        for (let iso of this.isoValues_) {
            if (iso<this.params.min || iso>this.params.max) continue // <-------------------------------
            if (iso >= t.v3) break
            if (iso > t.v1) {
                this.addSegment(iso, t)
            } else {
                t.notIntersectedPolygonValue = iso
            }
        }
    }

    private addSegment(iso: number, t: TriInfo) {
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

    private createPolygons(t: TriInfo) {
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

    private addTri(
        point1 : number[],
        point2 : number[],
        point3 : number[],
        iso: number)
      {
        const c = fromValueToColor( this.normalizeAttr(iso), {
            defaultColor: this.color_, 
            lutTable: this.lutTable_,
            reverse: this.params.reversedLut, 
            // min    : this.min_, 
            // max    : this.max_
        })
        const id = this.position_.length/3
        this.position_.push(...point1, ...point2, ...point3)
        this.index_.push(id, id+1, id+2)
        this.colors_.push(...c, ...c, ...c)
    }

    private addQuad(
        point1 : number[],
        point2 : number[],
        point3 : number[],
        point4 : number[],
        iso: number)
    {
        //return
        const c = fromValueToColor( this.normalizeAttr(iso), {
            defaultColor  : this.color_, 
            lutTable: this.lutTable_,
            reverse: this.params.reversedLut, 
            // min    : this.min_, 
            // max    : this.max_
        })
        const id = this.position_.length/3
        this.position_.push(...point1, ...point2, ...point3, ...point4)
        this.index_.push(
            id, id+1, id+2, 
            id, id+2, id+3
        )
        this.colors_.push(...c, ...c, ...c, ...c)
    }

    private addPoly(
        point1 : number[],
        point2 : number[],
        point3 : number[],
        point4 : number[],
        point5 : number[],
        iso: number)
    {
        //return
        const c = fromValueToColor( this.normalizeAttr(iso), {
            defaultColor  : this.color_, 
            lutTable: this.lutTable_,
            reverse: this.params.reversedLut, 
            // min    : this.min_, 
            // max    : this.max_
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

// -------------------------------

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