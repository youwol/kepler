/**
 * Interface for an implicite grid in 3D. Given (i,j,k) as integers,
 * return the position (x,y,z)
 * @example
 * ```ts
 * class Grid implements ImplicitGrid3D {
 *   spacing: number[]
 *
 *   constructor(
 *     public readonly sizes: number[],
 *     dimension: number[],
 *     public readonly origin: number[])
 *   {
 *     this.spacing = [
 *       dimension[0]/sizes[0],
 *       dimension[1]/sizes[1],
 *       dimension[2]/sizes[2]
 *     ]
 *   }
 *
 *   pos(i: number, j: number, k: number) {
 *     return [
 *       this.origin[0] + i*this.spacing[0],
 *       this.origin[1] + j*this.spacing[1],
 *       this.origin[2] + k*this.spacing[2]]
 *   }
 * }
 *
 * const grid = new Grid()
 * const isos = createIsoSurfaces({
 *   positions: grid,
 *   sizes: [10,20,30],
 *   attribute: [.....]
 * })
 * ```
 * @see [[createIsoSurfaces]]
 * @category Types
 */
export interface ImplicitGrid3D {
    /**
     * The method that return the real position of a point given its indices
     * @returns The 3D coordinate of the point with indices (i,j,k)
     */
    pos(i: number, j: number, k: number): number[]

    /**
     * The sizes of the grid along the 3 axis
     */
    readonly sizes: number[]
}
