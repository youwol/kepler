import { Mesh, Material, Group } from 'three'
import { Serie } from '@youwol/dataframe'
import { IsoContoursParameters } from './isoContoursParameters'
import { createIsoContourLines } from './createIsoContourLines'
import { createIsoContourFilled } from './createIsoContourFilled'

/**
 * @example
 * Create 2 iso-contours: one filled and one with lines
 * ```js
 * scene.add( kepler.createIsoContours(
 *   surface,
 *   df.get(surfaceInfo.attr), {
 *      parameters: new kepler.IsoContoursParameters({
 *          color: '#ffffff',
 *          nbr: 10,
 *          filled: true
 *      })
 *   })
 * )
 *
 * scene.add( kepler.createIsoContours(
 *   surface,
 *   df.get(surfaceInfo.attr), {
 *      parameters: new kepler.IsoContoursParameters({
 *          color: '#000000',
 *          nbr: 10,
 *          filled: false
 *      })
 *   })
 * )
 * ```
 * @category Skins
 */
export function createIsoContours(
    mesh: Mesh,
    attribute: Serie,
    {
        material,
        parameters,
    }: { material?: Material; parameters?: IsoContoursParameters } = {},
) {
    const both = parameters.filled && parameters.lined
    if (both) {
        const group = new Group()

        const skin1 = createIsoContourFilled(mesh, attribute, {
            material,
            parameters,
        })
        if (skin1) {
            group.add(skin1)
        }

        const skin2 = createIsoContourLines(mesh, attribute, {
            material,
            parameters,
        })
        if (skin2) {
            group.add(skin2)
        }

        return group
    }

    if (parameters.filled) {
        return createIsoContourFilled(mesh, attribute, { material, parameters })
    } else {
        return createIsoContourLines(mesh, attribute, { material, parameters })
    }
}
