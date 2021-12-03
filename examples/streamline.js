const kepler    = require('../dist/@youwol/kepler')
const dataframe = require('@youwol/dataframe')
const geometry  = require('../../geometry/dist/@youwol/geometry')
const io        = require('@youwol/io')
const math      = require('@youwol/math')
const fs        = require('fs')


class StreamStringPL {
    constructor() {
        this.buffer = `GOCAD PLine 1.0
HEADER {
    name: streamlines
}
ILINE
`
        this.beginId = 0
        this.endId   = 0
    }
    write(s)   { if (s !== undefined) { this.buffer += s } }
    writeln(s) { this.write(s); this.write('\n') }
    //end() {}

    // add2PointsIn3D(x1, y1, z1, x2, y2, z2) {
    //     this.writeln(`VRTX ${this.endId} ${x1} ${y1} ${z1}`)
    //     this.writeln(`VRTX ${this.endId+1} ${x2} ${y2} ${z2}`)
    //     this.endId += 2
    // }
    addPoint(x, y, z) {
        this.writeln(`VRTX ${this.endId} ${x} ${y} ${z}`)
        this.endId += 1
    }
    endLine() {
        for (let i=this.beginId; i<this.endId; i+=2) {
            this.writeln(`SEG ${i} ${i+1}`)
        }
        this.beginId = this.endId
        this.writeln('ILINE')
    }
    endConstruction() {
        this.writeln('END')
    }
}

class Streamline {
    constructor() {
        this.positions = []
        this.indices   = []
    }
    addPoints(x1, y1, z1, x2, y2, z2) {
        this.positions.push(x1, y1, z1,  x2, y2, z2) // add the z coord
        this.indices.push(this.positions.length-2, this.positions.length-1)
    }
}

class Interpolator {
    constructor(dataframe, nx, ny, name) {
        this.dataframe = dataframe
        this.bg = geometry.createBackgroundGrid2D({
            position: dataframe.series.positions,
            indices : dataframe.series.indices,
            dims: [nx, ny]
        })
        this.field = dataframe.series[name]
        console.log('using the vector field', name)
    }

    interpolate(p) {
        let sol = this.bg.candidates(p)
        if (sol && sol.length) {
            const unity = coord => coord>=0 && coord<=1
            const inTriangle = (p, p1, p2, p3) => {
                const w = math.barycentric2(p, p1, p2, p3)
                return unity(w[0]) && unity(w[1]) && unity(w[2])
            }

            let S = undefined
            sol.forEach( s => {
                const index = s.obj
                const cell = this.dataframe.series.indices.itemAt(index)
                const p1 = this.dataframe.series.positions.itemAt(cell[0])
                const p2 = this.dataframe.series.positions.itemAt(cell[1])
                const p3 = this.dataframe.series.positions.itemAt(cell[2])
                if (inTriangle(p, p1, p2, p3)) {
                    const q1 = this.field.itemAt(cell[0])
                    const q2 = this.field.itemAt(cell[1])
                    const q3 = this.field.itemAt(cell[2])
                    //console.log(q1, q2, q3)
                    const v = math.triangleLerp2D(
                        [p[0],p[1]], 
                        [p1[0],p1[1]], [p2[0],p2[1]], [p3[0],p3[1]],
                        q1, q2, q3
                    )
                    if (S === undefined) S = v
                }
            })
            return S
        }
        return undefined
    }
}

class Streamlines {
    constructor(origin, scaling) {
        this.streamlines   = []
        this.curStreamline = undefined
        //this.gridHelper    = undefined
        this.interpolator    = undefined
        this.bbox          = undefined
        this.origin        = origin
        this.scaling       = scaling

        this.distanceStreamlines = 0.2
        this.distanceStop        = 0.1
        this.timeStep            = 0.01
        this.stepsPerIteration   = 30
        this.forwardOnly         = false
    }

    get lines() {
        const r = Array(this.streamlines.length).fill(undefined)
        this.streamlines.forEach( (streamline, j) => {
            r[j] = {
                position: streamline.positions,
                index  : streamline.indices
            }
        })
        return r
    }

    initialise(bbox, interpolator) {
        this.interpolator = interpolator
        this.bbox = bbox
        this.beginConstruction()
    }
    
    get stringBuffer() {
        const stream = new StreamStringPL()
        this.streamlines.forEach( (streamline, j) => {
            const p = streamline.positions
            const count = p.length/3
            for (let i=0; i<count; ++i) {
                stream.addPoint(p[3*i], p[3*i+1], p[3*i+2])
            }
            stream.endLine()
        })
        stream.endConstruction()
        return stream.buffer
    }

    run() {
        const seedPoint = {
            x: this.bbox.left + Math.random() * this.bbox.width,
            y: this.bbox.top  + Math.random() * this.bbox.height
        }

        const computer = kepler.streamlines2D({
            vectorField: p => {
                // WARNING: WE INVERTED  the x and y !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const v = this.interpolator.interpolate([p.y, p.x])

                if (v === undefined) return undefined
                return {
                    x: v[0],
                    y: v[1]
                }
            },
            // Defines the first point where integration should start. If this is
            // not specified a random point inside boundingBox is selected
            // You can pass array of seed points, they are going to be used one by one
            // if they satisfy the rules.
            seed                : seedPoint,
            // Defines bounding box of the vector field
            boundingBox         : this.bbox,
            stepsPerIteration   : this.stepsPerIteration,
            // Integration time step (passed to RK4 method)
            timeStep            : this.timeStep,
            // Separation distance between new streamlines
            dSep                : this.distanceStreamlines,
            // Distance between streamlines when integration should stop
            dTest               : this.distanceStop,
            // If set to true, lines are going to be drawn from the seed points
            // only in the direction of the vector field
            forwardOnly: false,

            onPointAdded: (a,b) => {
                if (a === undefined) {
                    this.endLine()
                } else {
                    this.add2Points(a.x, a.y, b.x, b.y)
                }
            }
        })
        computer.run()

        this.endConstruction()
    }

    // ---------------------------------------

    beginConstruction() {
        this.streamlines = []
    }

    endConstruction() {
    }

    // In normalized world.
    add2Points(x1, y1, x2, y2) {
        if (this.curStreamline === undefined) {
            this.curStreamline = new Streamline()
            this.streamlines.push(this.curStreamline)
        }
        //this.curStreamline.addPoints(x1, y1, x2, y2)
        this.curStreamline.addPoints(
            this.origin[0] + x1*this.scaling[0], this.origin[1] + y1*this.scaling[1], this.origin[2],
            this.origin[0] + x2*this.scaling[0], this.origin[1] + y2*this.scaling[1], this.origin[2])
    }

    endLine() {
        this.curStreamline = undefined
    }
}

/**
 * @param {number[]} positions
 * @param {AttributeManager} manager 
 * @param {string|string[]} name The name(s) of the vector field(s)
 * @param {number} nx The number of points along the x-axis
 * @param {number} ny The number of points along the y-axis
 * @param {number} distanceStreamlines 0.2 by default
 * @param {number} distanceStop 0.2 by default
 * @param {number} timeStep 0.1 by default
 * @param {number} stepsPerIteration 30 by default
 * @param {boolean} forwardOnly false by default
 */
function createStreamLinesFrom2DGrid({
    dataframe,
    fieldName,
    nx, ny, 
    distanceStreamlines = 0.2, 
    distanceStop        = 0.2, 
    timeStep            = 0.1, 
    stepsPerIteration   = 30,
    forwardOnly         = false
}) {
    function normalizeObject(positions, scale) {
        const m = math.minMax(positions)
        const Xo     = m[0]
        const Yo     = m[1]
        const Zo     = m[2]
        let Dx = (m[3] - m[0])/scale
        let Dy = (m[4] - m[1])/scale
        let Dz = (m[5] - m[2])/scale
        if (Dz===0) Dz = 1
        return {
            origin: [Xo, Yo, Zo],
            scale : [Dx, Dy, Dz]
        }
    }

    const scale = 10
    let sizes = normalizeObject(dataframe.series.positions, scale)
    let bbox  = {left: 0, top: 0, width : scale, height: scale}

    dataframe.series.positions = dataframe.series.positions.map( p => {
        return [
            (p[0]-sizes.origin[0])/sizes.scale[0]*scale,
            (p[1]-sizes.origin[1])/sizes.scale[1]*scale,
            (p[2]-sizes.origin[2])/sizes.scale[2]*scale
        ]
    })
    
    const positions = dataframe.series.positions

    // normalize coordinates just to see
    console.log(sizes)
    console.log(bbox)
    console.log('')

    const stream = new Streamlines(sizes.origin, sizes.scale)
    stream.distanceStreamlines = distanceStreamlines
    stream.distanceStop        = distanceStop
    stream.timeStep            = timeStep
    stream.stepsPerIteration   = stepsPerIteration
    stream.forwardOnly         = forwardOnly

    // WARNING: WE INVERTED  nx and ny !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // IN ORDER TO MAKE IT WORKS
    //const gridHelper = new geometry.Grid2DHelper([0, 0], [scale,scale], ny, nx, 1e-1)

    const interpolator = new Interpolator(dataframe, nx, ny, fieldName)

    stream.initialise(bbox, interpolator)
    stream.run()

    console.log('generated', stream.streamlines.length, 'streamlines')
    
    return stream
}
// ============================================================

const models  = [
    {
        path: '/Users/fmaerten/data/arch/spanish-peak/',
        input: 'forward-grid.ts',
        name: 'Joint',
        nx: 50,
        ny: 50
    }
]

const modelID = 0

const model  = models[modelID]
const input  = model.input


// const loader = io.LoaderFactory.fromFile(input)
// const object = loader.parse( fs.readFileSync(input, 'utf8') )[0]

const object = io.decodeGocadTS( fs.readFileSync(model.path + model.input, 'utf8') )[0]
if (object.series[model.name] === undefined) throw new Error('attribute',model.name,'is undefined')

const stream = createStreamLinesFrom2DGrid({
    dataframe: object,
    fieldName: model.name,
    nx: model.nx,
    ny: model.ny,
    distanceStreamlines: 0.2,
    distanceStop       : 0.1,
    timeStep           : 0.1,
    stepsPerIteration  : 30,
    forwardOnly: true
})

fs.writeFile(model.path + 'steamlines.pl', stream.stringBuffer, err => {} )

