import { Group, PointLight, Object3D, Box3, Vector3 } from "three"

/**
 * @category Commands
 */
export function createDefaultLights(
    {scaling, object, intensity=0.5}:
    {scaling?: number, object?: Object3D, intensity?: number}={}): Group
{
    const g = new Group()
    const lights = []
    const color = 0xaaaaaa
    //const intensity = 0.5

    for (let i=0; i<8; ++i) {
        lights[ i ] = new PointLight( color, intensity, 0 )
        g.add( lights[ i ] )
    }

    let c = new Vector3()
    let scale = scaling!==undefined?scaling:1
    let distance = 100

    if (object) {
        const box = new Box3().setFromObject(object)
        c = box.getCenter(new Vector3())
        const size   = box.getSize(new Vector3())
        distance = Math.max(size.x, size.y, size.z)*scale
    }

    let i = 0
    lights[ i++ ].position.set( c.x-distance, c.y-distance, c.z-distance )
    lights[ i++ ].position.set( c.x+distance, c.y-distance, c.z-distance )
    lights[ i++ ].position.set( c.x+distance, c.y+distance, c.z-distance )
    lights[ i++ ].position.set( c.x+distance, c.y+distance, c.z+distance )
    lights[ i++ ].position.set( c.x-distance, c.y+distance, c.z-distance )
    lights[ i++ ].position.set( c.x-distance, c.y+distance, c.z+distance )
    lights[ i++ ].position.set( c.x-distance, c.y-distance, c.z+distance )
    lights[ i++ ].position.set( c.x+distance, c.y-distance, c.z+distance )

    return g
}