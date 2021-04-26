```js
let scene, camera, light, renderer, controls

init()
load()
animate()

function load() {
    loadSurface(url)
        .then( _ => {
            kepler.fitScene( {scene, camera, controls} )
            kepler.changeView('north', {scene, camera, controls})
            kepler.changeBackground( {scene, color: '#777777'} )

            scene.add( kepler.createDefaultLights({
                object: scene, 
                scaling: 10, 
                intensity: 1
            }) )

            const p = {scene, camera, controls}
            const keyboard = new kepler.Keyboard()
            keyboard.addKey('u', e => kepler.changeView('up', p) )
            keyboard.addKey('d', e => kepler.changeView('down', p) )
            keyboard.addKey('s', e => kepler.changeView('south', p) )
            keyboard.addKey('n', e => kepler.changeView('north', p) )
            keyboard.addKey('e', e => kepler.changeView('east', p) )
            keyboard.addKey('w', e => kepler.changeView('west', p) )
            keyboard.addKey('f', e => kepler.zoomToModel(p) )

            renderer.domElement.addEventListener('dblclick', event => {
                kepler.zoomToIntersection( {scene, event, camera, controls} )
            })
        })
}

function loadSurface(url) {
    const promise = fetch(surfaceInfo.url)
        .then( res => {
            if ( res.ok ) return res.text()
            return undefined
        })
        .then( buffer => {
            if (! buffer) return undefined
            const dfs = io.decodeGocadTS(buffer, {shared: true, merge: false})
            dfs.forEach( df => {
                const surface = kepler.createSurface({
                    positions: df.get('positions'),
                    indices  : df.get('indices')
                })
                
                scene.add(surface)

                if (df.get('Ux')) {
                    kepler.paintAttribute( surface, df.get('Ux') )
                }                
            })
        })
    return promise
}

function init() {
    scene = new three.Scene
    scene.background = new three.Color( 0xaaaaaa )

    const w = window.innerWidth
    const h = window.innerHeight

    camera = new three.PerspectiveCamera( 70,  w/h, 0.01, 100000 )
    camera.position.z = 100

    renderer = new three.WebGLRenderer( { alpha: false, antialias: true } )
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize( w, h )
    document.body.appendChild( renderer.domElement )

    window.addEventListener( 'resize', onWindowResize )

    controls = new three.TrackballControls( camera, renderer.domElement )
    controls.rotateSpeed = 1.0
    controls.zoomSpeed = 1.2
    controls.panSpeed = 0.8
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize( window.innerWidth, window.innerHeight )
    controls.handleResize()
}

function animate() {
    requestAnimationFrame( animate )
    controls.update()
    render()
}

function render() {
    renderer.render( scene, camera );
}
```