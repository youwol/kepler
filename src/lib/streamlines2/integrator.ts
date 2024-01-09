import { Vector } from './Vector'
import { createLookupGrid } from './createLookupGrid'
import { rk4 } from './rk4'

enum State {
    FORWARD,
    BACKWARD,
    DONE,
}

export function createStreamlineIntegrator(
    start: Vector,
    grid: any,
    config: any,
) {
    const points = [start]
    let pos = start
    let state = State.FORWARD
    let candidate: any = null
    let lastCheckedSeed = -1
    const ownGrid = createLookupGrid(config.boundingBox, config.timeStep * 0.9)

    return {
        start: start,
        next: next,
        getStreamline: () => points,
        getNextValidSeed: getNextValidSeed,
    }

    //function getStreamline() {return points}

    function getNextValidSeed() {
        while (lastCheckedSeed < points.length - 1) {
            lastCheckedSeed += 1

            const p = points[lastCheckedSeed]
            const v = normalizedVectorField(p)
            if (!v) {
                continue
            }

            // Check one normal. We just set c = p + n, where n is orthogonal to v.
            // Since v is unit vector we can multiply it by scaler (config.dSep) to get to the
            // right point. It is also easy to find normal in 2d: normal to (x, y) is just (-y, x).
            // You can get it by applying 2d rotation matrix.)
            let cx = p.x - v.y * config.dSep
            let cy = p.y + v.x * config.dSep

            if (
                Array.isArray(config.seedArray) &&
                config.seedArray.length > 0
            ) {
                const seed = config.seedArray.shift()
                cx = seed.x
                cy = seed.y
            }

            if (!grid.isOutside(cx, cy) && !grid.isTaken(cx, cy, checkDSep)) {
                // this will let us check the other side. When we get back
                // into this method, the point `cx, cy` will be taken (by construction of another streamline)
                // And we will throw through to the next orthogonal check.
                lastCheckedSeed -= 1
                return new Vector(cx, cy)
            }

            // Check orthogonal coordinates on the other side (o = p - n).
            const ox = p.x + v.y * config.dSep
            const oy = p.y - v.x * config.dSep
            if (!grid.isOutside(ox, oy) && !grid.isTaken(ox, oy, checkDSep)) {
                return new Vector(ox, oy)
            }
        }
    }

    function checkDTest(distanceToCandidate: number) {
        if (isSame(distanceToCandidate, config.dTest)) {
            return false
        }
        return distanceToCandidate < config.dTest
    }

    function checkDSep(distanceToCandidate: number) {
        if (isSame(distanceToCandidate, config.dSep)) {
            return false
        }
        return distanceToCandidate < config.dSep
    }

    function next() {
        while (true) {
            candidate = null
            if (state === State.FORWARD) {
                const point = growForward()
                if (point) {
                    points.push(point)
                    ownGrid.occupyCoordinates(point)
                    pos = point
                    if (Number.isNaN(point.x) || Number.isNaN(point.y)) {
                        state = State.DONE
                        config.onPointAdded(undefined)
                        return true
                    } else {
                        const shouldPause = notifyPointAdded(point)
                        if (shouldPause) {
                            return
                        }
                    }
                } else {
                    // Reset position to start, and grow backwards:
                    if (config.forwardOnly) {
                        state = State.DONE
                    } else {
                        pos = start
                        state = State.BACKWARD
                        config.onPointAdded(undefined)
                    }
                }
            }
            if (state === State.BACKWARD) {
                const point = growBackward()
                if (point) {
                    points.unshift(point)
                    pos = point
                    ownGrid.occupyCoordinates(point)

                    if (Number.isNaN(point.x) || Number.isNaN(point.y)) {
                        state = State.DONE
                        config.onPointAdded(undefined)
                        return true
                    } else {
                        const shouldPause = notifyPointAdded(point)
                        if (shouldPause) {
                            return
                        }
                    }
                } else {
                    state = State.DONE
                }
            }
            if (state === State.DONE) {
                points.forEach(occupyPointInGrid)
                config.onPointAdded(undefined)
                return true
            }
        }
    }

    function occupyPointInGrid(p: Vector) {
        grid.occupyCoordinates(p)
    }

    function growForward() {
        const velocity = rk4(pos, config.timeStep, normalizedVectorField)
        if (!velocity) {
            return undefined // Hit the singularity.
        }
        return growByVelocity(pos, velocity)
    }

    function growBackward() {
        let velocity = rk4(pos, config.timeStep, normalizedVectorField)
        if (!velocity) {
            return undefined // Singularity
        }
        velocity = velocity.mulScalar(-1)
        return growByVelocity(pos, velocity)
    }

    function growByVelocity(pos: Vector, velocity: Vector) {
        candidate = pos.add(velocity)
        if (grid.isOutside(candidate.x, candidate.y)) {
            return undefined
        }
        if (grid.isTaken(candidate.x, candidate.y, checkDTest)) {
            return undefined
        }
        // did we hit any of our points?
        if (ownGrid.isTaken(candidate.x, candidate.y, timeStepCheck)) {
            return undefined
        }
        return candidate
    }

    function timeStepCheck(distanceToCandidate: number) {
        return distanceToCandidate < config.timeStep * 0.9
    }

    function notifyPointAdded(point: Vector) {
        let shouldPause = false
        if (config.onPointAdded) {
            const otherPoint =
                points[state === State.FORWARD ? points.length - 2 : 1]
            shouldPause = config.onPointAdded(point, otherPoint, config)
        }
        return shouldPause
    }

    function normalizedVectorField(P: Vector) {
        const p = config.vectorField(P)
        if (!p) {
            return
        } // Assume singularity
        if (Number.isNaN(p.x) || Number.isNaN(p.y)) {
            return undefined // Not defined. e.g. Math.log(-1);
        }

        let l = p.x * p.x + p.y * p.y
        if (l === 0) {
            return
        } // the same, singularity
        l = Math.sqrt(l)

        // We need normalized field.
        return new Vector(p.x / l, p.y / l)
    }
}

function isSame(a: number, b: number) {
    // to avoid floating point error
    return Math.abs(a - b) < 1e-4
}
