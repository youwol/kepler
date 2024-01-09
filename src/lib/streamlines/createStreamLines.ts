import { computeStreamlines } from './computeStreamLines'
import { Serie } from '@youwol/dataframe'
import { Quadtree } from './quadtree/quadtree'

/**
 * The streamlines parameters
 */
export class StreamLinesParameters {
    seed: Point2D
    dTest: number
    dSep: number
    timeStep: number
    forwardOnly: boolean
    //onPointAddedCB: Function
    onStreamlineAddedCB: Function

    constructor({
        onStreamlineAddedCB,
        seed,
        dTest = 0.25,
        dSep = 0.5,
        timeStep = 0.01,
        forwardOnly = false,
    }: {
        onStreamlineAddedCB: Function
        seed?: Point2D
        dTest?: number
        dSep?: number
        timeStep?: number
        forwardOnly?: boolean
    }) {
        this.seed = seed
        this.dTest = dTest
        this.dSep = dSep
        this.timeStep = timeStep
        this.forwardOnly = forwardOnly !== undefined ? forwardOnly : false
        this.onStreamlineAddedCB = onStreamlineAddedCB
    }
}

/**
 * @param positions The geometry of the mesh
 * @param indices   The topology of the mesh
 * @param field     The vector field
 * @param params    The parameters
 */
export function createStreamLines(
    positions: Serie,
    indices: Serie,
    field: Serie,
    params: StreamLinesParameters,
) {
    if (field.itemSize !== 3) {
        throw new Error('itemSize of vector field should be 3')
    }
    // Need now a fast algo to locate the traingle (or not) that intersect a given point P
    // Have to use a background grid (or an Octree or a Quadtree)
    // Also, have a look at createLookupGrid in this folder

    if (params.onStreamlineAddedCB === undefined)
        throw new Error('onStreamlineAddedCB must be set for streamlines')

    const bboxs = bboxSerie(positions)

    const qt = new Quadtree(
        {
            x: bboxs.x,
            y: bboxs.y,
            width: bboxs.width,
            height: bboxs.height,
        },
        indices.count,
    )

    let wMin = 1e32
    let hMin = 1e32
    indices.forEach((t) => {
        const T = bbox(positions, t[0], t[1], t[2])
        if (T.width < wMin) wMin = T.width
        if (T.height < hMin) hMin = T.height
        qt.insert(T)
    })

    wMin /= 10
    hMin /= 10

    if (params.seed === undefined) {
        //const index = Math.trunc((Math.random()*positions.count))
        //const p = positions.itemAt(index)
        params.seed = {
            x: bboxs.x + bboxs.width / 2,
            y: bboxs.y + bboxs.height / 2,
        }
    }

    return computeStreamlines({
        vectorField(p: Point2D) {
            const t = qt.retrieve({ x: p.x, y: p.y, width: wMin, height: hMin })
            if (t.length === 0) return undefined

            const tt = t[0]
            const i1 = tt.i1
            const i2 = tt.i2
            const i3 = tt.i3

            return triangleLerp2D(
                p,
                position2D(i1, positions),
                position2D(i2, positions),
                position2D(i3, positions),
                field.itemAt(i1) as number[],
                field.itemAt(i2) as number[],
                field.itemAt(i3) as number[],
            )
        },
        boundingBox: bboxs,
        seed: params.seed,
        dSep: params.dSep,
        dTest: params.dTest,
        timeStep: params.timeStep,
        forwardOnly: params.forwardOnly,
        // onPointAdded(from, to) {
        //     // called when new point is added to a line
        //     console.log("point created", from, to);
        // },
        onStreamlineAdded(points) {
            params.onStreamlineAddedCB(points)
        },
    }).run()
}

// ==========================================================================================

interface Point2D {
    x: number
    y: number
}

interface Rect {
    x: number
    y: number
    // top is the same as y for compatibility reason between streamline and quadtree
    top: number
    // left is the same as x for compatibility reason between streamline and quadtree
    left: number
    width: number
    height: number
}

interface Triangle extends Rect {
    i1: number
    i2: number
    i3: number
}

const bboxSerie = (positions: Serie): Rect => {
    const b = {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        width: 0,
        height: 0,
    }

    let maxX = -1e32
    let maxY = -1e32
    positions.forEach((p) => {
        if (p[0] < b.x) b.x = p[0]
        if (p[0] > maxX) maxX = p[0]
        if (p[1] < b.y) b.y = p[1]
        if (p[1] > maxY) maxY = p[1]
    })
    b.width = maxX - b.x
    b.height = maxY - b.y

    b.left = b.x
    b.top = b.y

    return b
}

// bbox of a triangle
const bbox = (
    positions: Serie,
    i1: number,
    i2: number,
    i3: number,
): Triangle => {
    const p1 = positions.itemAt(i1)
    const p2 = positions.itemAt(i2)
    const p3 = positions.itemAt(i3)
    const sx1 = p1[0]
    const sy1 = p1[1]
    const sx2 = p2[0]
    const sy2 = p2[1]
    const sx3 = p3[0]
    const sy3 = p3[1]
    const xmax = sx1 > sx2 ? (sx1 > sx3 ? sx1 : sx3) : sx2 > sx3 ? sx2 : sx3
    const ymax = sy1 > sy2 ? (sy1 > sy3 ? sy1 : sy3) : sy2 > sy3 ? sy2 : sy3
    const xmin = sx1 < sx2 ? (sx1 < sx3 ? sx1 : sx3) : sx2 < sx3 ? sx2 : sx3
    const ymin = sy1 < sy2 ? (sy1 < sy3 ? sy1 : sy3) : sy2 < sy3 ? sy2 : sy3
    return {
        i1,
        i2,
        i3,
        x: xmin,
        y: ymin,
        top: ymin,
        left: xmin,
        width: xmax - xmin,
        height: ymax - ymin,
    }
}

const position2D = (index: number, positions: Serie): Point2D => {
    const p = positions.itemAt(index)
    return { x: p[0], y: p[1] }
}

const dot2 = (a: number[], b: number[]): number =>
    a.reduce((acc, cur, i) => acc + cur * b[i])

const from2 = (a: Point2D, b: Point2D): number[] => [b.x - a.x, b.y - a.y]

function barycentric2(
    p: Point2D,
    a: Point2D,
    b: Point2D,
    c: Point2D,
): number[] {
    const v0 = from2(a, b)
    const v1 = from2(a, c)
    const Vector2 = from2(a, p)
    const d00 = dot2(v0, v0)
    const d01 = dot2(v0, v1)
    const d11 = dot2(v1, v1)
    const d20 = dot2(Vector2, v0)
    const d21 = dot2(Vector2, v1)
    const denom = 1 / (d00 * d11 - d01 * d01)
    const v = (d11 * d20 - d01 * d21) * denom
    const w = (d00 * d21 - d01 * d20) * denom
    const u = 1 - v - w
    return [u, v, w]
}

function triangleLerp2D(
    p: Point2D,
    p1: Point2D,
    p2: Point2D,
    p3: Point2D,
    q1: number[],
    q2: number[],
    q3: number[],
) {
    const uvw = barycentric2(p, p1, p2, p3)
    return {
        x: q1[0] * uvw[0] + q2[0] * uvw[1] + q3[0] * uvw[2],
        y: q1[1] * uvw[0] + q2[1] * uvw[1] + q3[1] * uvw[2],
    }
}
