import { SkinParameters } from "./skinParameters"

/**
 * @see [[createIsoContourFilled]]
 * @see [[createIsoContourLines]]
 * @see [[createIsoContours]]
 * @category Skin Parameters
 */
export class IsoContoursParameters extends SkinParameters {
    public readonly filled     : boolean = true
    public readonly lined      : boolean = true
    public readonly useTable   : boolean = true

    public readonly color      : string = '#ffffff'
    public readonly lineColor  : string = '#000000'
    public readonly min        : number = Number.NEGATIVE_INFINITY
    public readonly max        : number = Number.POSITIVE_INFINITY
    public readonly isoList    : number[] = []

    public readonly opacity    : number = 1
    public readonly lut        : string = 'Rainbow'
    public readonly duplicateLut: number = 1
    public readonly lockLut    : boolean = true
    public readonly reversedLut: boolean

    constructor(
        {
            isoList,
            filled=true,
            lined=false, 
            min=Number.NEGATIVE_INFINITY, 
            max=Number.POSITIVE_INFINITY, 
            color,
            lineColor,
            lut,
            duplicateLut,
            lockLut, 
            opacity,
            reversedLut, ...others
        } : {
            isoList: number[],
            filled?: boolean,
            lined?:boolean, 
            min?: number, 
            max?: number, 
            color?: string,
            lineColor?: string,
            lut?: string,
            duplicateLut?: number, 
            lockLut?: boolean, 
            opacity?: number,
            reversedLut?: boolean
        })
    {
        super(others)

        if (filled !== undefined) this.filled = filled
        if (lined !== undefined) this.lined = lined

        this.isoList = isoList

        this.color = (color!==undefined?color:'#000000')
        this.lineColor = (lineColor!==undefined?lineColor:'#000000')
        this.min = (min!==undefined?min:Number.NEGATIVE_INFINITY )
        this.max = (max!==undefined?max:Number.POSITIVE_INFINITY )

        this.set('lockLut', lockLut)
        this.set('reversedLut', reversedLut)
        this.lut = lut || 'Rainbow'
        if (duplicateLut !== undefined) this.duplicateLut = duplicateLut
        if (lut !== undefined) this.lut = lut
        if (opacity !== undefined) this.opacity = opacity
    }
}
