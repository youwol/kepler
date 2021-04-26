import { Mesh, Material } from "three"
import { ASerie } from '@youwol/dataframe'
import { IsoContoursParameters  } from './isoContoursParameters'
import { createIsoContourLines  } from "./createIsoContourLines"
import { createIsoContourFilled } from "./createIsoContourFilled"

export function createIsoContours(mesh: Mesh, attribute: ASerie,
    {material, parameters}:{material?: Material, parameters?: IsoContoursParameters}={})
{
    if (parameters.filled) {
        return createIsoContourFilled(mesh, attribute, {material, parameters})
    }
    else {
        return createIsoContourLines(mesh, attribute, {material, parameters})
    }
}
