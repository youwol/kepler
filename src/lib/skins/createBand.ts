import {
    BufferGeometry,
    Color,
    DoubleSide,
    Float32BufferAttribute,
    Material, Mesh, MeshPhongMaterial
} from "three"

import { Serie }   from "@youwol/dataframe"
import { SkinParameters } from "./skinParameters"
import { IsoBand } from "./private/IsoBand"
import { createSurface, SurfaceParameters } from "./createSurface"
import { createBufferGeometry } from "../utils"

export class BandParameters extends SkinParameters {
    public readonly color  : string = '#ffffff'
    public readonly opacity: number = 1
    public readonly from   : number = 0
    public readonly to     : number = 1
    public readonly scale  : number = 1
    
    constructor(
        {
            color,
            opacity,
            from, to,
            scale, ...others
        } : {
            color?  : string,
            opacity?: number,
            from?: number,
            to?: number,
            scale?: number
        })
    {
        super(others)

        this.color = (color!==undefined?color:'#00ff00')
        if (opacity !== undefined) this.opacity = opacity
        if (from !== undefined) this.from = from
        if (to !== undefined) this.to = to
        if (scale !== undefined) this.scale = scale
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
            vertexColors: false,
            wireframe: false, 
            flatShading: true // <--------------------------------- FLAT for the moment
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
    band.debug = false

    const r = band.run(
        attribute,
        parameters.from,
        parameters.to
    )

    const sc = parameters.scale

    // Translate positions according to the normal using scale')
    const pos = r.positions.map( (p, i) => {
        const n = r.normals.itemAt(i)
        return p.map( (x,i) => x+n[i]*sc)
    })

    const nmesh = new Mesh()
    nmesh.geometry = createBufferGeometry(pos, r.indices)
    nmesh.geometry.setAttribute('normal', new Float32BufferAttribute(r.normals.array, 3))
    nmesh.material = material
    return nmesh
}
