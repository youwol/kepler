## Fitting the scene or an object
```js
kepler.fitScene( {scene, camera, controls} )
// or
kepler.fitScene( {obj1, camera, controls} )
```

## Changing the view
Possible values are `up`, `down`, `east`, `west`, `north`, `south`.
```js
kepler.changeView('north', {scene, camera, controls})
```

## Changing the background color or image
```js
kepler.changeBackground( {scene, color: '#777777'} )
```

## Creating the default lights
```js
scene.add( kepler.createDefaultLights({object: scene, scaling: 10, intensity: 1}) )
```

## Response to some uder-defined keyboard shortcuts
```js
const keyboard = new kepler.Keyboard()
const p = {scene, camera, controls}
keyboard.addKey('u', e => kepler.changeView('up'   , p) )
keyboard.addKey('d', e => kepler.changeView('down' , p) )
keyboard.addKey('s', e => kepler.changeView('south', p) )
keyboard.addKey('n', e => kepler.changeView('north', p) )
keyboard.addKey('e', e => kepler.changeView('east' , p) )
keyboard.addKey('w', e => kepler.changeView('west' , p) )
keyboard.addKey('f', e => kepler.zoomToModel(p) )
```

## Response to some mouse events
```js
renderer.domElement.addEventListener('dblclick', event => {
    kepler.zoomToIntersection( {scene, event, camera, controls} )
})
```