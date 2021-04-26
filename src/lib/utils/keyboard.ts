

type KeyCallback = (event: KeyboardEvent) => void


/**
 * @example
 * ```ts
 * const keyboard = new Keyboard()
 * keyboard.addKey('u', e => kepler.changeView('up', controls) )
 * ```
 */
export class Keyboard {
    constructor(private readonly dom: any, private readonly type: string = 'keydown') {
        if (dom===undefined) this.dom = document
        this.dom.addEventListener( type, this.proceed )
    }

    addKey(key: string, cb: KeyCallback) {
        this.map.set(key, cb)
    }

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
