import {Box3Helper, Color, LineSegments, Box3, Object3D, Vector3} from "three"
import { SkinParameters } from './skinParameters'

/**
 * @example
 * ```ts
 * const p = new BBoxParameters({
 *     color: '#000000',
 *     visible: false
 * })
 * ```
 * @category Skin Parameters
 * @see [[createBBox]]
 */
export class BBoxParameters extends SkinParameters {
    public readonly color: string
    public readonly linewidth: number

    constructor(
        {color, linewidth, ...others}:
        {color?: string, linewidth?: number}={})
    {
        super(others)
        this.color = color || '#000000'
        this.linewidth = linewidth || 0.1
    }
}

/**
 * @brief Place a bounding box (lines) around an object
 * @example
 * ```ts
 * const s = createBBox({
 *      object: scene,
 *      parameters: new BBoxParameters({
 *          color: '#000000',
 *          visible: false
 *      })
 * })
 * ```
 * @category Skins
 */
export function createBBox(object: Object3D, parameters: BBoxParameters): LineSegments {
    if (object === undefined) throw new Error('object is undefined')
    if (parameters === undefined) parameters = new BBoxParameters()
    
    const bbox = new Box3().setFromObject(object)
    const size = bbox.getSize(new Vector3)
    const min = Math.min(size.x, size.y, size.z)
    const max = Math.max(size.x, size.y, size.z)
    if (min===0) {
        bbox.expandByScalar(max/1e5)
    }
    const skin = new Box3Helper(bbox, new Color(parameters.color))
    skin.material['linewidth'] = parameters.linewidth
    skin["pickable"] = false
    return skin
}
