import {
    Mesh, Color, BufferGeometry,
    Float32BufferAttribute
} from "three"

import { fromValuesToColors } from '../utils/lut-utils'
import { SkinParameters } from "./skinParameters"
import { ASerie } from '@youwol/dataframe'

/**
 * @see [[paintAttribute]]
 * @category Skin Parameters
 */
export class PaintParameters extends SkinParameters {
    public readonly lut: string
    public readonly lockLut: boolean = false
    public readonly reversedLut: boolean
    public readonly min: number
    public readonly max: number
    public readonly defaultColor: string

    constructor(
        {name, lut, min, max, lockLut, defaultColor, ...others}:
        {name?: string, lut?: string, min?: number, max?: number, lockLut?: boolean, defaultColor?: string} = {})
    {
        super(others as any)
        this.defaultColor = defaultColor || '#aaaaaa'
        this.lut = lut || 'Rainbow'
        this.min = min !==undefined ? min : 0
        this.max = max !==undefined ? max : 1
        this.set('lockLut', lockLut)
        this.reversedLut = false

        if (this.min > this.max) {
            this.reversedLut = true
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
    {mesh, attribute, parameters}:
    {mesh: Mesh, attribute?: ASerie, parameters?: PaintParameters})
{
    if (mesh === undefined) {
        throw new Error('mesh is undefined')
    }
    if (mesh.geometry === undefined) {
        throw new Error('geometry of mesh is undefined')
    }
    if (mesh.geometry instanceof BufferGeometry === false) {
        throw new Error('geometry of mesh is not a BufferGeometry')
    }

    if (attribute.itemSize !== 1) {
        throw new Error(`attribute must be a Serie with itemSize = 1. Got ${attribute.itemSize}`)
    }

    if (parameters === undefined) {
        parameters = new PaintParameters()
    }

    // let newMesh = new Mesh()
    // newMesh.geometry = new BufferGeometry()
    // newMesh.geometry.setAttribute('position', mesh.getAttribute('position'))
    // if (mesh.indices !== undefined) newMesh.geometry.setIndex( mesh.index )
    // if (mesh.geometry.getAttribute('normal')!== undefined) newMesh.geometry.setAttribute( 'normal', mesh.geometry.getAttribute('normal') )

    // const nbV = mesh.geometry.getAttribute('position').count
    // const nbS = attribute.length
    // if (nbV !== nbS) {
    //     throw new Error(`number of vertices (${nbV}) is different from number of scalars attribute (${nbS})`)
    // }

    //on en est là !!
    //Attentojn on est sur newMesh !!!

    let color = new Color('#aaaaaa')
    if (mesh.material.hasOwnProperty('color')) {
        color = mesh.material['color']
        mesh.material['color'] = new Color('#ffffff')
    }
    mesh.material.vertexColors = true

    const colors = fromValuesToColors(attribute.array, {
        defaultColor: new Color(parameters.defaultColor), 
        reverse: parameters.reversedLut, 
        min: parameters.min, 
        max: parameters.max, 
        lut: parameters.lut, 
        lockLut: parameters.lockLut
    })
    mesh.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    mesh.geometry.attributes.color.needsUpdate = true
}
