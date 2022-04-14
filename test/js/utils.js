function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize( window.innerWidth, window.innerHeight )
    controls.handleResize()
}

function animate() {
    renderFct.render()
    requestAnimationFrame( animate )
}

const randColor = () => {
    const color = new THREE.Color( 0xffffff )
    color.setHex( Math.random() * 0xffffff )
    return '#'+color.getHexString()
}

function createGrayColor(intensity) {
    if (intensity === 0) {
        return '#000000'
    }
    const value = intensity * 0xFF | 0
    const grayscale = (value << 16) | (value << 8) | value
    const gray = grayscale.toString(16)
    return gray.length===5 ? '#0' + gray : '#' + gray
}

function load() {
    let promises = []

    promises.push(...doSurfaces(surfaceset))
    promises.push(...doLines   (plines))
    promises.push(...doPointsets(pointsets))
    
    Promise.all(promises).then( _ => {
        postInit()
    })
    .then( () => {
        extra.changeView('up', {scene, camera, controls})

        // const HUD = new kepler.ScaleBar( kepler.generateColorMap('Insar', 100, 1) )
        // renderFct.add( HUD.render )

        if (model && model.grid) {
            extra.createGridHelper(group, new extra.GridHeplerParameters({
                renderFunctions: renderFct, 
                renderer, 
                camera, 
                scene,
                extendCoef: 1.0,
                fading: false,
                fadingTime: 200,
                showPlanes: true,
                color: '#aaa',
                showBBox: false,
                divisions: 4
            }),
            new extra.GridTextParameters({
                rect: true,
                rectColor: '#fff',
                fontColor: '#000',
                fontSize: 30
            }) )
        }

        if (model && model.bbox) {
            const skin = kepler.createBBox(group, new kepler.BBoxParameters({
                color: '#000'
            }))
            scene.add(skin)
        }
    })
}