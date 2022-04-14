import {
    LineSegments, LineBasicMaterial, Color, BufferGeometry,
    Float32BufferAttribute, Material, MeshBasicMaterial, Object3D, CatmullRomCurve3, Vector3, TubeGeometry, Mesh, Group
} from "three"

import { PaintParameters } from './paintAttribute'
import { fromValueToColor } from '../utils/lut-utils'
import { Serie, array, createFrom, IArray } from "@youwol/dataframe"
import { createLut } from "../utils"
import { VectorsParameters } from "."


export class TubeVectorsParameters extends VectorsParameters {
    public readonly radius: number = 1
    constructor(
        {radius, ...others}:
        {radius?: number} = {})
    {
        super(others)
        this.radius = radius!==undefined?radius:1
    }
}

/**
 * @category Skins
 */
export function createTubeVectors(
    {geometry,  material, vectorField, attribute, parameters}:
    {geometry: BufferGeometry, material?: Material, vectorField?: Serie, attribute: Serie, parameters?: TubeVectorsParameters}): Object3D
{
    if (geometry === undefined)               throw new Error('geometry is undefined')

    const position = geometry.getAttribute('position')

    if (vectorField === undefined)            throw new Error('vectorField is undefined')
    if (vectorField.count !== position.count) throw new Error('vectorField should have 3 x nb vertices')
    if (parameters === undefined)             throw new Error('parameters is undefined (needs name of the vector field)')

    if (material === undefined) {
        material = new MeshBasicMaterial( {
            color: new Color(parameters.color),
            vertexColors: false,
            opacity: parameters.opacity, 
            transparent: parameters.transparent
        } )
        // material = new LineBasicMaterial({
        //     linewidth: parameters.lineWidth, 
        //     opacity: parameters.opacity, 
        //     transparent: parameters.transparent,
        //     color: new Color(parameters.color),
        //     vertexColors: false
        // })
    }

    if (attribute === undefined) {
        material.vertexColors = false
    } else {
        material.vertexColors = true
    }

    const pos = Serie.create({array: geometry.getAttribute('position').array as IArray, itemSize: 3})
    const s = parameters.scale
    const vertices: number[] = []
    const vecs = []

    const g = new Group
    
    pos.forEach( (p,i) => {
        const u = vectorField.itemAt(i)
        if (parameters.project) {
            u[2] = 0
        }
        if (parameters.normalize) {
            const l = Math.sqrt(u[0]**2 + u[1]**2 + u[2]**2)
            u[0] /= l
            u[1] /= l
            u[2] /= l
        }

        let path: CatmullRomCurve3 = undefined
        if (parameters.centered) {
            // centered vector
            path = new CatmullRomCurve3( [
                new Vector3(p[0]-s*u[0]/2, p[1]-s*u[1]/2, p[2]-s*u[2]/2),
                new Vector3(p[0]+s*u[0]/2, p[1]+s*u[1]/2, p[2]+s*u[2]/2)
            ] )
        }
        else {
            path = new CatmullRomCurve3( [
                new Vector3(p[0], p[1], p[2]),
                new Vector3(p[0]+s*u[0], p[1]+s*u[1], p[2]+s*u[2])
            ] )
        }
        const geometry = new TubeGeometry( path, 2, parameters.radius, 10, false )
        g.add( new Mesh( geometry, material ) )
    })

    // // Coloring the vectors
    // const defaultColor = new Color(parameters.color)
    // const lutTable = createLut(parameters.lut, 256)

    // const mm = attribute ? array.minMax(attribute.array) : [0,1]

    // if (parameters.lockLut) {
    //     lutTable.setMin(0)
    //     lutTable.setMax(1)
    // } else {
    //     lutTable.setMin(mm[0])
    //     lutTable.setMax(mm[1])
    // }

    // const params = {
    //     min: parameters.min, 
    //     max: parameters.max, 
    //     lutTable, 
    //     defaultColor, 
    //     reverse: parameters.reverseLut
    // }

    // if (attribute) {
    //     const colors: number[] = []
    //     attribute.array.forEach( value => {
    //         const c = fromValueToColor(value, params)
    //         for (let i=0; i<2; ++i) {
    //             colors.push(c[0], c[1], c[2])
    //         }
    //     })
    //     lines.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    // }

    // lines.material = material
    return g
}
