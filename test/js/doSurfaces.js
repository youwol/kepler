
function doSurfaces(surfaceset) {
    const promises = []

    if (surfaceset) {
        surfaceset.forEach(surface => {
            if (surface.show === true) {
                const promise = doSurface(surface)
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

// function createSurfaceBorders(df, color) {
//     const surface = geom.Surface.create(df.series.positions, df.series.indices)
//     const borders = surface.bordersAsSerie

//     // Fake indices
//     const indices = []
//     let id = 0
//     for (let i=0; i<borders.count/2; ++i) {
//         indices.push(id++, id++)
//     }

//     const geometry = new THREE.BufferGeometry()
//     geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(borders.array), 3))
//     geometry.setIndex(indices)

//     const material = new THREE.LineBasicMaterial({
//         linewidth: 1,
//         color: new THREE.Color(color?color:"#000000")
//     })

//     return new THREE.LineSegments(geometry, material)
// }

function doSurface(surfaceInfo) {
    if (Array.isArray(surfaceInfo.url)) {
        const promises = []
        surfaceInfo.url.forEach(url => {
            const promise = doOneSurface(url)
            if (promise) promises.push(promise)
        })
        return promises
    }
    else {
        return doOneSurface(surfaceInfo.url)
    }

    function doOneSurface(url) {
        const promise = fetch(url)
            .then(res => {
                if (res.ok) return res.text()
                return undefined
            })
            .then(buffer => {
                //console.log( kepler.generateColorMap('Insar', 32, 3) )

                class RDecomposer {
                    constructor(name = 'R', stressName = 'S') {
                        this.name = name
                        this.stressName = stressName
                    }
                    names(df, itemSize, serie, name) {
                        if (!df.contains(this.stressName)) return []
                        if (itemSize !== 1) return []
                        return ['R']
                    }
                    serie(df, itemSize, name) {
                        if (itemSize !== 1) return undefined
                        if (name !== this.name) return undefined
                        let stress = df.series[this.stressName]
                        if (!stress) return undefined
                        return math.eigenValue(stress).map(s => (s[1] - s[2]) / (s[0] - s[2]))
                        // return math.eigenValue(stress).map(s => (s[1] - s[0]) / (s[2] - s[0]))
                    }
                }

                if (!buffer) return undefined

                const scolor = randColor()

                const filter = io.IOFactory.getFilter(url)
                if (filter === undefined) {
                    return
                }

                const dfs = filter.decode(buffer, { shared: false, merge: true })
                // const dfs = io.decodeGocadTS(buffer, { shared: false, merge: true })
                dfs.forEach(df => {
                    let skin

                    console.log('loaded object named', df.userData.name)

                    let position = df.series.positions
                    let indices = df.series.indices

                    console.log('min-max position surface:', math.minMax(position))

                    if (surfaceInfo.translation) {
                        const x = surfaceInfo.translation[0]
                        const y = surfaceInfo.translation[1]
                        const z = surfaceInfo.translation[2]
                        position = position.map(v => [v[0] + x, v[1] + y, v[2] + z])
                    }

                    const manager = new dataframe.Manager(df, [
                        new math.PositionDecomposer,       // x y z
                        new math.ComponentDecomposer,      // Ux Uy Uz Sxx Sxy Sz Syy Syz Szz
                        new math.VectorNormDecomposer,     // U
                        new math.EigenValuesDecomposer,    // S1 S2 S3
                        new math.EigenVectorsDecomposer,    // S1 S2 S3
                        new geom.NormalsToNodeDecomposer,
                        new RDecomposer,
                        new geom.TriangleToNodeDecomposer({
                            positions: position,
                            indices,
                            decomposer: new math.AreaDecomposer
                        }),
                        new geom.CurvatureDecomposer({positions: position, indices})
                    ])

                    console.log(manager.names(1))

                    let attr = undefined
                    if (surfaceInfo.attr) attr = manager.serie(1, surfaceInfo.attr)
                    if (attr) {
                        const mM = math.minMaxArray(attr.array)
                        console.log('attr:', surfaceInfo.attr)
                        console.log('min :', mM[0].toFixed(3))
                        console.log('max :', mM[1].toFixed(3))
                    }

                    if (surfaceInfo.wireframe && surfaceInfo.wireframe.show) {
                        group.add(kepler.createSurface({
                            positions: position,
                            indices: df.series['indices'],
                            parameters: new kepler.SurfaceParameters({
                                wireframe: true,
                                color: surfaceInfo.wireframe.color,
                                opacity: 1.0
                            })
                        }))
                    }

                    // surface
                    const surface = kepler.createSurface({
                        positions: position,
                        indices: df.series['indices'],
                        parameters: new kepler.SurfaceParameters({
                            flat: surfaceInfo.surface.flat,
                            wireframe: false,
                            color: surfaceInfo.surface.color !== undefined ? surfaceInfo.surface.color : scolor,
                            opacity: surfaceInfo.surface.opacity,
                            creaseAngle: surfaceInfo.surface.creaseAngle
                        })
                    })
                    //surface.castShadow = true

                    if (surfaceInfo.surface.show) {
                        group.add(surface)
                        if (attr) {
                            kepler.paintAttribute(surface, attr, new kepler.PaintParameters({
                                atVertex: true,
                                lut: surfaceInfo.lut,
                                duplicateLut: surfaceInfo.duplicateLut,
                                reverseLut: surfaceInfo.reverseLut
                            }))
                        }
                    }

                    if (surfaceInfo.name && surfaceInfo.name.show) {
                        var center = new THREE.Vector3()
                        surface.geometry.computeBoundingBox()
                        surface.geometry.computeBoundingSphere()
                        surface.geometry.boundingBox.getCenter(center)
                        // console.log(surface.geometry.boundingSphere)
                        const radius = surface.geometry.boundingSphere.radius
                        // addObjectLabel(group, 'object', center.x, center.y, center.z)
                        const sprite = extra.createTextSprite({
                            text: df.userData.name, 
                            position: center, 
                            rect     : surfaceInfo.name.rect !== undefined ? surfaceInfo.name.rect : false, 
                            rectColor: '#fffd82', 
                            fontColor: '#000', 
                            fontSize : surfaceInfo.name.fontSize !== undefined ? surfaceInfo.name.fontSize : 40, 
                        })
                        if (surfaceInfo.name.translate) {
                            sprite.position.setX(sprite.position.x + radius)
                            sprite.position.setZ(sprite.position.z - radius)
                        }
                        group.add( sprite )
                    }

                    // if ( (surfaceInfo.iso && (surfaceInfo.iso.show===false || attr===undefined)) ) {
                    //     group.add(surface)
                    //     if (attr) {
                    //         kepler.paintAttribute( surface, attr, new kepler.PaintParameters({
                    //             atVertex: true,
                    //             lut: surfaceInfo.lut,
                    //             duplicateLut: surfaceInfo.iso.duplicateLut,
                    //             reverseLut: surfaceInfo.reverseLut
                    //         }) )
                    //     }
                    // }

                    if (surfaceInfo.borders && surfaceInfo.borders.show) {
                        // const borders = createSurfaceBorders(df, surfaceInfo.borders.color)
                        const borders = kepler.createSurfaceBorders({
                            mesh: surface,
                            parameters: new kepler.LinesetParameters({
                                color: surfaceInfo.borders.color,
                                useTube: surfaceInfo.borders.useTube !== undefined ? surfaceInfo.borders.useTube : false,
                                tubeRadius: surfaceInfo.borders.tubeRadius !== undefined ? surfaceInfo.borders.tubeRadius : 1
                            })
                        })
                        group.add(borders)
                    }

                    if (surfaceInfo.points && surfaceInfo.points.show) {
                        const points = kepler.createPointset({
                            position: position,
                            parameters: new kepler.PointsetParameters({
                                size: surfaceInfo.points.color !== undefined ? surfaceInfo.points.size : 1,
                                color: surfaceInfo.points.color !== undefined ? surfaceInfo.points.color : undefined
                            })
                        })
                        group.add(points)
                    }

                    if (surfaceInfo.vectors !== undefined && surfaceInfo.vectors.show === true) {
                        const vattr = manager.serie(3, surfaceInfo.vectors.attr)
                        if (vattr) {
                            if (surfaceInfo.vectors.useTube) {
                                group.add(kepler.createTubeVectors({
                                    geometry: surface.geometry,
                                    vectorField: vattr,
                                    parameters: new kepler.TubeVectorsParameters({
                                        scale: surfaceInfo.vectors.scale,
                                        color: surfaceInfo.vectors.color,
                                        radius: surfaceInfo.vectors.radius,
                                        centered: surfaceInfo.vectors.centered
                                    })
                                }))
                            }
                            else {
                                group.add(kepler.createVectors({
                                    geometry: surface.geometry,
                                    vectorField: vattr,
                                    parameters: new kepler.TubeVectorsParameters({
                                        scale: surfaceInfo.vectors.scale,
                                        color: surfaceInfo.vectors.color,
                                        centered: surfaceInfo.vectors.centered
                                    })
                                }))
                            }
                        }
                        else {
                            console.warn('cannot find vector attribute' + surfaceInfo.vectors.attr)
                        }
                    }

                    if (surfaceInfo.streamlines !== undefined && surfaceInfo.streamlines.show === true) {
                        const vattr = manager.serie(3, surfaceInfo.streamlines.attr)
                        console.log( math.minMax(vattr) )
                        if (vattr) {
                            let positions = dataframe.Serie.create({
                                array: surface.geometry.attributes.position.array,
                                itemSize: 3
                            })
                            const indices = dataframe.Serie.create({
                                array: surface.geometry.index.array,
                                itemSize: 3
                            })
                            const lines = geom.generateStreamLinesFromUnstructured({
                                positions,
                                indices,
                                vectorField: vattr,
                                // nx: 100, 
                                // ny: 100, 
                                maximumPointsPerLine: surfaceInfo.streamlines.maximumPointsPerLine!==undefined?surfaceInfo.streamlines.maximumPointsPerLine:50,
                                dSep: surfaceInfo.streamlines.dSep!==undefined?surfaceInfo.streamlines.dSep:0.2,
                                timeStep: surfaceInfo.streamlines.timeStep!==undefined?surfaceInfo.streamlines.timeStep:0.01,
                                dTest: surfaceInfo.streamlines.dTest!==undefined?surfaceInfo.streamlines.dTest:0.08,
                                maxTimePerIteration: surfaceInfo.streamlines.maxTimePerIteration!==undefined?surfaceInfo.streamlines.maxTimePerIteration:1000
                            })
                            if (lines) {
                                const g = new THREE.Group
                                lines.forEach(line => {
                                    let pos = dataframe.Serie.create({
                                        array: dataframe.createTyped(Float32Array, line.series.positions.array, false),
                                        itemSize: 3
                                    })
                                    g.add( kepler.createLineset({
                                        position: pos,
                                        parameters: new kepler.LinesetParameters({
                                            color: '#000'
                                        })
                                    }) )
                                })
                                group.add(g)
                            }
                        }
                        else {
                            console.warn('cannot find stream attribute' + surfaceInfo.streamlines.attr)
                        }
                    }

                    if (surfaceInfo.failure !== undefined && surfaceInfo.failure.show === true) {
                        if (df.series[surfaceInfo.failure.stress] !== undefined) {
                            let skin = kepler.createFailurePlanes({
                                geometry: surface.geometry,
                                dataframe: df,
                                parameters: new kepler.FailurePlanesParameters({
                                    stress: surfaceInfo.failure.stress,
                                    size: surfaceInfo.failure.size,
                                    sizeAttribute: surfaceInfo.failure.sizeAttribute ? surfaceInfo.failure.sizeAttribute : '',
                                    paintAttribute: surfaceInfo.failure.paintAttribute ? surfaceInfo.failure.paintAttribute : '',
                                    color: surfaceInfo.failure.color,
                                    circle: surfaceInfo.failure.circle,
                                    borders: surfaceInfo.failure.borders,
                                    type: surfaceInfo.failure.type
                                })
                            })
                            group.add(skin)

                            if (surfaceInfo.failure.borders) {
                                skin = kepler.createEdges(skin.geometry, new kepler.EdgesParameters({
                                    thresholdAngle: 10,
                                    color: surfaceInfo.failure.borderColor ? surfaceInfo.failure.borderColor : "#000000"
                                }))
                                group.add(skin)
                            }
                        }
                    }

                    if (surfaceInfo.band !== undefined && surfaceInfo.band.show === true) {
                        if (manager.contains(1, surfaceInfo.band.attr)) {
                            const attr = manager.serie(1, surfaceInfo.band.attr)
                            console.log(surfaceInfo.band.attr, math.minMax(attr))
                            group.add( kepler.createBand(surface, attr, {
                                parameters: new kepler.BandParameters({
                                    color: surfaceInfo.band.color,
                                    from : surfaceInfo.band.from,
                                    to   : surfaceInfo.band.to,
                                    scale: surfaceInfo.band.scale
                                })
                            }) )
                        }
                        else {
                            console.warn('attr',surfaceInfo.band.attr, 'does not exist for band.\nPossible names are')
                            console.warn(manager.names(1))
                        }
                    }

                    if (attr && surfaceInfo.iso) {
                        const minmax = dataframe.array.minMax(attr.array)
                        //let isos = kepler.generateIsos(minmax[0], minmax[1], 20)
                        //isos = [-0.2, 0, 0.2]
                        // let isos = kepler.generateIsos(minmax[0], minmax[1], surfaceInfo.iso.nb)
                        //let isos = kepler.generateIsosBySpacing(minmax[0], minmax[1], surfaceInfo.iso.spacing)
                        let iso = undefined
                        if (surfaceInfo.iso.useMinMax != undefined && surfaceInfo.iso.useMinMax === true) {
                            if (surfaceInfo.iso.spacing) {
                                isos = kepler.generateIsosBySpacing(surfaceInfo.iso.min, surfaceInfo.iso.max, surfaceInfo.iso.spacing)
                            }
                            else if (surfaceInfo.iso.nb) {
                                isos = kepler.generateIsos(surfaceInfo.iso.min, surfaceInfo.iso.max, surfaceInfo.iso.nb)
                            }
                            else if (surfaceInfo.iso.list) {
                                isos = kepler.generateIsos(surfaceInfo.iso.min, surfaceInfo.iso.max, surfaceInfo.iso.list)
                            }
                        }
                        else {
                            if (surfaceInfo.iso.spacing) {
                                isos = kepler.generateIsosBySpacing(minmax[0], minmax[1], surfaceInfo.iso.spacing)
                            }
                            else if (surfaceInfo.iso.nb) {
                                isos = kepler.generateIsos(minmax[0], minmax[1], surfaceInfo.iso.nb)
                            }
                            else if (surfaceInfo.iso.list) {
                                isos = kepler.generateIsos(minmax[0], minmax[1], surfaceInfo.iso.list)
                            }
                        }


                        if (surfaceInfo.iso.show && isos) {
                            const iso = kepler.createIsoContours(
                                surface,
                                attr, {
                                parameters: new kepler.IsoContoursParameters({
                                    color: '#ffffff',
                                    lineColor: '#000000',
                                    isoList: isos,
                                    filled: surfaceInfo.iso.showFill,
                                    lined: surfaceInfo.iso.showLines,
                                    opacity: surfaceInfo.iso.opacity,
                                    lut: surfaceInfo.lut,
                                    reverseLut: surfaceInfo.reverseLut,
                                    duplicateLut: surfaceInfo.duplicateLut,
                                    min: surfaceInfo.iso.min,
                                    max: surfaceInfo.iso.max
                                })
                            }
                            )
                            group.add(iso)

                            // const lut = kepler.createLut(surfaceInfo.lut, 64)
                            // const bar = new kepler.ColorBar2(500, 500, isos, lut)
                            // renderFct.add( bar.render )
                            // group.add(bar.scene)

                            // const cb = new kepler.Colorbar({
                            //     lutName: surfaceInfo.lut,
                            //     min: minmax[0],
                            //     max: minmax[1]
                            // })
                            // renderFct.add(cb.render)
                        }
                    }
                })
            })
        return promise
    }
}