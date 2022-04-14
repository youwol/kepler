import { DataFrame, IArray, Manager, Serie } from "@youwol/dataframe"
import { NormalsDecomposer } from "@youwol/math"
import { createVectors, VectorsParameters } from "./createVectors"
import { BufferGeometry, LineSegments, Material, Object3D } from "three"

import { fromTriangleToNode } from "../../../../geometry/dist/@youwol/geometry"
console.warn('CHANGE THE IMPORT !!!!!! It was for testing purpose...')

export function createNormals(
    {geometry,  material, parameters}:
    {geometry: BufferGeometry, material?: Material, parameters?: VectorsParameters}): Object3D
{
    if (geometry.index === undefined) {
        throw new Error('not a mesh made of triangles')
    }

    const positions = Serie.create({array: geometry.getAttribute('position').array as IArray, itemSize: 3})
    const indices   = Serie.create({array: geometry.index.array as IArray, itemSize: 3})

    const manager = new Manager(
        DataFrame.create({ series: {positions, indices} }),
        [ new NormalsDecomposer ]
    )

    const normals = fromTriangleToNode( {positions, indices, attribute: manager.serie(3, 'normals')} )

    return createVectors({geometry,  material, parameters, vectorField: normals})
}
