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

    // Build the HE-surface (aka, HalfEdge-surface)
    let geometry = new BufferGeometry()
    const vertices  = mesh.geometry.getAttribute('position')
    const triangles  = mesh.geometry.index

    /*
    const builder = new SurfaceBuilder()
    const surface = new Surface
    builder.beginSurface(surface) ; {
        for (let i=0; i<vertices.count; ++i) {
            builder.addNode(vertices.getX(i), vertices.getY(i), vertices.getZ(i))
        }
        for (let i=0; i<triangles.count; i += 3) {
            builder.beginFacet() ; {
                builder.addNodeToFacet(triangles.getX(i  ))
                builder.addNodeToFacet(triangles.getX(i+1))
                builder.addNodeToFacet(triangles.getX(i+2))
            }
            builder.endFacet() ;
        }
    }
    builder.endSurface() // Finish to build the surface

    const borders = surface.borders()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(borders.array), 3))

    const indices = []
    let id = 0
    for (let i=0; i<borders.count; ++i) {
        indices.push(id++, id++)
    }

    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1))
    // let id = 0
    // borders.forEach( segment => {
    //     const p1 = [segment[0], segment[1], segment[2]]
    //     const p2 = [segment[3], segment[4], segment[5]]
    // })
    */

    if (material === undefined) {
        material = new LineBasicMaterial({
            linewidth: parameters.lineWidth, 
            opacity: parameters.opacity, 
            transparent: parameters.transparent,
            color: new Color(parameters.color)
        })
    }

    return new LineSegments(geometry, material)
}
