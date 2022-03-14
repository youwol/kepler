function postInit() {
    // extra.changeBackground( {scene, color: '#888888'} )
    if (model.backgroundColor) {
        extra.changeBackground( {scene, color: model.backgroundColor} )
    } else {
        extra.changeBackground( {scene, color: '#fff'} )
    }

    // const intensitySky    = 0.7 // param for flux
    // const intensityground = 0.1 // param for flux

    // const sky    = 0xffffff
    // const ground = createGrayColor(intensityground)

    // const h1 = new THREE.HemisphereLight( sky, ground, intensitySky )
    // h1.position.set( 0, 10, 10 )
    // scene.add(h1)

    // const h2 = new THREE.HemisphereLight( sky, ground, intensitySky )
    // h2.position.set( 0, -10, 0 )
    // scene.add(h2)

    const lights = extra.createDefaultLights({object: scene})
    scene.add(lights)

    const keyboard = new extra.Keyboard(document, 'keydown')
    // keyboard.setUpEvent(e => {controls.constraint = extra.CONSTRAINT.NONE})

    keyboard.addKey({key:'u', cb:e => extra.changeView('up', {scene, camera, controls}) })
    keyboard.addKey({key:'d', cb:e => extra.changeView('down', {scene, camera, controls}) })
    keyboard.addKey({key:'s', cb:e => extra.changeView('south', {scene, camera, controls}) })
    keyboard.addKey({key:'n', cb:e => extra.changeView('north', {scene, camera, controls}) })
    keyboard.addKey({key:'e', cb:e => extra.changeView('east', {scene, camera, controls}) })
    keyboard.addKey({key:'w', cb:e => extra.changeView('west', {scene, camera, controls}) })

    keyboard.addKey({key:' ', cb: e => {
        if (cube) cube.restoreView()
    } })
    
    keyboard.addKey({key:'f', cb:e => extra.zoomToModel({scene, camera, controls, duration:300}) })

    // keyboard.addKey({key:'x', cb:e => controls.constraint = extra.CONSTRAINT.X})
    // keyboard.addKey({key:'y', cb:e => controls.constraint = extra.CONSTRAINT.Y})
    // keyboard.addKey({key:'z', cb:e => controls.constraint = extra.CONSTRAINT.Z})

    renderer.domElement.addEventListener('dblclick', event => {
        extra.zoomToIntersection( {scene, event, camera, controls} )
    })

    const LOADER = document.getElementById('js-loader')
    LOADER.remove()
}
