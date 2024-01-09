import {
    Color,
    BufferGeometry,
    Mesh,
    Material,
    DoubleSide,
    MeshPhongMaterial,
    Float32BufferAttribute,
} from 'three'
import { createBufferGeometry } from '../utils'
import { IsoContoursParameters } from './isoContoursParameters'
import { Serie } from '@youwol/dataframe'
import { IsoContoursFill } from './private/IsoContoursFill'

/**
 * @example
 * ```ts
 * const skin = createIsoContourFilled({
 *     geometry : mesh.geometry,
 *     attribute: dataframe.get('u'),
 *     parameters: new IsoContoursFilledParameters({
 *         lut: 'Insar',
 *         isoList: [1, 2, 3, 4, 7],
 *         min; 2,
 *         max: 10
 *     })
 * })
 *
 * scene.add(skin)
 * ```
 * @category Skins
 */
export function createIsoContourFilled(
    mesh: Mesh,
    attribute: Serie,
    {
        material,
        parameters,
    }: { material?: Material; parameters: IsoContoursParameters },
): Mesh {
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
        throw new Error('attribute is undefined')
    }

    if (attribute.itemSize !== 1) {
        throw new Error('attribute must be a scalar attribute (itemSize = 1)')
    }

    const iso = new IsoContoursFill(parameters)
    const result = iso.run(attribute, mesh.geometry)
    if (result.position.length === 0) return undefined

    const nmesh = new Mesh()
    //nmesh.castShadow = true
    nmesh.geometry = createBufferGeometry(result.position, result.index)
    nmesh.geometry.setAttribute(
        'color',
        new Float32BufferAttribute(result.color, 3),
    )
    nmesh.geometry.setAttribute(
        'normal',
        new Float32BufferAttribute(result.normal, 3),
    )

    if (material !== undefined) {
        nmesh.material = material
    } else {
        const mat = new MeshPhongMaterial({
            color: new Color(parameters.color),
            side: DoubleSide,
            vertexColors: true,
            wireframe: false,
            flatShading: false,
        })
        //mat.wireframe = true
        nmesh.material = mat
    }
    nmesh.material.polygonOffset = true
    nmesh.material.polygonOffsetFactor = 1

    if (parameters.opacity !== 1) {
        nmesh.material.opacity = parameters.opacity
        nmesh.material.transparent = true
    } else {
        nmesh.material.transparent = false
    }

    //nmesh.geometry.computeVertexNormals()

    return nmesh
}
