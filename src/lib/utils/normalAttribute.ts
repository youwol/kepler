// import { IArray, Vector } from '@youwol/dataframe';
import { Float32BufferAttribute, Vector3 } from 'three'

// See also https://stackoverflow.com/questions/27055644/three-js-maintaining-creases-when-smooth-shading-custom-geometry
// See https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/VRMLLoader.js
// See https://codepen.io/Ni55aN/pen/zROmoe?editors=0010

/**
 * Get the normals as a BufferAttribute using a crease angle
 * @param index 
 * @param coord 
 * @param creaseAngle In radian
 * @returns 
 */
export function normalAttribute( coord: ArrayLike<number>, index: ArrayLike<number> , creaseAngle: number) {
    const faces = []
    const vertexNormals = {}

    const ab = new Vector3()
    const cb = new Vector3()
    const vA = new Vector3()
    const vB = new Vector3()
    const vC = new Vector3()

    // prepare face and raw vertex normals
    for (let i = 0, l = index.length; i < l; i += 3) {
        const a = index[ i ]
        const b = index[ i + 1 ]
        const c = index[ i + 2 ]
        const face = new Face( a, b, c )
        vA.fromArray( coord, a * 3 )
        vB.fromArray( coord, b * 3 )
        vC.fromArray( coord, c * 3 )
        cb.subVectors( vC, vB )
        ab.subVectors( vA, vB )
        cb.cross( ab )
        cb.normalize()
        face.normal.copy( cb )
        if ( vertexNormals[ a ] === undefined ) vertexNormals[ a ] = []
        if ( vertexNormals[ b ] === undefined ) vertexNormals[ b ] = []
        if ( vertexNormals[ c ] === undefined ) vertexNormals[ c ] = []
        vertexNormals[ a ].push( face.normal )
        vertexNormals[ b ].push( face.normal )
        vertexNormals[ c ].push( face.normal )
        faces.push( face )
    }

    // compute vertex normals and build final geometry
    const normals = []
    for ( let i = 0, l = faces.length; i < l; i ++ ) {
        const face = faces[ i ]
        const nA = weightedNormal( vertexNormals[ face.a ], face.normal, creaseAngle )
        const nB = weightedNormal( vertexNormals[ face.b ], face.normal, creaseAngle )
        const nC = weightedNormal( vertexNormals[ face.c ], face.normal, creaseAngle )
        vA.fromArray( coord, face.a * 3 )
        vB.fromArray( coord, face.b * 3 )
        vC.fromArray( coord, face.c * 3 )
        normals.push( nA.x, nA.y, nA.z )
        normals.push( nB.x, nB.y, nB.z )
        normals.push( nC.x, nC.y, nC.z )
    }

    return new Float32BufferAttribute( normals, 3 )
}

// ------------------- private ------------------

function weightedNormal( normals: Vector3[], vector: Vector3, creaseAngle: number ) {
    const normal = new Vector3()
    if ( creaseAngle === 0 ) {
        normal.copy( vector )
    } else {
        for ( let i = 0, l = normals.length; i < l; i ++ ) {
            if ( normals[ i ].angleTo( vector ) < creaseAngle ) {
                normal.add( normals[ i ] )
            }
        }
    }
    return normal.normalize()
}

class Face {
    a: number
    b: number
    c: Number
    normal: Vector3
    
	constructor( a: number, b: number, c: number ) {
		this.a = a;
		this.b = b;
		this.c = c;
		this.normal = new Vector3()
	}
}

