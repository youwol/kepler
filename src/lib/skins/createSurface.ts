import {
    Mesh, MeshStandardMaterial, Color, MeshBasicMaterial,
    DoubleSide, Material
} from "three"

import { SkinParameters } from "./skinParameters"
import { IArray, Serie } from '@youwol/dataframe'
import { createBufferGeometry } from "@youwol/three-extra"

/**
 * @see [[createSurface]]
 * @category Skin Parameters
 */
export class SurfaceParameters extends SkinParameters {
    public readonly color: string
    public readonly opacity: number = 1
    public readonly flat: boolean = false
    public readonly wireframe: boolean = false
    public readonly creaseAngle: number = 0

    constructor(
        {color='#aaaaaa', flat=false, opacity=1, wireframe=false, creaseAngle=0, ...others}:
        {color?: string, opacity?: number, flat?: boolean, wireframe?:boolean, creaseAngle?: number} = {})
    {
        super(others)
        this.color = color || '#aaaaaa'
        this.flat = (flat !== undefined ? flat : false)
        if (opacity !== undefined) this.opacity = opacity
        if (wireframe !== undefined) this.wireframe = wireframe
        if (creaseAngle !== undefined) this.creaseAngle = creaseAngle * Math.PI/180
    }
}

/**
 * @brief Generate a 3D surface from positions and indices
 * @example
 * ```ts
 * const surface = createSurface({
 *     positions: dataframe.get('positions'),
 *     indices  : dataframe.get('indices'),
 *     parameters: new SurfaceParameters({
 *         color: '#ff0000',
 *         flat: true,
 *         opacity: 0.7,
 *         creaseAngle: 30 // in degrees
 *     })
 * })
 * 
 * const attribute = dataframe.get('U').map( u => u[0] )
 * paintAttribute(surface, attribute )
 * 
 * const skin = createIsoContourLines({
 *     geometry : surface.geometry,
 *     attribute: attribute,
 *     parameters: new IsoContoursParameters({
 *         color: '#999900',
 *         nbr: 10,
 *         min; 0.2,
 *         max: 0.8
 *     })
 * })
 * 
 * scene.add( surface )
 * surface.add( skin )
 * ```
 * @category Skins
 */
export function createSurface(
    {positions, indices, material, parameters}:
    {positions: IArray | Serie, indices: IArray | Serie, material?: Material, parameters?: SurfaceParameters}): Mesh
{
    if (positions === undefined) throw new Error('positions is undefined')
    if (indices === undefined)   throw new Error('indices is undefined')

    if (parameters === undefined) {
        parameters = new SurfaceParameters()
    }

    const mesh = new Mesh()
    let color = new Color(parameters.color)

    mesh.geometry = createBufferGeometry(positions, indices, parameters.creaseAngle)

    if (material) {
        mesh.material = material
    } else {
        mesh.material = new MeshStandardMaterial({
            color: color,
            side: DoubleSide,
            vertexColors: false,
            wireframe: parameters.wireframe, 
            flatShading: parameters.flat
        })
    }

    mesh.material.polygonOffset = true
    mesh.material.polygonOffsetFactor = 1
    // mesh.materialdepthWrite = false
    // mesh.materialdepthTest = true
    // mesh.materialpolygonOffsetUnits = 1

    if (parameters.opacity !== 1) {
        mesh.material.opacity = parameters.opacity
        mesh.material.transparent = true
    } else {
        mesh.material.transparent = false
    }

    mesh.material.needsUpdate = true
    mesh.geometry.computeBoundingBox()
    return mesh
}
