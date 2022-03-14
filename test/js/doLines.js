
function doLines(plines) {
    const promises = []

    if (plines) {
        plines.forEach( pline => {
            if (pline.show) {
                const promise = doPLine(pline)
                if (promise) {
                    if (Array.isArray(promise)) {
                        promises.push(...promise)
                    }
                    else {
                        promises.push(promise)
                    }
                }
            }
        })
    }

    return promises
}

// ------------------------------------------

function doPLine(plineInfo) {
    if (plineInfo.url === undefined) return []
    if (Array.isArray(plineInfo.url)) {
        const promises = []
        plineInfo.url.forEach( url => {
            const promise = doOnePline(url)
            if (promise) promises.push(promise)
        })
        return promises
    }
    else {
        return doOnePline(plineInfo.url)
    }

    function doOnePline(url) {
        const promise = fetch(url)
            .then( res => {
                if ( res.ok ) return res.text()
                return undefined
            })
            .then( buffer => {
                if (! buffer) return undefined

                const scolor = randColor()

                const dfs = io.decodeGocadPL(buffer, {shared: false, merge: true})

                dfs.forEach( df => {

                    if (plineInfo.show) {

                        let position = df.series['positions']
                        console.log('min-max position pointset:', math.minMax(position) )

                        let skin = kepler.createLineset({
                            position: df.series['positions'],
                            parameters: {
                                color: plineInfo.color,
                                useTube: plineInfo.useTube,
                                tubeRadius: plineInfo.tubeRadius
                            }
                        })
                        group.add( skin )
                    }
                })
            })
        return promise
    }
}