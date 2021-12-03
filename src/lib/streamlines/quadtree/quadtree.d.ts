// Type definitions for @timohausmann/quadtree-js v1.2.5
// https://github.com/timohausmann/quadtree-js
// Definitions by: Timo Hausmann <https://timohausmann.de/>
// Template: https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-class-d-ts.html

export namespace quadtree {

    export class Quadtree {
        constructor (bounds: Rect, max_objects?: number, max_levels?: number, level?: number);
        max_objects: number;
        max_levels: number;
        level: number;
        bounds: Rect;
        objects: Rect[];
        nodes: Quadtree[];

        split(): void
        getIndex(pRect: Rect): number[]
        insert(pRect: Rect): void
        retrieve<T extends Rect>(pRect: Rect): T[]
        clear(): void
    }

    export interface Rect {
        x: number
        y: number
        width: number
        height: number
    }
}
