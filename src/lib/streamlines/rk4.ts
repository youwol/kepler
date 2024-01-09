/**
 * Performs Runge-Kutta 4th order integration.
 */

export function rk4(point, timeStep, getVelocity) {
    const k1 = getVelocity(point)
    if (!k1) {
        return
    }
    const k2 = getVelocity(point.add(k1.mulScalar(timeStep * 0.5)))
    if (!k2) {
        return
    }
    const k3 = getVelocity(point.add(k2.mulScalar(timeStep * 0.5)))
    if (!k3) {
        return
    }
    const k4 = getVelocity(point.add(k3.mulScalar(timeStep)))
    if (!k4) {
        return
    }

    const res = k1
        .mulScalar(timeStep / 6)
        .add(k2.mulScalar(timeStep / 3))
        .add(k3.mulScalar(timeStep / 3))
        .add(k4.mulScalar(timeStep / 6))
    return res
}
