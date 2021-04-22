import {
    LineSegments, LineBasicMaterial, 
    Color, BufferGeometry, Float32BufferAttribute, 
    VertexColors, Material
} from "three"

import { SkinParameters } from './skinParameters'
import { generateIsos } from '../utils/generateIsos'
import { lerp } from '../utils/lerp'
import { MarchingTriangles } from './private/MarchingTriangles'
import { minMaxArray, ASerie } from "@youwol/dataframe"

/**
 * @see [[createIsoContourLines]]
 * @category Skin Parameters
 */
export class IsoContoursParameters extends SkinParameters {
    public readonly color: string = '#000000'

    public readonly nbr: number = 10
    public readonly min: number = 0
    public readonly max: number = 1

    // public readonly useTable: boolean = false
    // public readonly lut: string = 'Rainbow'
    // public readonly lockLut: boolean = true
    // public readonly reversedLut: boolean

    constructor(
        {nbr=10, min=0, max=1, color, ...others}:
        {nbr?: number, min?: number, max?: number, color?: string}={})
    {
        super(others as any)
        this.color = color || '#000000'
        this.nbr = (nbr!==undefined?nbr:10)
        this.min = (min!==undefined?min:0 )
        this.max = (max!==undefined?max:1 )
    }
}

/**
 * @example
 * ```ts
 * const skin = createIsoContourLines({
 *     geometry : mesh.geometry,
 *     attribute: dataframe.get('u'),
 *     parameters: new IsoContoursParameters({
 *         color: '#999900',
 *         nbr: 10,
 *         min; 0.2,
 *         max: 0.8
 *     })
 * })
 * 
 * scene.add( skin )
 * ```
 * @category Skins
 */
export function createIsoContourLines(
    {geometry, attribute, material, parameters}:
    {geometry: BufferGeometry, attribute: ASerie, material?: Material, parameters?: IsoContoursParameters}): LineSegments
{
    if (geometry === undefined) {
        throw new Error('geometry is undefined')
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

    if (parameters === undefined) parameters = new IsoContoursParameters()

    if (material === undefined) {
        material = new LineBasicMaterial({
            linewidth: 1,
            linecap: 'round',  // ignored by WebGLRenderer
            linejoin: 'round', // ignored by WebGLRenderer
            polygonOffset: true,
            polygonOffsetFactor: 2, // positive value pushes polygon further away
            polygonOffsetUnits: 1
        })
    }
    material["color"] = new Color(parameters.color)

    const minmax = minMaxArray(attribute.array)
    const vmin   = minmax[0]
    const vmax   = minmax[1]

    // normalize
    //let scalars = attribute.array.map( v => (v-vmin)/(vmax-vmin) )

    const isoValues = generateIsos( lerp(parameters.min, vmin, vmax), lerp(parameters.max, vmin, vmax), parameters.nbr)

    const algo = new MarchingTriangles()
    algo.setup(geometry.index, [lerp(parameters.min, vmin, vmax), lerp(parameters.max, vmin, vmax)])

    const vertices  = geometry.getAttribute('position')
    const positions = []
    let index       = 0
    // const mcolors   = fromValuesToColors(isoValues, {
    //     color: new Color(parameters.color), 
    //     reverse: parameters.reversedLut, 
    //     min: parameters.min, 
    //     max: parameters.max, 
    //     lut: parameters.lut, 
    //     lockLut: parameters.lockLut
    // })
    // const colors    = []

    for (let i = 0; i < isoValues.length; ++i) {
        let result = algo.isolines(attribute, isoValues[i])
        let color: any
        // if (parameters.useTable) {
        //     color = [mcolors[3 * i], mcolors[3 * i + 1], mcolors[3 * i + 2]]
        // }
        for (let k = 0; k < result[0].length; ++k) {
            for (let l = 0; l < result[0][k].length - 2; l += 2) {
                let i1 = result[0][k][l]
                let i2 = result[0][k][l + 1]
                let c = result[1][k][l / 2]
                let v1x = vertices.getX(i1)
                let v1y = vertices.getY(i1)
                let v1z = vertices.getZ(i1)
                let v2x = vertices.getX(i2)
                let v2y = vertices.getY(i2)
                let v2z = vertices.getZ(i2)
                positions.push(v1x + c * (v2x - v1x), v1y + c * (v2y - v1y), v1z + c * (v2z - v1z))
                // if (parameters.useTable) {
                //     colors.push(color[0], color[1], color[2])
                // }
                index += 3
            }
        }
    }

    const geom = new BufferGeometry()
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3))
    // if (parameters.useTable) {
    //     geom.setAttribute('color', new Float32BufferAttribute(colors, 3))
    // }

    const skin = new LineSegments(geom, material)
    
    // if (parameters.useTable) {
    //     skin.material["vertexColors"] = VertexColors
    //     skin.geometry["attributes"].color.needsUpdate = true;
    // }
    skin["pickable"] = false
    skin.frustumCulled = false
    return skin
}
