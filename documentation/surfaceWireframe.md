```js
// df stands for dataframe (see @youwol/dataframe)
const dfs = io.decodeGocadTS(buffer, {shared: true, merge: false})

dfs.forEach( df => {
    const surface = kepler.createSurface({
        positions: df.get('positions'),
        indices  : df.get('indices'),
        parameters: new kepler.SurfaceParameters({
            flat: false, 
            wireframe: true, 
            color: '#000000'
        })
    })

    scene.add(surface)
})
```