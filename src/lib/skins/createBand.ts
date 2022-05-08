import {
    BufferGeometry,
    Color,
    DoubleSide,
    Material, Mesh, MeshPhongMaterial
} from "three"

import { Serie }   from "@youwol/dataframe"
import { SkinParameters } from "./skinParameters"
import { IsoBand } from "./private/IsoBand"
import { createSurface, SurfaceParameters } from "./createSurface"

export class BandParameters extends SkinParameters {
    public readonly color  : string = '#ffffff'
    public readonly opacity: number = 1
    public readonly from   : number = 0
    public readonly to     : number = 1
    public readonly translate: number[] = [0,0,0]
    
    constructor(
        {
            color,
            opacity,
            from, to,
            translate, ...others
        } : {
            color?  : string,
            opacity?: number,
            from?: number,
            to?: number,
            translate?: number[]
        })
    {
        super(others)

        this.color = (color!==undefined?color:'#00ff00')
        if (opacity !== undefined) this.opacity = opacity
        if (from !== undefined) this.from = from
        if (to !== undefined) this.to = to
        if (translate !== undefined) this.translate = translate
    }
}

/**
 * This skin create neutral zones where principal stresses is close to isotropic, i.e.,
 * when the material body is under equal compression or tension in all directions.
 * User has to possibility to prescribe a percent for which the stress is considered
 * isotropic. The support must be a triangulated surface.
 * @category Skins
 */
export function createBand(
    mesh: Mesh, attribute: Serie,
    {material=undefined, parameters} : {material?: Material, parameters: BandParameters}): Mesh
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
        console.warn('attribute is undefined')
        return undefined
    }

    if (attribute.itemSize !== 1) {
        console.warn('attribute must be a scalar (itemSize = 1)')
        return undefined
    }

    if (material === undefined) {
        material = new MeshPhongMaterial({
            color: new Color(parameters.color),
            side: DoubleSide,
            vertexColors: true,
            wireframe: false, 
            flatShading: false
        })
    }
    material.polygonOffset = true
    material.polygonOffsetFactor = 1

    if (parameters.opacity !== 1) {
        material.opacity = parameters.opacity
        material.transparent = true
    } else {
        material.transparent = false
    }



    const band = new IsoBand(mesh.geometry)
    // band.debug = false

    const r = band.run(
        attribute,
        parameters.from,
        parameters.to
    )

    const t = parameters.translate

    return createSurface({
        positions: r.positions.map( p => [p[0]+t[0], p[1]+t[1], p[2]+t[2]]), 
        indices  : r.indices,
        material,
        parameters: new SurfaceParameters({
            color: parameters.color
        })
    })
}
