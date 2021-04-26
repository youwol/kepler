import { BufferGeometry } from "three"
import { ASerie, IArray } from "@youwol/dataframe"
import { SkinParameters } from './skinParameters'

/**
 * @see [[deform]]
 * @category Skin Parameters
 */
export class DeformParameters extends SkinParameters {
    public readonly scaleX: number
    public readonly scaleY: number
    public readonly scaleZ: number

    constructor(
        {scaleX=1, scaleY=1, scaleZ=1, ...others}:
        {scaleX?: number, scaleY?: number, scaleZ?: number}={})
    {
        super(others)
        this.scaleX = scaleX || 1
        this.scaleY = scaleY || 1
        this.scaleZ = scaleZ || 1
    }
}

/**
 * @example
 * ```ts
 * const s = createSurface( df.get('positions').array, df.get('indices').array )
 * const newGeom = deform( s.geometry, df.get('U').array )
 * ```
 * @category Skins
 */
export function deform(
    {geometry, attribute, parameters}:
    {geometry: BufferGeometry, attribute: IArray, parameters?: DeformParameters}): ASerie
{
    if (geometry === undefined) throw new Error('geometry is undefined')
    if (attribute.length !== geometry.length) throw new Error('attribute should have 3 x nb vertices')

    const geom = geometry.clone()

    for (let i = 0; i < geometry.count; ++i) {
        geom.setXYZ(i, geometry.getX(i) + parameters.scaleX*attribute[3*i],
                       geometry.getY(i) + parameters.scaleY*attribute[3*i+1],
                       geometry.getZ(i) + parameters.scaleZ*attribute[3*i+2])
    }

    return geom
}
