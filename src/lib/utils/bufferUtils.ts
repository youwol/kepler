import { BufferGeometry, Float32BufferAttribute, BufferAttribute } from "three"
import { Serie, IArray} from "@youwol/dataframe"
import { normalAttribute } from "./normalAttribute"

/**
 * @brief Create a BufferGeometry using [[ASerie]]s
 * @category Buffer utils 
 */
export function createBufferGeometry(
    position: IArray | Serie, 
    indices?: IArray | Serie, 
    creaseAngle?: number
): BufferGeometry
{
    const crease = creaseAngle!==undefined ? creaseAngle : 0
    const geom = new BufferGeometry()

    if (position['array'] !== undefined) {
        geom.setAttribute('position', new BufferAttribute((position as Serie).array, 3) )
    }
    else {
        if (Array.isArray(position)) {
            geom.setAttribute('position', new BufferAttribute(new Float32Array(position), 3) )
        }
        else if (ArrayBuffer.isView(position)) {
            geom.setAttribute('position', new BufferAttribute(position as any, 3) )
        }
        else {
            throw new Error('position should be an Array, a TypedArray or a Serie')
        }
    }

    if (indices !== undefined) {
        if (indices['array'] !== undefined) {
            geom.setIndex( new BufferAttribute((indices as Serie).array, 1) )
        }
        else {
            //if (!Array.isArray(indices)) throw new Error('indices should be an Array')
            if (Array.isArray(indices)) {
                console.warn('Deal with Uint16 or Uint32')
                geom.setIndex( new BufferAttribute(new Uint32Array(indices), 1) )
            }
            else if (ArrayBuffer.isView(indices)) {
                geom.setIndex( new BufferAttribute(indices as any, 1) )
            }
            else {
                throw new Error('indices should be an Array, a TypedArray or a Serie')
            }
        }

        if (creaseAngle===0) {
            geom.computeVertexNormals()
        }
        else {
            const array = geom.getAttribute('position').array
            const normals = normalAttribute(array as IArray, geom.index.array as IArray, crease)
            geom.setAttribute( 'normal', normals )
        }
    }

    geom.computeBoundingBox()
    geom.computeBoundingSphere()
    return geom
}

/**
 * @brief Add a color attribute in a BufferGeometry
 * @category Buffer utils
 */
export function addColorToBufferGeometry(geometry: BufferGeometry, color: Serie, name: string = 'color') {
    if (color.itemSize !== 3) {
        throw new Error('Serie for color must have count = 3')
    }
    if (geometry.getAttribute('position') === undefined) {
        throw new Error('position is nor defined in geometry')
    }
    if (color.length !== geometry.getAttribute('position').array.length) {
        throw new Error('color length is not equal to vertex length')
    }

    geometry.setAttribute(name, new Float32BufferAttribute(color.array, 3))
    const attr = geometry.getAttribute('color') as BufferAttribute
    attr.needsUpdate = true
}

/**
 * @brief Merge sevral BufferGeometry into one
 * @category Buffer utils 
 */
export function mergeBufferGeometries(geometries: Array<BufferGeometry>, useGroups=false ) {
    var isIndexed = geometries[ 0 ].index !== null;
    var attributesUsed = new Set( Object.keys( geometries[ 0 ].attributes ) );
    var morphAttributesUsed = new Set( Object.keys( geometries[ 0 ].morphAttributes ) );
    var attributes = {};
    var morphAttributes = {};
    var morphTargetsRelative = geometries[ 0 ].morphTargetsRelative;
    var mergedGeometry = new BufferGeometry();
    var offset = 0;

    for ( var i = 0; i < geometries.length; ++ i ) {
        var geometry = geometries[ i ];
        // ensure that all geometries are indexed, or none
        if ( isIndexed !== ( geometry.index !== null ) ) return null;
        // gather attributes, exit early if they're different
        for ( var name in geometry.attributes ) {
            if ( ! attributesUsed.has( name ) ) return null;
            if ( attributes[ name ] === undefined ) attributes[ name ] = [];
            attributes[ name ].push( geometry.attributes[ name ] );
        }
        // gather morph attributes, exit early if they're different
        if ( morphTargetsRelative !== geometry.morphTargetsRelative ) return null;
        for ( var name in geometry.morphAttributes ) {
            if ( ! morphAttributesUsed.has( name ) ) return null;
            if ( morphAttributes[ name ] === undefined ) morphAttributes[ name ] = [];
            morphAttributes[ name ].push( geometry.morphAttributes[ name ] );
        }

        // gather .userData
        mergedGeometry.userData.mergedUserData = mergedGeometry.userData.mergedUserData || [];
        mergedGeometry.userData.mergedUserData.push( geometry.userData );
        if ( useGroups ) {
            var count;
            if ( isIndexed ) {
                count = geometry.index.count;
            } else if ( geometry.attributes.position !== undefined ) {
                count = geometry.attributes.position.count;
            } else {
                return null;
            }
            mergedGeometry.addGroup( offset, count, i );
            offset += count;
        }
    }
    // merge indices
    if ( isIndexed ) {
        var indexOffset = 0;
        var mergedIndex = [];
        for ( var i = 0; i < geometries.length; ++ i ) {
            var index = geometries[ i ].index;
            for ( var j = 0; j < index.count; ++ j ) {
                mergedIndex.push( index.getX( j ) + indexOffset );
            }
            indexOffset += geometries[ i ].attributes.position.count;
        }
        mergedGeometry.setIndex( mergedIndex );
    }

    // merge attributes
    for ( var name in attributes ) {
        var mergedAttribute = mergeBufferAttributes( attributes[ name ] );
        if ( ! mergedAttribute ) return null;
        mergedGeometry.setAttribute( name, mergedAttribute );
    }

    // merge morph attributes
    for ( var name in morphAttributes ) {
        var numMorphTargets = morphAttributes[ name ][ 0 ].length;
        if ( numMorphTargets === 0 ) break;
        mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
        mergedGeometry.morphAttributes[ name ] = [];
        for ( var i = 0; i < numMorphTargets; ++ i ) {
            var morphAttributesToMerge = [];
            for ( var j = 0; j < morphAttributes[ name ].length; ++ j ) {
                morphAttributesToMerge.push( morphAttributes[ name ][ j ][ i ] );
            }
            var mergedMorphAttribute = mergeBufferAttributes( morphAttributesToMerge );
            if ( ! mergedMorphAttribute ) return null;
            mergedGeometry.morphAttributes[ name ].push( mergedMorphAttribute );
        }
    }
    return mergedGeometry
}

/**
 * @brief Merge several BufferAttribute into one
 * @category Buffer utils
 */
export function mergeBufferAttributes( attributes: Array<BufferAttribute> ) {
    var TypedArray;
    var itemSize;
    var normalized;
    var arrayLength = 0;

    for ( var i = 0; i < attributes.length; ++ i ) {
        var attribute = attributes[ i ];
        if ( attribute["isInterleavedBufferAttribute"] ) return null;
        if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
        if ( TypedArray !== attribute.array.constructor ) return null;
        if ( itemSize === undefined ) itemSize = attribute.itemSize;
        if ( itemSize !== attribute.itemSize ) return null;
        if ( normalized === undefined ) normalized = attribute.normalized;
        if ( normalized !== attribute.normalized ) return null;
        arrayLength += attribute.array.length;
    }

    var array = new (TypedArray as any)( arrayLength );
    var offset = 0;
    for ( var i = 0; i < attributes.length; ++ i ) {
        array.set( attributes[ i ].array, offset );
        offset += attributes[ i ].array.length;
    }
    return new BufferAttribute( array, itemSize, normalized );
}