const nx = 5
const ny = 3
const nz = 2

const unflat2d = (l: number) => {
    const di = l / ny
    const i = Math.trunc(di)

    const j = ny * (di - i)
    return { i: Math.round(i), j: Math.round(j) }
}

const unflat3d = (l: number) => {
    const di = l / ny / nz
    const i = Math.trunc(di)

    const m = ny * nz * (di - i)
    const dj = m / nz
    const j = Math.trunc(dj)

    const k = nz * (dj - j)

    return { i: Math.round(i), j: Math.round(j), k: Math.round(k) }
}

for (let i = 0; i < nx * ny * nz; ++i) {
    console.log(i, unflat3d(i))
}

for (let i = 0; i < nx * ny; ++i) {
    //console.log(i, unflat2d(i) )
}

// ---------------------------------------------
