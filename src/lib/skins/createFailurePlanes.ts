import { DataFrame, Manager, Serie } from "@youwol/dataframe"
import {
    Box3, BufferAttribute, BufferGeometry, CircleBufferGeometry, 
    Color, DoubleSide, Float32BufferAttribute, Material, Matrix4, Mesh, MeshPhongMaterial, MeshStandardMaterial, 
    PlaneBufferGeometry, Quaternion, Vector3
} from "three"
import { fromValuesToColors, mergeBufferGeometries } from "../utils"
import { PaintParameters } from "./paintAttribute"
import { ComponentDecomposer, EigenValuesDecomposer, eigenVector, minMax } from '@youwol/math'


export enum FractureType {
    JOINT,
    STYLOLITE,
    FAULT,
    DYKE
}

export class FailurePlanesParameters extends PaintParameters {
    public readonly type            : FractureType
    public readonly circle          : boolean
    public readonly color           : string
    public readonly friction        : number
    public readonly borders         : boolean
    public readonly size            : number
    public readonly stress          : string
    public readonly paintAttribute  : string
    public readonly sizeAttribute   : string

    constructor(
        {paintAttribute='',type, circle=true, color='#aaaaaa', friction=30, borders=false, size=1, stress='stress', sizeAttribute='', ...others}:
        {paintAttribute?: string, type?: FractureType, circle?: boolean, color?: string, friction?: number, borders?: boolean, size?: number, stress?: string, sizeAttribute?: string} = {})
    {
        super(others as any)
        this.type     = type !== undefined ? type : FractureType.JOINT
        this.color    = color || '#aaaaaa'
        this.friction = friction !== undefined ? friction : 0.3
        this.size     = size !== undefined ? size : 10
        this.stress   = stress
        this.sizeAttribute = sizeAttribute
        this.circle = circle!==undefined?circle:true
        this.borders = borders!==undefined?borders:false
        this.paintAttribute = paintAttribute!== undefined?paintAttribute:''
    }
}

export function createFailurePlanes(
    {geometry,  material, dataframe, parameters}:
    {geometry: BufferGeometry, material?: Material, dataframe: DataFrame, parameters?: FailurePlanesParameters})
{
    const position = geometry.getAttribute('position')
    if (position === undefined) throw new Error('geometry.position is undefined')

    const stress = dataframe.series[parameters.stress]
    if (stress === undefined) throw new Error('stress Serie is undefined')

    const bbox = new Box3().setFromBufferAttribute(position as BufferAttribute)
    const size   = bbox.getSize(new Vector3())
    const eltSize = Math.max(size.x, size.y, size.z)/50
    const defaultSize = eltSize * parameters.size / 100
    const minSize = eltSize * .1

    let fricAngle = parameters.friction*Math.PI/180.
    if (parameters.type !== FractureType.FAULT) {
        fricAngle = 0
    }
    let primitive: BufferGeometry = undefined
    if (parameters.circle === true) {
        primitive = createDiscPrimitive(fricAngle, parameters.type)
    } else {
        primitive = createPlanePrimitive(fricAngle, parameters.type)
    }

    const mng = new Manager(dataframe, {
        decomposers: [
            new ComponentDecomposer,
            new EigenValuesDecomposer
        ],
        dimension: 3
    })

    const sizeAttr = mng.serie(1, parameters.sizeAttribute)
    const scalars  = mng.serie(1, parameters.paintAttribute)

    if (material === undefined) {
        material = new MeshPhongMaterial({
        // material = new MeshStandardMaterial({
            color: new Color(parameters.color),
            side: DoubleSide,
            vertexColors: scalars!==undefined?true:false,
            wireframe: false, 
            flatShading: true
        })
    }
    
    let deltaSize = 1
    let mm = [0,1]
    if (sizeAttr) {
        mm = minMax(sizeAttr)
        deltaSize = mm[1]-mm[0]
    }

    const geometries: BufferGeometry[] = []
    const matrix = new Matrix4()

    const eigv = eigenVector(stress)
    const rot  = new Quaternion()
    eigv.forEach( (vectors, i) => {
        const pos = new Vector3(position.getX(i), position.getY(i), position.getZ(i))
        let s     = defaultSize
        if (sizeAttr) {
            s *= (sizeAttr.array[i] - mm[0])/deltaSize
        }
        if (parameters.type === FractureType.FAULT) {
            const m = new Matrix4()
            m.set(  vectors[0], vectors[3], vectors[6], 0,
                    vectors[1], vectors[4], vectors[7], 0,
                    vectors[2], vectors[5], vectors[8], 0,
                    0,          0,          0,          1)
            
            rot.setFromRotationMatrix(m)
        }
        else if (parameters.type === FractureType.JOINT || parameters.type === FractureType.DYKE) {
            rot.setFromUnitVectors(new Vector3(0,0,1), new Vector3(vectors[0], vectors[1], vectors[2]))
        }
        else if (parameters.type === FractureType.STYLOLITE) {
            rot.setFromUnitVectors(new Vector3(0,0,1), new Vector3(vectors[3], vectors[4], vectors[5]))
        }

        const sc  = new Vector3(s, s, s)
        matrix.compose( pos, rot, sc)
        const instanceGeometry = primitive.clone()
        instanceGeometry.applyMatrix4(matrix)

        // console.log(instanceGeometry)

        geometries.push(instanceGeometry)
        
    })

    const mergedGeometry = mergeBufferGeometries(geometries, true)

    if (scalars) {
        let v2c = fromValuesToColors(scalars.array, {
            defaultColor: new Color(parameters.defaultColor),
            reverse: parameters.reverseLut, 
            min: parameters.min, 
            max: parameters.max, 
            lut: parameters.lut, 
            duplicateLut: parameters.duplicateLut, 
            lockLut: parameters.lockLut
        })
        const N = primitive.getAttribute('position').count
        const colors: number[] = []
        scalars.forEach((s,i) => {
            const c1 = v2c[3*i]
            const c2 = v2c[3*i+1]
            const c3 = v2c[3*i+2]
            //const c = v2c.color(s)
            for (let j=0; j<N; ++j) {
                colors.push(c1, c2, c3)
            }
        })
        mergedGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    }

    return new Mesh(mergedGeometry, material)
}

// ------------------------------------------------

function deg2rad(a: number) {return a*Math.PI/180}

function createPrimitive(geom1: BufferGeometry, fric: number, type: FractureType) {
    if (type === FractureType.FAULT) {
        const ang = deg2rad( 45.0 - fric/2.0 )
        var geom2 = geom1.clone()
        geom1.rotateY(ang)
        geom2.rotateY(-ang)
        return mergeBufferGeometries( [geom1, geom2], false)
    }
    return geom1
}

function createPlanePrimitive(fric: number, type: FractureType): BufferGeometry {
   return createPrimitive(new PlaneBufferGeometry( 1, 1, 1, 1 ), fric, type)
}

function createDiscPrimitive(fric: number, type: FractureType): BufferGeometry {
   return createPrimitive(new CircleBufferGeometry(0.5, 30), fric, type)
}

// function createTrucPrimitive(fric: number) {
//     return createPrimitive(new TorusKnotBufferGeometry(1, 0.3, 100, 16 ), fric)
// }
