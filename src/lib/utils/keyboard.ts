

type KeyCallback = (event: KeyboardEvent) => void


/**
 * Install a keyboard to grab key down events. By default, the keyboard is installed
 * using the `document` if the `dom` is not provided
 * @example
 * ```ts
 * const keyboard = new kepler.Keyboard()
 * keyboard.addKey('u', e => kepler.changeView('up', controls) )
 * ```
 * @category Utils
 */
export class Keyboard {
    constructor(private readonly dom: any, private readonly type: string = 'keydown') {
        if (dom===undefined) this.dom = document
        this.dom.addEventListener( type, this.proceed )
    }

    /**
     * Add a new key-binding
     * @param key The key
     * @param cb The corresponding callback to call when the key is pressed
     */
    addKey(key: string, cb: KeyCallback) {
        this.map.set(key, cb)
    }

    removeKey(key: string) {
        this.map.delete(key)
    }

    /**
     * Remove the underlaying listener from the dom
     */
    destroy() {
        this.dom.removeEventListener( this.type, this.proceed )
    }

    private proceed = (event: KeyboardEvent) => {
        if (event.defaultPrevented) {
            return // Do nothing if the event was already processed
        }
    
        const cb = this.map.get(event.key)
        if (cb) {
            cb(event)
        }
    }

    private map: Map<string, KeyCallback> = new Map()
}
