/**
 * @author daron1337 / http://daron1337.github.io/
 * @author fmaerten  / https://github.com/xaliphostes
 */

import { Color } from 'three'

/*
// generate a insar banded color table
//
const J = ['0x0500d5', '0x00baff', '0x00ffc6', '0xfcff00', '0xd00000']
const N = 10
const n = 5
const nn = N*n
const delta = 1/(nn-1)
let j = 0
for (let i=0; i<nn; ++i) {
    console.log('[' + i*delta + ', ' + J[j] + '],')
    ++j
    if (j>=5) j = 0
}
*/

export function generateColorMap(
    name: string,
    numberofcolors: number,
    duplicate: number,
) {
    const map = ColorMapKeywords[name] || ColorMapKeywords.Rainbow
    const newMap = []
    let start = 0
    for (let i = 0; i < duplicate; ++i) {
        map.forEach((m) => {
            newMap.push([start + m[0] / duplicate, m[1]])
        })
        start += 1 / duplicate
    }
    return new ColorMap(newMap, numberofcolors)
}

export function colorMapNames() {
    const names = []
    for (const [key, value] of Object.entries(ColorMapKeywords)) {
        names.push(key)
    }
    return names
}

export function addColorMap(
    colormapName: string,
    arrayOfColors: Array<[number, number]>,
) {
    ColorMapKeywords[colormapName] = arrayOfColors
}

/**
 * @category Color Lookup Table
 */
export class ColorMap {
    private map: any = []
    private lut: Array<Color> = []
    private n = 256
    private minV = 0
    private maxV = 1
    private canvas_: HTMLCanvasElement

    static addColorMap(
        colormapName: string,
        arrayOfColors: Array<[number, number]>,
    ) {
        ColorMapKeywords[colormapName] = arrayOfColors
    }

    constructor(
        colormap: string | Array<Array<number>>,
        numberofcolors: number,
    ) {
        this.setColorMap(colormap, numberofcolors)
    }

    get mapColors() {
        return this.map
    }

    get canvas() {
        return this.canvas_
    }

    set(value: any) {
        if (value instanceof ColorMap) {
            this.copy(value)
        }
        return this
    }

    get length() {
        return this.map.length
    }

    setMin(min: number) {
        this.minV = min
        return this
    }

    setMax(max: number) {
        this.maxV = max
        return this
    }

    setColorMap(colormap: any, numberofcolors: any) {
        if (Array.isArray(colormap)) {
            this.map = colormap
        } else {
            this.map = ColorMapKeywords[colormap] || ColorMapKeywords.Rainbow
        }

        this.n = numberofcolors || 32
        const step = 1.0 / this.n

        this.lut.length = 0

        for (let i = 0; i <= 1; i += step) {
            for (let j = 0; j < this.map.length - 1; j++) {
                if (i >= this.map[j][0] && i < this.map[j + 1][0]) {
                    const min = this.map[j][0]
                    const max = this.map[j + 1][0]
                    const minColor = new Color(this.map[j][1])
                    const maxColor = new Color(this.map[j + 1][1])
                    const color = minColor.lerp(
                        maxColor,
                        (i - min) / (max - min),
                    )
                    this.lut.push(color)
                }
            }
        }

        return this
    }

    copy(lut: any) {
        this.lut = lut.lut
        this.map = lut.map
        this.n = lut.n
        this.minV = lut.minV
        this.maxV = lut.maxV
        return this
    }

    getColor(alpha: number) {
        if (alpha <= this.minV) {
            alpha = this.minV
        } else if (alpha >= this.maxV) {
            alpha = this.maxV
        }

        alpha = (alpha - this.minV) / (this.maxV - this.minV)
        let colorPosition = Math.round(alpha * this.n)

        if (colorPosition === this.n) {
            colorPosition -= 1
        }

        return this.lut[colorPosition]
    }

    createCanvas(parent = document, width = 1) {
        const canvas = parent.createElement('canvas')
        canvas.width = width
        canvas.height = this.n
        this.updateCanvas(canvas)
        return canvas
    }

    updateCanvas(canvas: any) {
        this.canvas_ = canvas
        const ctx = canvas.getContext('2d', { alpha: false })

        /*
        let imageData = ctx.getImageData(0, 0, canvas.width, this.n)
        let data = imageData.data
        let k = 0
        let step = 1.0 / this.n
        for (let i = 1; i >= 0; i -= step) {
            for (let j = this.map.length - 1; j >= 0; j--) {
                if (i < this.map[ j ][ 0 ] && i >= this.map[ j - 1 ][ 0 ]) {
                    let min = this.map[ j - 1 ][ 0 ]
                    let max = this.map[ j ][ 0 ]
                    let minColor = new Color(this.map[ j - 1 ][ 1 ])
                    let maxColor = new Color(this.map[ j ][ 1 ])
                    let color = minColor.lerp(maxColor, (i - min) / (max - min))
                    data[ k * 4     ] = Math.round(color.r * 255)
                    data[ k * 4 + 1 ] = Math.round(color.g * 255)
                    data[ k * 4 + 2 ] = Math.round(color.b * 255)
                    data[ k * 4 + 3 ] = 255
                    k += 1
                }
            }
        }
        ctx.putImageData(imageData, 0, 0)
        */

        let k = 0
        const step = 1.0 / this.n
        for (let i = 1; i >= 0; i -= step) {
            for (let j = this.map.length - 1; j >= 0; j--) {
                if (i < this.map[j][0] && i >= this.map[j - 1][0]) {
                    const min = this.map[j - 1][0]
                    const max = this.map[j][0]
                    const minColor = new Color(this.map[j - 1][1])
                    const maxColor = new Color(this.map[j][1])
                    const color = minColor.lerp(
                        maxColor,
                        (i - min) / (max - min),
                    )
                    ctx.fillStyle = `rgb(${Math.round(
                        color.r * 255,
                    )}, ${Math.round(color.g * 255)}, ${Math.round(
                        color.b * 255,
                    )})`
                    ctx.fillRect(0, k, 15, 1)
                    k += 1
                }
            }
        }

        return canvas
    }
}

const ColorMapKeywords = {
    Cooltowarm: [
        [0.0, 0x3c4ec2],
        [0.2, 0x9bbcff],
        [0.5, 0xdcdcdc],
        [0.8, 0xf6a385],
        [1.0, 0xb40426],
    ],

    Blackbody: [
        [0.0, 0x000000],
        [0.2, 0x780000],
        [0.5, 0xe63200],
        [0.8, 0xffff00],
        [1.0, 0xffffff],
    ],

    Grayscale: [
        [0.0, 0x000000],
        [0.2, 0x404040],
        [0.5, 0x7f7f80],
        [0.8, 0xbfbfbf],
        [1.0, 0xffffff],
    ],

    Insar: [
        [0.0, 0x0500d5],
        [0.3, 0x00baff],
        [0.5, 0x00ffc6],
        [0.7, 0xfcff00],
        [1.0, 0xd00000],
    ],

    InsarBanded: [
        [0, 0x0500d5],
        [0.02040816326530612, 0x00baff],
        [0.04081632653061224, 0x00ffc6],
        [0.061224489795918366, 0xfcff00],
        [0.08163265306122448, 0xd00000],
        [0.1020408163265306, 0x0500d5],
        [0.12244897959183673, 0x00baff],
        [0.14285714285714285, 0x00ffc6],
        [0.16326530612244897, 0xfcff00],
        [0.18367346938775508, 0xd00000],
        [0.2040816326530612, 0x0500d5],
        [0.22448979591836732, 0x00baff],
        [0.24489795918367346, 0x00ffc6],
        [0.26530612244897955, 0xfcff00],
        [0.2857142857142857, 0xd00000],
        [0.3061224489795918, 0x0500d5],
        [0.32653061224489793, 0x00baff],
        [0.3469387755102041, 0x00ffc6],
        [0.36734693877551017, 0xfcff00],
        [0.3877551020408163, 0xd00000],
        [0.4081632653061224, 0x0500d5],
        [0.42857142857142855, 0x00baff],
        [0.44897959183673464, 0x00ffc6],
        [0.4693877551020408, 0xfcff00],
        [0.4897959183673469, 0xd00000],
        [0.5102040816326531, 0x0500d5],
        [0.5306122448979591, 0x00baff],
        [0.5510204081632653, 0x00ffc6],
        [0.5714285714285714, 0xfcff00],
        [0.5918367346938775, 0xd00000],
        [0.6122448979591836, 0x0500d5],
        [0.6326530612244897, 0x00baff],
        [0.6530612244897959, 0x00ffc6],
        [0.673469387755102, 0xfcff00],
        [0.6938775510204082, 0xd00000],
        [0.7142857142857142, 0x0500d5],
        [0.7346938775510203, 0x00baff],
        [0.7551020408163265, 0x00ffc6],
        [0.7755102040816326, 0xfcff00],
        [0.7959183673469387, 0xd00000],
        [0.8163265306122448, 0x0500d5],
        [0.836734693877551, 0x00baff],
        [0.8571428571428571, 0x00ffc6],
        [0.8775510204081632, 0xfcff00],
        [0.8979591836734693, 0xd00000],
        [0.9183673469387754, 0x0500d5],
        [0.9387755102040816, 0x00baff],
        [0.9591836734693877, 0x00ffc6],
        [0.9795918367346939, 0xfcff00],
        [0.9999999999999999, 0xd00000],
    ],

    Rainbow: [
        [0.0, 0xff0000],
        [0.2, 0xfffc00],
        [0.4, 0x00ff06],
        [0.6, 0x00fffc],
        [0.8, 0x0600ff],
        [1.0, 0xf600ff],
    ],

    Igeoss: [
        [0.0, 0x003627],
        [0.1, 0x008a3b],
        [0.2, 0x68be0d],
        [0.3, 0xd6df00],
        [0.4, 0xfad000],
        [0.5, 0xffc010],
        [0.6, 0xffae0e],
        [0.7, 0xff9b06],
        [0.8, 0xfa5800],
        [0.9, 0xe80008],
        [1.0, 0x880003],
    ],

    Stress: [
        [0.0, 0x0000ff],
        [0.33, 0xffffff],
        [0.331, 0x00c800],
        [0.66, 0xffffff],
        [0.661, 0xff0000],
        [1.0, 0xffffff],
    ],

    Blue_White_Red: [
        [0.0, 0x0012ff],
        [0.5, 0xffffff],
        [1.0, 0xff0000],
    ],

    Blue_Green_Red: [
        [0.0, 0x0012ff],
        [0.25, 0xffffff],
        [0.5, 0x00ff00],
        [0.275, 0xffffff],
        [1.0, 0xff0000],
    ],

    Spectrum: [
        [0.0, 0xffffff],
        [0.1428, 0xff0000],
        [0.2856, 0xff00fc],
        [0.4284, 0x0600ff],
        [0.5712, 0x00f6ff],
        [0.714, 0x00ff06],
        [0.8568, 0xfffc00],
        [1.0, 0xff0000],
    ],

    Default: [
        [0.0, 0x0c00ff],
        [0.25, 0x00fcff],
        [0.5, 0x00ff0c],
        [0.75, 0xf6ff00],
        [1.0, 0xff0000],
    ],

    Banded: [
        [0.0, 0xfff5cd],
        [0.1666, 0xff9600],
        [0.1667, 0xceffd1],
        [0.3333, 0x107100],
        [0.3334, 0xd4e4fb],
        [0.5, 0x015faf],
        [0.5001, 0xebdefb],
        [0.6666, 0xc5029e],
        [0.6667, 0xfff0cb],
        [0.8333, 0x845d00],
        [0.8334, 0xf9d8d8],
        [1.0, 0xda0000],
    ],
}
