/**
 * @brief Base class for all skin parameters
 * @category Skin Parameters
 */
export class SkinParameters {
    visible = true

    constructor({ visible = true }: { visible?: boolean }) {
        this.visible = visible !== undefined ? visible : true
    }

    /**
     * Set the value to an existing property of this
     * @param name The name of the property
     * @param value The value
     * @param defaultValue If value is undefined, use the default value
     */
    set(name: string, value: any, defaultValue: any): void {
        // Check that property exist on this
        if (this[name] === undefined) {
            throw new Error(`property ${name} does not exist for this`)
        }
        if (value !== undefined) {
            this[name] = value
            return
        }
        if (defaultValue === undefined) {
            throw new Error('defaultValue is undefined')
        }
        this[name] = defaultValue
    }
}
