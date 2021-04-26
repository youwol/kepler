import { Scene, Color, TextureLoader } from 'three'

/**
 * Change the background by using either a color (given by a string) or an image URL
 * @example
 * ```ts
 * kepler.changeBackground( {scene, color: '#7777777'} )
 * ```
 * @category Commands
 */
export function changeBackground(
    {scene, color, image}:
    {scene: Scene, color?: string, image?: string})
{
    if (!scene) throw new Error('Missing scene')

    if (color) {
        scene.background = new Color(color)
    }
    else if (image) {
        const loader = new TextureLoader()
        const backgroundTexture = loader.load(image)
        scene.background = backgroundTexture
    }
}
