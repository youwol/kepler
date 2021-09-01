import { IArray } from '@youwol/dataframe';
import { Float32BufferAttribute, Vector3 } from 'three'

// See also https://stackoverflow.com/questions/27055644/three-js-maintaining-creases-when-smooth-shading-custom-geometry
// See https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/VRMLLoader.js

/**
 * Get the normals as a BufferAttribute using a crease angle
 * @param index 
 * @param coord 
 * @param creaseAngle In radian
 * @returns 
 */
export function normalAttribute(coord: IArray, index: IArray, creaseAngle: number) {
    const ab = new Vector3()
    const cb = new Vector3()
    const vA = new Vector3()
    const vB = new Vector3()
    const vC = new Vector3()

    const faces = []
    const vertexNormals = {}

    // prepare face and raw vertex normals
    for ( let i=0, l=index.length; i<l; i+=3 ) {
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

class Face {
    a: number
    b: number
    c: number
    normal: Vector3
	constructor(a: number, b: number, c: number) {
		this.a = a
		this.b = b
		this.c = c
		this.normal = new Vector3();
	}
}

function weightedNormal( normals: Vector3[], vector: Vector3, creaseAngle: number ) {
    const normal = new Vector3()

    if ( creaseAngle === 0 ) {
        normal.copy( vector )
    } else {
        for ( let i = 0, l = normals.length; i < l; i++ ) {
            const angle = normals[ i ].angleTo( vector )
            if ( angle < creaseAngle ) {
                normal.add( normals[ i ] )
            }
        }
    }
    return normal.normalize()
}


// class Face {

// 	constructor() {

// 		this.normal = new Vector3();
// 		this.midpoint = new Vector3();
// 		this.area = 0;

// 		this.constant = 0; // signed distance from face to the origin
// 		this.outside = null; // reference to a vertex in a vertex list this face can see
// 		this.mark = Visible;
// 		this.edge = null;

// 	}

// 	static create( a, b, c ) {

// 		const face = new Face();

// 		const e0 = new HalfEdge( a, face );
// 		const e1 = new HalfEdge( b, face );
// 		const e2 = new HalfEdge( c, face );

// 		// join edges

// 		e0.next = e2.prev = e1;
// 		e1.next = e0.prev = e2;
// 		e2.next = e1.prev = e0;

// 		// main half edge reference

// 		face.edge = e0;

// 		return face.compute();

// 	}

// 	getEdge( i ) {

// 		let edge = this.edge;

// 		while ( i > 0 ) {

// 			edge = edge.next;
// 			i --;

// 		}

// 		while ( i < 0 ) {

// 			edge = edge.prev;
// 			i ++;

// 		}

// 		return edge;

// 	}

// 	compute() {

// 		const a = this.edge.tail();
// 		const b = this.edge.head();
// 		const c = this.edge.next.head();

// 		_triangle.set( a.point, b.point, c.point );

// 		_triangle.getNormal( this.normal );
// 		_triangle.getMidpoint( this.midpoint );
// 		this.area = _triangle.getArea();

// 		this.constant = this.normal.dot( this.midpoint );

// 		return this;

// 	}

// 	distanceToPoint( point ) {

// 		return this.normal.dot( point ) - this.constant;

// 	}

// }