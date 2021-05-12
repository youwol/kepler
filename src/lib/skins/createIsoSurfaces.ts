import { 
    Material, MeshStandardMaterial, DoubleSide, 
    Object3D, Color
} from "three"

import { ASerie, IArray, array } from "@youwol/dataframe"
import { IsoContoursParameters } from "./isoContoursParameters"
import { MarchingCubes } from "./private/MarchingCubes"
import { ImplicitGrid3D } from './implicitGrid'
import { fromValuesToColors, generateIsos } from "../utils"
import { lerp } from '../utils/lerp'
import { createSurface } from "./createSurface"

/**
 * @see [[createIsoSurfaces]]
 * @category Skin Parameters
 */
export class IsoSurfaceParameters extends IsoContoursParameters {
    public readonly roughness: number
    public readonly metalness: number
    public readonly useTable: boolean

    constructor({roughness=0.1, metalness=0.5, useTable=true, ...others}:
        {roughness?: number, metalness?: number, useTable?: boolean}={})
    {
        super(others)
        this.roughness = roughness !== undefined ? roughness : 0.1
        this.metalness = metalness !== undefined ? metalness : 0.5
        this.useTable = useTable !== undefined ? useTable : true
    }
}

/**
 * @category Skins
 */
export function createIsoSurfaces({grid, attribute, material, parameters}:
    {grid: ImplicitGrid3D, attribute: ASerie, material?: Material, parameters?: IsoSurfaceParameters}): Object3D
{
    if (grid === undefined) throw new Error('grid is undefined')
    if (attribute === undefined) throw new Error('attribute is undefined')
    if (attribute.length === grid.sizes[0]*grid.sizes[1]*grid.sizes[2]) throw new Error('attribute length mismatch')

    if (parameters === undefined) {
        parameters = new IsoSurfaceParameters()
    }

    if (material === undefined) {
        material = new MeshStandardMaterial({
            //color: color,
            vertexColors: false,
            side: DoubleSide,
            roughness: parameters.roughness || 0.1,
            metalness: parameters.metalness || 0.5,
            emissive: 0x000000,
            opacity: (parameters.opacity!==undefined ? parameters.opacity : 1),
            transparent: (this.opacity < 1),
            wireframe: false, 
            flatShading: false
        })
    }
    const defaultColor = new Color(parameters.color)
    material["color"]  = defaultColor

    const minmax = array.minMax(attribute.array)
    const vmin   = minmax[0]
    const vmax   = minmax[1]
    
    // normalize
    let scalars = attribute.array.map( v => (v-vmin)/(vmax-vmin) )

    const isoValues = generateIsos(
        lerp(parameters.min, vmin, vmax),
        lerp(parameters.max, vmin, vmax),
        parameters.nbr
    )

    let colors: Array<number> = []
    if (parameters.useTable) {
        colors = fromValuesToColors(isoValues, {
            defaultColor,
            min: parameters.min, 
            max: parameters.max, 
            lut: parameters.lut, 
            lockLut: parameters.lockLut,
            reverse: parameters.reversedLut
        }) as any
    }

    const algo = new MarchingCubes(grid, grid.sizes, scalars)
    const bounds = [vmin, vmax]

    const skin = new Object3D()

    isoValues.forEach( (iso, i) => {
        const geom = algo.run(iso, bounds)
        if (geom && geom.positions.length > 0) {
            const mesh = createSurface({
                positions: geom.positions, 
                indices: geom.indices, 
                material: material.clone()
            })
            skin.add(mesh)

            if (parameters.useTable) {
                mesh.material["color"] = new Color(colors[3*i], colors[3*i+1], colors[3*i+2])
            } else {
                mesh.material["color"] = defaultColor
            }
        }
    })

    return skin
}