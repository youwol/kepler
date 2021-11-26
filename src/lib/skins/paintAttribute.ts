import {
    Color, BufferGeometry,
    Float32BufferAttribute, Material, Object3D
} from "three"

import { fromValuesToColors } from '../utils/lut-utils'
import { SkinParameters } from "./skinParameters"
import { Serie } from '@youwol/dataframe'

/**
 * @see [[paintAttribute]]
 * @category Skin Parameters
 */
export class PaintParameters extends SkinParameters {
    public readonly lut: string
    public readonly duplicateLut: number = 1
    public readonly lockLut: boolean = false
    public readonly reverseLut: boolean
    public readonly min: number
    public readonly max: number
    public readonly defaultColor: string
    public readonly atVertex: boolean

    constructor(
        {name, lut, duplicateLut, min, max, lockLut, defaultColor, atVertex, ...others}:
        {
            name?: string, 
            lut?: string, 
            duplicateLut?,
            min?: number, 
            max?: number, 
            lockLut?: boolean, 
            defaultColor?: string, 
            atVertex?: boolean
        } = {})
    {
        super(others)
        this.defaultColor = defaultColor || '#aaaaaa'
        this.lut = lut || 'Rainbow'
        if (duplicateLut !== undefined) this.duplicateLut = duplicateLut
        this.min = min !==undefined ? min : 0
        this.max = max !==undefined ? max : 1
        this.atVertex = atVertex !==undefined ? atVertex : true
        this.set('lockLut', lockLut, this.lockLut)
        this.reverseLut = false

        if (this.min > this.max) {
            this.reverseLut = true
            const a = this.min
            this.min = this.max
            this.max = a
        }
    }
}

/**
 * @brief Paint a pointset, a lineset or a surface using a scalar
 * attribute provided by a Serie from the library `@youwol/dataframe`
 * @example
 * ```ts
 * const surface = io.loadGocad(filename)[0] // a dataframe I think
 * 
 * let mesh = createSurface({
 *      positions: surface.get('positions'),
 *      indices  : surface.get('indices')
 * })
 * 
 * paintAttribute(mesh, surface.get('U').map( u => u[0] ) )
 * ```
 * @category Skins
 */
export function paintAttribute(
    mesh: Object3D, attribute: Serie, parameters?: PaintParameters)
{
    console.warn('deal with Group of Object3D')

    if (mesh === undefined) {
        throw new Error('mesh is undefined')
    }

    const geometry = mesh['geometry']
    if (geometry === undefined) {
        throw new Error('geometry of mesh is undefined')
    }
    if (geometry instanceof BufferGeometry === false) {
        throw new Error('geometry of mesh is not a BufferGeometry')
    }

    const material = mesh['material']
    if (material === undefined) {
        throw new Error('material of mesh is undefined')
    }

    if (attribute.itemSize !== 1) {
        throw new Error(`attribute must be a Serie with itemSize = 1. Got ${attribute.itemSize}`)
    }

    if (parameters === undefined) {
        parameters = new PaintParameters()
    }

    let color = new Color('#aaaaaa')
    if (material.hasOwnProperty('color')) {
        color = material['color']
        material['color'] = new Color('#ffffff')
    }
    (material as Material).vertexColors  = (parameters.atVertex ? true : false) ;
    (material as Material).polygonOffset = true ;
    (material as Material).polygonOffsetFactor = 1 ;

    let colors = fromValuesToColors(attribute.array, {
        defaultColor: new Color(parameters.defaultColor),
        reverse: parameters.reverseLut, 
        min: parameters.min, 
        max: parameters.max, 
        lut: parameters.lut, 
        duplicateLut: parameters.duplicateLut, 
        lockLut: parameters.lockLut
    })

    // colors = meshInterpolate({
    //     attribute: colors, 
    //     topology: mesh.geometry.index.array,
    //     size:3,
    //     direction: InterpolateDirection.INCREASING
    // })
    
    if (mesh.type === 'Points') {
        geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    }
    else {
        if (parameters.atVertex) {
            geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
        }
        else {
            const faces         = geometry.index // 438
            const nbVertPerFace = 3
            const nbColorComps  = 3
            let fcolors = new Float32Array(faces.count * nbVertPerFace * nbColorComps)

            let j = 0
            const setColor = (i: number) => {
                for (let k=0; k<3; ++k) {
                    fcolors[j+k] = colors[i+k]
                }
                j += 3
            }

            for (let i=0; i<faces.count; i+=3) {
                setColor( faces.array[i  ] )
                setColor( faces.array[i+1] )
                setColor( faces.array[i+2] )
            }
            geometry.setAttribute('color', new Float32BufferAttribute(fcolors, 3))
        }
    }

    geometry.attributes.color.needsUpdate = true ;
    (material as Material).needsUpdate = true
}
