import { IArray, Serie } from "@youwol/dataframe"
import { extractSurfaceBorders } from "@youwol/geometry"
import {
    LineBasicMaterial, Color,
    Material, BufferGeometry, Mesh, LineSegments, BufferAttribute
} from "three"
import { LinesetParameters } from "./createLineset"


// -------------------------------------------------------
// Have to see https://stackoverflow.com/questions/14108553/get-border-edges-of-mesh-in-winding-order


/**
 * @category Skins
 */
export function createSurfaceBorders(
    {mesh,  material, parameters}:
    {mesh: Mesh, material?: Material, parameters?: LinesetParameters}): LineSegments
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

    if (parameters === undefined) {
        parameters = new LinesetParameters()
    }

    // --------------------------------------------------
    const bufferPosition = mesh.geometry.getAttribute('position') as BufferAttribute
    const bufferIndices  = mesh.geometry.index as BufferAttribute
    const vertices  = Serie.create({array: bufferPosition.array as IArray, itemSize: 3})
    const triangles = Serie.create({array: bufferIndices.array as IArray, itemSize: 3}) // mesh.geometry.index

    // Build the HE-surface (aka, HalfEdge-surface)
    const borders = extractSurfaceBorders(vertices, triangles)

    // const surface = Surface.create(vertices, triangles)
    // const borders = surface.bordersAsSerie

    // Fake indices
    const indices = []
    let id = 0
    for (let i=0; i<borders.count/2; ++i) {
        indices.push(id++, id++)
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(borders.array), 3))
    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1))

    if (material === undefined) {
        material = new LineBasicMaterial({
            linewidth: parameters.lineWidth, 
            opacity: parameters.opacity, 
            transparent: parameters.transparent,
            color: new Color(parameters.color ? parameters.color : "#000")
        })
    }

    return new LineSegments(geometry, material)
}
