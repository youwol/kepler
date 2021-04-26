import { Vector3 } from "three"

// TO BE FINISHED

export class Mouse {
    constructor(private readonly canvas, installTouch: boolean = false) {
        window.addEventListener('mousemove',  this.setPickPosition)
        window.addEventListener('mouseout',   this.clearPickPosition)
        window.addEventListener('mouseleave', this.clearPickPosition)
        window.addEventListener('touchstart', (event) => {
            // prevent the window from scrolling
            event.preventDefault()
            this.setPickPosition(event.touches[0])
        }, {passive: false})
           
        window.addEventListener('touchmove', (event) => {
            this.setPickPosition(event.touches[0])
        })
        
        window.addEventListener('touchend', this.clearPickPosition)
    }

    setPickPosition = (event) => {
        const pos = this.getCanvasRelativePosition(event);
        this.pickPosition.x = (pos.x / this.canvas.width ) *  2 - 1;
        this.pickPosition.y = (pos.y / this.canvas.height) * -2 + 1;  // note we flip Y
    }

    clearPickPosition = () => {
        // unlike the mouse which always has a position
        // if the user stops touching the screen we want
        // to stop picking. For now we just pick a value
        // unlikely to pick something
        this.pickPosition.x = -100000
        this.pickPosition.y = -100000
    }

    getCanvasRelativePosition = (event) => {
        const rect = this.canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * this.canvas.width  / rect.width,
          y: (event.clientY - rect.top ) * this.canvas.height / rect.height,
        }
      }

    destroy() {
        // TODO: remove listener
    }

    private pickPosition = new Vector3
}
