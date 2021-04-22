/**
 * Generate iso-values given a min, max and the number of isos to generate
 * @param min The minimum value
 * @param max The maximum value
 * @param nbrOrSpacing Represent either the number of iso-contours (useSpacing=false)
 * or the spacing between iso-contours (useSpacing=true).
 * @param useSpacing If the generation is using or not the spacing between iso-contours.
 * Also, the generated iso values are snapped to zero in both cases.
 * @category Utils
 */
 export function generateIsos(min: number, max: number, nbrOrSpacing: number = 10, useSpacing=false): Array<number> {
    if (useSpacing) {
        return generateIsosBySpacing(min, max, nbrOrSpacing)
    }
    return generateIsosByNumber(min, max, nbrOrSpacing)
}

/**
 * Generate iso-values given the min, max and the number
 * @param min 
 * @param max 
 * @param nbr
 * @category Utils
 */
export function generateIsosByNumber(min: number, max: number, nbr: number = 10): Array<number> {
    if (min >= max) {
        return []
    }
    const epsilon = ( max - min) / (nbr)
    //return Array.apply(null, Array(nbr)).map( (_:any,i:number) => min + (i+1) * epsilon )
    return generateIsosBySpacing(min, max, epsilon)
}

/**
 * Generate iso-values by using spacing.
 * Also, iso-values are snapped to zero, meaning that they alway pass through zero even
 * if 0 is not part of the iso values.
 * @param min 
 * @param max 
 * @param spacing
 * @category Utils
 */
export function generateIsosBySpacing(min: number, max: number, spacing: number): Array<number> {
    const r = []
    if (min<0 && max>0) {
        let value = spacing
        while (value >= min+spacing) r.push(value -= spacing)
        value = 0
        while (value <= max-spacing) r.push(value += spacing)
    } else {
        let scale = 1
        if (max<0) { scale=-1; const a=min; min=max; max=a}
        if (min*scale >= max*scale) return []
        let valueInc = Math.trunc(min*scale/spacing)
        if (valueInc * spacing < min*scale) valueInc++
        let value = valueInc * spacing
        while (value <= max*scale) {r.push(value*scale); value += spacing}
    }
    return r.sort( (a, b) => a - b )
}
