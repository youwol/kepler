import { BufferAttribute, BufferGeometry } from 'three'
import { Serie } from '@youwol/dataframe'
import { SkinParameters } from './skinParameters'

/**
 * @see [[deform]]
 * @category Skin Parameters
 */
export class DeformParameters extends SkinParameters {
    public readonly scaleX: number
    public readonly scaleY: number
    public readonly scaleZ: number

    constructor({
        scaleX = 1,
        scaleY = 1,
        scaleZ = 1,
        ...others
    }: { scaleX?: number; scaleY?: number; scaleZ?: number } = {}) {
        super(others)
        this.scaleX = scaleX || 1
        this.scaleY = scaleY || 1
        this.scaleZ = scaleZ || 1
    }
}

/**
 * @example
 * ```ts
 * const s = createSurface( df.series['positions'].array, df.series['indices'].array )
 * const newGeom = deform( s.geometry, df.series['U'].array )
 * ```
 * @category Skins
 */
export function deform({
    geometry,
    deformVector,
    parameters,
}: {
    geometry: BufferGeometry
    deformVector: Serie
    parameters?: DeformParameters
}): Serie {
    if (geometry === undefined) throw new Error('geometry is undefined')
    const position = geometry.getAttribute('position') as BufferAttribute

    if (deformVector.count !== position.count)
        throw new Error('attribute should have 3 x nb vertices')

    //const geom = position.clone()
    return deformVector.map((v, i) => [
        position.getX(i) + parameters.scaleX * v[0],
        position.getY(i) + parameters.scaleX * v[1],
        position.getZ(i) + parameters.scaleX * v[2],
    ])

    // for (let i = 0; i < position.count; ++i) {
    //     geom.setXYZ(i,
    //         position.getX(i) + parameters.scaleX*attribute[3*i],
    //         position.getY(i) + parameters.scaleY*attribute[3*i+1],
    //         position.getZ(i) + parameters.scaleZ*attribute[3*i+2]
    //     )
    // }

    // return geom
}
