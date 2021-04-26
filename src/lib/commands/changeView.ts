import { Vector3, Scene, Camera, Box3 } from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { animate } from '../utils/animationLoop'
import { fitScene } from './fitScene'

// TODO: define a Control interface since we can have OrbitControl etc...

/**
 * Change the view of the scene
 * @param view Possible values are `up`, `down`, `east`, `west`, `north`, `south`
 * @param controls The Trackball controls
 * @example
 * ```ts
 * kepler.changeView('north', controls)
 * ```
 * @category Commands
 */
export function changeView(view: string,
    {scene, camera, controls}:
    {scene: Scene, camera: Camera, controls: TrackballControls})
{
    if (!controls) throw new Error('Missing controls in args')
    if (view) {
        const name = view.toLowerCase()
        const e = entries.get(name)

        if (e !== undefined) {
            controls.target.copy(e.target)            // target is Vector3
            controls.object.position.copy(e.position) // object is Object3D
            controls.object.up.copy(e.up)
            //controls.rotateCamera()
            fitScene({scene, camera, controls})

            
            // const beginTarget = controls.target.clone()
            // const endTarget   = e.target
            // const beginCamera = controls.object.position.clone()
            // const endCamera   = e.position
            // animate({
            //     cb: (t: number) => {
            //         controls.object.position.copy( (new Vector3()).lerpVectors(beginCamera, endCamera, t) )
            //         controls.target.copy( (new Vector3()).lerpVectors(beginTarget, endTarget, t) )
            //         controls.update()
            //     },
            //     endCb: () => fitScene({scene, camera, controls}),
            //     nb  : 20,
            //     time: 300
            // })
            
        }
    }
}

// ---------------------------------------------------------------

const entries: Map<string, any> = new Map()

function add(name: string, target: Vector3, position: Vector3, up: Vector3): void {
    const entry = {
      target: target.clone(),
      position: position.clone(),
      up: up.clone()
    }
    entries.set(name, entry)
}

add('up',    new Vector3(0, 0, 0), new Vector3(0, 0, 1),  new Vector3(0, 1, 0))
add('down',  new Vector3(0, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 1, 0))
add('east',  new Vector3(0, 0, 0), new Vector3(1, 0, 0),  new Vector3(0, 0, 1))
add('west',  new Vector3(0, 0, 0), new Vector3(-1, 0, 0), new Vector3(0, 0, 1))
add('north', new Vector3(0, 0, 0), new Vector3(0, 1, 0),  new Vector3(0, 0, 1))
add('south', new Vector3(0, 0, 0), new Vector3(0, -1, 0), new Vector3(0, 0, 1))
