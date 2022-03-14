import { BufferGeometry, Color, EdgesGeometry, LineBasicMaterial, LineSegments, Material } from "three";
import { SkinParameters } from ".";

export class EdgesParameters extends SkinParameters {
    public readonly color: string
    public readonly linewidth: number
    public readonly thresholdAngle: number

    constructor(
        {color, linewidth, thresholdAngle, ...others}:
        {color?: string, linewidth?: number, thresholdAngle?: number}={})
    {
        super(others)
        this.color = color || '#000000'
        this.linewidth = linewidth || 0.1
        this.thresholdAngle = thresholdAngle || 1
    }
}

export function createEdges(geometry: BufferGeometry, params: EdgesParameters = undefined) {
    params = params === undefined ? new EdgesParameters : params
    const edges = new EdgesGeometry( geometry, params.thresholdAngle )
    return new LineSegments( edges, new LineBasicMaterial( { color: new Color(params.color) } ) )
}