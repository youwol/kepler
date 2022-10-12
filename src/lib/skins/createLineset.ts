import {
    LineBasicMaterial, Color,
    Material, Line, BufferGeometry, CatmullRomCurve3, TubeGeometry, MeshBasicMaterial, Mesh, Vector3, Object3D
} from "three"
import { Serie } from "@youwol/dataframe"
import { createBufferGeometry } from '../utils'
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
    public readonly useTube: boolean = false
    public readonly tubeRadius: number = 1

    constructor(
        {lineWidth, color, opacity, transparent, useTube, tubeRadius, ...others}:
        {lineWidth?: number, color?: string, opacity?: number, transparent?: boolean, useTube?: boolean, tubeRadius?: number} = {})
    {
        super(others)
        this.lineWidth = lineWidth || 1
        this.color = color || '#000000'
        this.opacity = opacity || 1
        this.set('transparent', transparent, this.transparent)
        this.useTube = useTube!==undefined?useTube:false
        this.tubeRadius = tubeRadius!==undefined?tubeRadius:1
    }
}

// -------------------------------------------------------

/**
 * @see [[LinesetParameters]]
 * @category Skins
 */
export function createLineset(
    {position,  material, parameters}:
    {position: Serie|BufferGeometry, material?: Material, parameters?: LinesetParameters}): Object3D
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

    if (parameters.useTube === true) {
        const vecs = []
        let p = undefined
        if (position instanceof BufferGeometry) {
            p = (position as BufferGeometry).getAttribute('position').array
        }
        else {
            p = (position as Serie).array
        }
        for (let i=0; i<p.length; i+=3) {
            vecs.push(new Vector3(p[i], p[i+1], p[i+2]))
        }
        let count = p.length/3
        
        const path     = new CatmullRomCurve3( vecs )
        // TubeGeometry(path, tubularSegments, radius, radialSegments)
        const geometry = new TubeGeometry( path, count<20?20:count, parameters.tubeRadius, 10, false )
        const material = new MeshBasicMaterial( { color: new Color(parameters.color) } )
        return new Mesh( geometry, material )
    }

    const geometry = ( position instanceof BufferGeometry ? position : createBufferGeometry(position) )

    if (material === undefined) {
        material = new LineBasicMaterial({
            //linewidth: parameters.lineWidth, 
            // opacity: parameters.opacity, 
            // transparent: parameters.transparent,
            color: new Color(parameters.color)
        })
    }

    return new Line(geometry, material)
}
