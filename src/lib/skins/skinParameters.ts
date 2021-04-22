/**
 * @brief Base class for all skin parameters
 * @category Skin Parameters
 */
 export class SkinParameters {
    visible: boolean = true

    constructor({visible=true}:{visible?:boolean}) {
        this.visible = (visible!==undefined)?visible:true
    }
    
    set(name: string, value: any, defaultValue: any = true): void {
        this[name] = ( value !== undefined ? value : defaultValue )
    }
}
