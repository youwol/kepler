import {
    LineBasicMaterial, Color,
    Material, Line, BufferGeometry
} from "three"
import { Serie } from "@youwol/dataframe"
import { createBufferGeometry } from "./bufferUtils"
import { SkinParameters } from "./skinParameters"

/**
 * @see [[createLineset]]
 * @category Skin Parameters
 */
export class LinesetParameters extends SkinParameters {
    public readonly lineWidth: number
    public readonly color: string
    public readonly opacity: number
    public readonly transparent: boolean = false

    constructor(
        {lineWidth, color, opacity, transparent, ...others}:
        {lineWidth?: number, color?: string, opacity?: number, transparent?: boolean} = {})
    {
        super(others)
        this.lineWidth = lineWidth || 1
        this.color = color || '#000000'
        this.opacity = opacity || 1
        this.set('transparent', transparent)
    }
}

// -------------------------------------------------------

/**
 * @category Skins
 */
export function createLineset(
    {position,  material, parameters}:
    {position: Serie|BufferGeometry, material?: Material, parameters?: LinesetParameters}): Line
{
    if (position === undefined) {
        throw new Error('geometry is undefined')
    }
    if ( !(position instanceof BufferGeometry) && position.itemSize !==3) {
        throw new Error(`position should have itemSize = 3 (got ${position.itemSize})`)
    }

    if (parameters === undefined) {
        parameters = new LinesetParameters()
    }

    const geometry = ( position instanceof BufferGeometry ? position : createBufferGeometry(position) )

    if (material === undefined) {
        material = new LineBasicMaterial({
            linewidth: parameters.lineWidth, 
            opacity: parameters.opacity, 
            transparent: parameters.transparent,
            color: new Color(parameters.color)
        })
    }

    return new Line(geometry, material)
}
