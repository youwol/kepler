import {
    Points, PointsMaterial, Color, BufferGeometry,
    Material, Box3, Vector3, TextureLoader, BufferAttribute
} from 'three'

import { SkinParameters } from './skinParameters'
import { Serie } from '@youwol/dataframe'
import { createBufferGeometry } from '../utils'

/**
 * @see [[createPointset]]
 * @category Skin Parameters
 */
export class PointsetParameters extends SkinParameters {
    public readonly size: number
    public readonly color: string
    public readonly sizeAttenuation: boolean = false
    public readonly opacity: number
    public readonly transparent: boolean = false
    public readonly sprite     : string
    public readonly sizeName   : string // ??

    constructor(
        {
            size, 
            color, 
            sizeAttenuation, 
            opacity, 
            transparent, 
            sprite, 
            sizeName, 
            ...others}:
        {
            size?: number, 
            color?: string, 
            sizeAttenuation?: boolean, 
            opacity?: number, 
            transparent?: boolean, 
            sprite?: string,
            //shadingName?: string, 
            sizeName?: string
        } = {})
    {
        super(others)
        this.size = size || 1
        this.color = color || '#ffff00'
        this.opacity = opacity || 1
        this.sprite = sprite || ''
        //this.shadingName = shadingName || ''
        this.sizeName = sizeName || ''
        this.set('sizeAttenuation', sizeAttenuation, this.sizeAttenuation)
        this.set('transparent', transparent, this.transparent
        )
    }
}

// -------------------------------------------------------

/**
 * @category Skins
 */
export function createPointset(
    {position, material, parameters}:
    {position: Serie | BufferGeometry, material?: Material, parameters?: PointsetParameters}): Points
{
    if (position === undefined) {
        throw new Error('position is undefined')
    }
    if ( !(position instanceof BufferGeometry) && position.itemSize !==3) {
        throw new Error(`position should have itemSize = 3 (got ${position.itemSize})`)
    }

    if (parameters === undefined) {
        parameters = new PointsetParameters()
    }

    const geometry = position instanceof BufferGeometry ? position : createBufferGeometry(position)

    // Check the default point size
    let tsize = parameters.size
    if (parameters.sizeAttenuation) {
        const bbox = new Box3()
        bbox.setFromBufferAttribute(geometry.getAttribute('position') as BufferAttribute)
        const size = bbox.getSize(new Vector3())
        tsize = Math.max(size.x, size.y, size.z)/400 * parameters.size
    }

    let sprite: any = undefined
    if (parameters.sprite !== '') {
        sprite = new TextureLoader().load(parameters.sprite)
    }

    let color = new Color(parameters.color)
    if (material === undefined) {
        material = new PointsMaterial({
            size: tsize, 
            sizeAttenuation: parameters.sizeAttenuation, 
            opacity: parameters.opacity, 
            transparent: parameters.transparent,
            color: color,
        })
    }
    if (sprite) {
        material["map"] = sprite
        material.alphaTest = 0.5
        material.transparent = true
    }

    return new Points(geometry, material)
}
