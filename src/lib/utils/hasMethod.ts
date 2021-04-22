/**
 * @category Utils
 */
export function hasMethod(object: Object, method: string) {
    return Object.getOwnPropertyDescriptor(Object.getPrototypeOf(object), method) !== undefined
}
