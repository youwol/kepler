import { IArray, Vector } from '@youwol/dataframe';
import { BufferAttribute, Float32BufferAttribute, Vector3 } from 'three'

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
export function normalAttribute(coord: IArray, index: IArray, creaseAngle: number) {
    const ab = new Vector3()
    const cb = new Vector3()
    const vA = new Vector3()
    const vB = new Vector3()
    const vC = new Vector3()

    const normalAttribute = new BufferAttribute( new Float32Array(coord.length), 3 );

    const faces = []
    const vertexNormals = {}

    // Prepare face and raw vertex normals
    for (let i=0, l=index.length; i<l; i += 3) {
        // Compute face normals
        const a = index[ i ]
        const b = index[ i + 1 ]
        const c = index[ i + 2 ]
        const face = new Face(a, b, c)
        vA.fromArray(coord, 3*a)
        vB.fromArray(coord, 3*b)
        vC.fromArray(coord, 3*c)
        cb.subVectors(vC, vB)
        ab.subVectors(vA, vB)
        cb.cross(ab)
        cb.normalize()
        face.normal.copy(cb)
        faces.push( face )

        // Then, fill vertexNormals (one array for each vertex)
        if (vertexNormals[a] === undefined) vertexNormals[a] = []
        if (vertexNormals[b] === undefined) vertexNormals[b] = []
        if (vertexNormals[c] === undefined) vertexNormals[c] = []
        vertexNormals[a].push(face.normal)
        vertexNormals[b].push(face.normal)
        vertexNormals[c].push(face.normal)
    }

    // Compute vertex normals and build final geometry
    const normals = []

    //let n = 0

    for (let i = 0, l = faces.length; i < l; ++i) {
        const face = faces[ i ]
        const nA = weightedNormal( vertexNormals[face.a], face.normal, creaseAngle )
        const nB = weightedNormal( vertexNormals[face.b], face.normal, creaseAngle )
        const nC = weightedNormal( vertexNormals[face.c], face.normal, creaseAngle )

        // const xa = normalAttribute.getX(face.a)
        // const ya = normalAttribute.getY(face.a)
        // const za = normalAttribute.getZ(face.a)
        // const xb = normalAttribute.getX(face.b)
        // const yb = normalAttribute.getY(face.b)
        // const zb = normalAttribute.getZ(face.b)
        // const xc = normalAttribute.getX(face.c)
        // const yc = normalAttribute.getY(face.c)
        // const zc = normalAttribute.getZ(face.c)
        // normalAttribute.setXYZ( face.a, xa+nA.x, ya+nA.y, za+nA.z )
        // normalAttribute.setXYZ( face.b, xb+nB.x, yb+nB.y, zb+nB.z )
        // normalAttribute.setXYZ( face.c, xc+nC.x, yc+nC.y, zc+nC.z )

        normalAttribute.setXYZ( face.a, nA.x, nA.y, nA.z )
        normalAttribute.setXYZ( face.b, nB.x, nB.y, nB.z )
        normalAttribute.setXYZ( face.c, nC.x, nC.y, nC.z )
    }

    // Normalization
    for (let i=0; i<normalAttribute.count; ++i) {
        const x = normalAttribute.getX(i)
        const y = normalAttribute.getY(i)
        const z = normalAttribute.getZ(i)
        const d = Math.sqrt(x**2 + y**2 + z**2)
        normalAttribute.setXYZ(i, x/d, y/d, z/d)
    }

    return normalAttribute
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
    }
    else {
        for (let i=0, l=normals.length; i<l; ++i ) {
            const n = normals[i]
            const angle = n.angleTo( vector )
            if ( angle < creaseAngle ) {
                normal.add(n)
            }
        }
    }
    return normal//.normalize()
}

// -----------------------------------------------------------

/*
const calcNormal = (normals: Vector3[], normal: Vector3, angle: number) =>
	normals.
        filter( n => n.angleTo( normal ) < angle * Math.PI / 180 ).
        reduce( (a, b) => a.clone().add( b ) ).normalize()


const computeVertexNormals = (geometry, angle) => {
	geometry.computeFaceNormals() ; // TODO
	
	const vertices = geometry.vertices.map( () => [] ); // vertices with normals array

	geometry.faces.map( face => {
		vertices[ face.a ].push( face.normal );
		vertices[ face.b ].push( face.normal );
		vertices[ face.c ].push( face.normal );
	});

	geometry.faces.map( face => {
		face.vertexNormals[ 0 ] = calcNormal( vertices[ face.a ], face.normal, angle );
		face.vertexNormals[ 1 ] = calcNormal( vertices[ face.b ], face.normal, angle );
		face.vertexNormals[ 2 ] = calcNormal( vertices[ face.c ], face.normal, angle );
	});

	if ( geometry.faces.length > 0 ) 
		geometry.normalsNeedUpdate = true;
}
*/















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