import { Vector } from './Vector'
import { rk4 } from './rk4'
import { createLookupGrid } from './createLookupGrid'

const FORWARD = 1
const BACKWARD = 2
const DONE = 3

export function createStreamlineIntegrator(start, grid, config) {
    const points = [start]
    let pos = start
    let state = FORWARD
    let candidate = null
    let lastCheckedSeed = -1
    const ownGrid = createLookupGrid(config.boundingBox, config.timeStep * 0.9)

    return {
        start: start,
        next: next,
        getStreamline: getStreamline,
        getNextValidSeed: getNextValidSeed,
    }

    function getStreamline() {
        return points
    }

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

    function checkDTest(distanceToCandidate) {
        if (isSame(distanceToCandidate, config.dTest)) {
            return false
        }
        return distanceToCandidate < config.dTest
    }

    function checkDSep(distanceToCandidate) {
        if (isSame(distanceToCandidate, config.dSep)) {
            return false
        }

        return distanceToCandidate < config.dSep
    }

    function next() {
        while (true) {
            candidate = null
            if (state === FORWARD) {
                var point = growForward()
                if (point) {
                    points.push(point)
                    ownGrid.occupyCoordinates(point)
                    pos = point
                    var shouldPause = notifyPointAdded(point)
                    if (shouldPause) {
                        return
                    }
                } else {
                    // Reset position to start, and grow backwards:
                    if (config.forwardOnly) {
                        state = DONE
                    } else {
                        pos = start
                        state = BACKWARD
                    }
                }
            }
            if (state === BACKWARD) {
                var point = growBackward()
                if (point) {
                    points.unshift(point)
                    pos = point
                    ownGrid.occupyCoordinates(point)

                    var shouldPause = notifyPointAdded(point)
                    if (shouldPause) {
                        return
                    }
                } else {
                    state = DONE
                }
            }

            if (state === DONE) {
                points.forEach(occupyPointInGrid)
                return true
            }
        }
    }

    function occupyPointInGrid(p) {
        grid.occupyCoordinates(p)
    }

    function growForward() {
        const velocity = rk4(pos, config.timeStep, normalizedVectorField)
        if (!velocity) {
            return
        } // Hit the singularity.

        return growByVelocity(pos, velocity)
    }

    function growBackward() {
        let velocity = rk4(pos, config.timeStep, normalizedVectorField)
        if (!velocity) {
            return
        } // Singularity
        velocity = velocity.mulScalar(-1)

        return growByVelocity(pos, velocity)
    }

    function growByVelocity(pos, velocity) {
        candidate = pos.add(velocity)
        if (grid.isOutside(candidate.x, candidate.y)) {
            return
        }
        if (grid.isTaken(candidate.x, candidate.y, checkDTest)) {
            return
        }

        // did we hit any of our points?
        if (ownGrid.isTaken(candidate.x, candidate.y, timeStepCheck)) {
            return
        }
        // for (var i = 0; i < points.length; ++i) {
        //   if (points[i].distanceTo(candidate) < config.timeStep * 0.9) return;
        // }

        return candidate
    }

    function timeStepCheck(distanceToCandidate) {
        return distanceToCandidate < config.timeStep * 0.9
    }

    function notifyPointAdded(point) {
        let shouldPause = false
        if (config.onPointAdded) {
            shouldPause = config.onPointAdded(
                point,
                points[state === FORWARD ? points.length - 2 : 1],
                config,
                points,
            )
        }

        return shouldPause
    }

    function normalizedVectorField(p) {
        var p = config.vectorField(p, points, state === DONE)
        if (!p) {
            return
        } // Assume singularity
        if (Number.isNaN(p.x) || Number.isNaN(p.y)) {
            return
        } // Not defined. e.g. Math.log(-1);

        let l = p.x * p.x + p.y * p.y

        if (l === 0) {
            return
        } // the same, singularity
        l = Math.sqrt(l)

        // We need normalized field.
        return new Vector(p.x / l, p.y / l)
    }
}

function isSame(a, b) {
    // to avoid floating point error
    return Math.abs(a - b) < 1e-4
}
