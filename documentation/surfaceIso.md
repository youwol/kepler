```js
// df stands for dataframe (see @youwol/dataframe)
const dfs = io.decodeGocadTS(buffer, {shared: true, merge: false})

dfs.forEach( df => {
    // Create a surface, but do not put it in the scene
    const surface = kepler.createSurface({
        positions: df.get('positions'),
        indices  : df.get('indices')
    })

    skin = kepler.createIsoContourLines(
        surface, df.get(surfaceInfo.attr)
    )
    if (skin) scene.add(skin)
})
```