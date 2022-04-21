import {
    LineSegments, LineBasicMaterial, Color, BufferGeometry,
    Float32BufferAttribute, Material, Object3D
} from "three"

import { PaintParameters } from './paintAttribute'
import { fromValueToColor } from '../utils/lut-utils'
import { Serie, array, createFrom, IArray } from "@youwol/dataframe"
import { createLut } from "../utils"

/**
 * @see [[createVectors]]
 * @category Skin Parameters
 */
export class VectorsParameters extends PaintParameters {
    public readonly lineWidth: number = 1
    public readonly color: string = '#000000'
    public readonly opacity: number = 1
    public readonly transparent: boolean = false
    public readonly scale: number = 1
    public readonly normalize: boolean = false
    public readonly project: boolean = false
    public readonly centered: boolean = true
    public readonly vector: string = ''
    public readonly translate: number[] = [0,0,0]

    constructor(
        {vector, lineWidth, color, opacity, transparent, scale, normalize, centered, project, translate, ...others}:
        {
            vector?: string,
            lineWidth?: number, 
            color?: string, 
            opacity?: number, 
            transparent?: boolean, 
            scale?: number,
            normalize?: boolean,
            project?: boolean,
            centered?: boolean,
            translate?: number[]
        } = {})
    {
        super(others)
        this.vector    = vector || ''
        this.lineWidth = lineWidth || 1
        this.color     = color || '#000000'
        this.opacity   = opacity || 1
        this.scale     = scale !== undefined ? scale : 1
        this.translate = translate !== undefined ? translate : [0,0,0]
        this.set('transparent', transparent, this.transparent)
        this.set('normalize'  , normalize  , this.normalize  )
        this.set('project'    , project    , this.project    )
        this.set('centered'    , centered    , this.centered    )
    }
}

// -------------------------------------------------------

/**
 * @category Skins
 */
export function createVectors(
    {geometry,  material, vectorField, attribute, parameters}:
    {geometry: BufferGeometry, material?: Material, vectorField?: Serie, attribute?: Serie, parameters?: VectorsParameters}): Object3D
{
    if (geometry === undefined) throw new Error('geometry is undefined')
    const position = geometry.getAttribute('position')
    if (vectorField === undefined) throw new Error('vectorField is undefined')
    if (vectorField.count !== position.count) throw new Error('vectorField should have 3 x nb vertices')
    if (parameters === undefined) throw new Error('parameters is undefined (needs name of the vector field)')

    if (material === undefined) {
        material = new LineBasicMaterial({
            linewidth: parameters.lineWidth, 
            opacity: parameters.opacity, 
            transparent: parameters.transparent,
            color: new Color(parameters.color),
            vertexColors: false
        })
    }

    if (attribute === undefined) {
        material.vertexColors = false
    } else {
        material.vertexColors = true
    }

    const lines = new LineSegments

    const pos = Serie.create({array: geometry.getAttribute('position').array as IArray, itemSize: 3})
    const s = parameters.scale
    const vertices: number[] = []
    pos.forEach( (p,i) => {
        p = p.map( (v,i) => p[i] + parameters.translate[i] )
        const u = vectorField.itemAt(i)
        
        if (parameters.project) {
            u[2] = 0
        }
        if (parameters.normalize) {
            const l = Math.sqrt(u[0]**2 + u[1]**2 + u[2]**2)
            u[0] /= l
            u[1] /= l
            u[2] /= l
        }
        // centered vector
        if (parameters.centered) {
            vertices.push(
                p[0]-s*u[0]/2, p[1]-s*u[1]/2, p[2]-s*u[2]/2,
                p[0]+s*u[0]/2, p[1]+s*u[1]/2, p[2]+s*u[2]/2)
        }
        else {
            vertices.push(
                p[0], p[1], p[2],
                p[0]+s*u[0], p[1]+s*u[1], p[2]+s*u[2])
        }
    })

    lines.geometry = new BufferGeometry
    lines.geometry.setAttribute( 'position', new Float32BufferAttribute(vertices, 3) )

    // Coloring the vectors
    const defaultColor = new Color(parameters.color)
    const lutTable = createLut(parameters.lut, 256)

    const mm = attribute ? array.minMax(attribute.array) : [0,1]

    if (parameters.lockLut) {
        lutTable.setMin(0)
        lutTable.setMax(1)
    } else {
        lutTable.setMin(mm[0])
        lutTable.setMax(mm[1])
    }

    const params = {
        min: parameters.min, 
        max: parameters.max, 
        lutTable, 
        defaultColor, 
        reverse: parameters.reverseLut
    }

    if (attribute) {
        const colors: number[] = []
        attribute.array.forEach( value => {
            const c = fromValueToColor(value, params)
            for (let i=0; i<2; ++i) {
                colors.push(c[0], c[1], c[2])
            }
        })
        lines.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    }

    lines.material = material

    // -------------------------------------------------
    // Arrows ? (6,16, 12, 1, true, 0, 2*Math.PI)
    // Cone kength should be 1/5 of arrow legnth
    // -------------------------------------------------
    {
        // TODO
    }

    return lines
}
