import { Color, BufferGeometry, Object3D } from "three"
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'

import { Serie } from "@youwol/dataframe"
import { SkinParameters } from "./skinParameters"

/**
 * Line rendering based on [this example](https://threejs.org/examples/?q=line#webgl_lines_fat)
 * @see [[createLineset2]]
 * @category Skin Parameters
 */
 export class LinesetParameters2 extends SkinParameters {
    public readonly width: number = 0.005
    public readonly color: string
    public readonly opacity: number
    public readonly transparent: boolean = false
    public readonly glLine: boolean = false
    public readonly worldUnits: boolean = false
    public readonly dashed: boolean = false
    public readonly dashScale: number = 1

    constructor(
        {width, color, opacity, transparent, glLine, worldUnits, dashed, dashScale, ...others}:
        {width?: number, color?: string, opacity?: number, transparent?: boolean, glLine?: boolean, worldUnits?: boolean, dashed?: boolean, dashScale?: number} = {})
    {
        super(others)
        this.width = width || 0.005
        this.color = color || '#000000'
        this.opacity = opacity || 1
        this.set('transparent', transparent, this.transparent)
        this.glLine = glLine!==undefined?glLine:false
        this.worldUnits = worldUnits!==undefined?worldUnits:false
        this.dashed = dashed!==undefined?dashed:false
        this.dashScale = dashScale!==undefined?dashScale:1
    }
}

/**
 * @see [[LinesetParameters2]]
 * @category Skins
 */
export function createLineset2(
    {position,  parameters}:
    {position: Serie|BufferGeometry, parameters?: LinesetParameters2}): Object3D
{
    if (position === undefined) throw new Error('geometry is undefined')
    if ( !(position instanceof BufferGeometry) && position.itemSize !==3) throw new Error(`position should have itemSize = 3 (got ${position.itemSize})`)
    if (parameters === undefined) parameters = new LinesetParameters2()

    const geometry = new LineGeometry()

    let a: ArrayLike<number> | Float32Array = undefined
    if (position instanceof BufferGeometry) {
        a = position.getAttribute('position').array
    }
    else {
        a = position.array
    }
    if (a instanceof Float32Array) {
        geometry.setPositions( a )
    }
    else if (Array.isArray(a)) {
        geometry.setPositions( a )
    }
    
    const material = new LineMaterial({
        linewidth: parameters.width, // in world units with size attenuation, pixels otherwise
        vertexColors: false,
        // resolution:  // to be set by renderer, eventually
        // worldUnits: true,
        alphaToCoverage: false
    })

    // console.log(parameters)

    material.color     = new Color(parameters.color)
    material.opacity   = parameters.opacity
    material.dashed    = parameters.dashed
    material.dashScale = parameters.dashScale

    const line = new Line2( geometry, material )
    line.computeLineDistances()
    line.scale.set( 1, 1, 1 )

    return line
}
