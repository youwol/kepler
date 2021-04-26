import { SkinParameters } from "./skinParameters"

/**
 * @see [[createIsoContourFilled]]
 * @see [[createIsoContourLines]]
 * @see [[createIsoContours]]
 * @category Skin Parameters
 */
export class IsoContoursParameters extends SkinParameters {
    public readonly filled     : boolean = true

    public readonly color      : string = '#000000'
    public readonly nbr        : number = 10
    public readonly min        : number = 0
    public readonly max        : number = 1

    public readonly opacity    : number = 1
    public readonly lut        : string = 'Rainbow'
    public readonly lockLut    : boolean = true
    public readonly reversedLut: boolean

    constructor(
        {
            filled=true, nbr=10, min=0, max=1, color,
            lut, 
            lockLut, 
            opacity,
            reversedLut, ...others
        } : {
            filled?: boolean, nbr?: number, min?: number, max?: number, color?: string,
            lut?: string, 
            lockLut?: boolean, 
            opacity?: number,
            reversedLut?: boolean
        } = {})
    {
        super(others)

        if (filled !== undefined) this.filled = filled

        this.color = (color!==undefined?color:'#000000')
        this.nbr = (nbr!==undefined?nbr:10)
        this.min = (min!==undefined?min:0 )
        this.max = (max!==undefined?max:1 )

        this.set('lockLut', lockLut)
        this.set('reversedLut', reversedLut)
        this.lut = lut || 'Rainbow'
        if (lut !== undefined) this.lut = lut
        if (opacity !== undefined) this.opacity = opacity
    }
}
