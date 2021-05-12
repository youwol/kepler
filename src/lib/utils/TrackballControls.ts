/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io
 */

/**
  * Port to ES6+
  * - import 'three'
  * - removed THREE namespace
  * - added new class which allows to register trackball configs (save view)
  * @author Frantz Maerten
  * @date 2019/09/03
  */

import {Vector2, Vector3, Quaternion, EventDispatcher} from 'three'

const changeEvent = { type: 'change' }
const startEvent = { type: 'start' }
const endEvent = { type: 'end' }
const STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 }
export const CONSTRAINT = { NONE: -1, X: 1, Y:2, Z:3 }
 
 export class TrackballControls  extends EventDispatcher {
    object: any
    domElement: any
    enabled: any
    screen = { left: 0, top: 0, width: 0, height: 0 };
    rotateSpeed = 1.0;
    zoomSpeed = 1.2;
    panSpeed = 0.3;
    noRotate = false;
    noZoom = false;
    noPan = false;
    staticMoving = false;
    dynamicDampingFactor = 0.2;
    minDistance = 0;
    maxDistance = Infinity;
    keys = [ 65 /* A*/, 83 /* S*/, 68 /* D*/ ];
    target = new Vector3()
    EPS = 0.000001;
    lastPosition = new Vector3();
    _state = STATE.NONE;
    _prevState = STATE.NONE;
    _eye = new Vector3();
    _movePrev = new Vector2();
    _moveCurr = new Vector2();
    _lastAxis = new Vector3();
    _lastAngle = 0;
    _zoomStart = new Vector2();
    _zoomEnd = new Vector2();
    _touchZoomDistanceStart = 0;
    _touchZoomDistanceEnd = 0;
    _panStart = new Vector2();
    _panEnd = new Vector2();
    target0: any
    position0: any
    up0: any
    _constraint = CONSTRAINT.NONE

   constructor(object: any, domElement: any) {
     super()
     this.contextmenu = this.contextmenu.bind(this)
 
     this.mousedown = this.mousedown.bind(this)
     this.mousemove = this.mousemove.bind(this)
     this.mouseup = this.mouseup.bind(this)
     this.mousewheel = this.mousewheel.bind(this)
 
     this.touchstart = this.touchstart.bind(this)
     this.touchend = this.touchend.bind(this)
     this.touchmove = this.touchmove.bind(this)
 
     this.keydown = this.keydown.bind(this)
     this.keyup = this.keyup.bind(this)
 
     // --------------------------
 
     this.object = object
     this.domElement = (domElement !== undefined) ? domElement : document
 
     // API
     this.enabled = true;
     this.screen = { left: 0, top: 0, width: 0, height: 0 };
     this.rotateSpeed = 1.0;
     this.zoomSpeed = 1.2;
     this.panSpeed = 0.3;
     this.noRotate = false;
     this.noZoom = false;
     this.noPan = false;
     this.staticMoving = false;
     this.dynamicDampingFactor = 0.2;
     this.minDistance = 0;
     this.maxDistance = Infinity;
     this.keys = [ 65 /* A*/, 83 /* S*/, 68 /* D*/ ];
 
     // internals
     this.target = new Vector3();
 
     this.EPS = 0.000001;
     this.lastPosition = new Vector3();
     this._state = STATE.NONE;
     this._prevState = STATE.NONE;
     this._eye = new Vector3();
     this._movePrev = new Vector2();
     this._moveCurr = new Vector2();
     this._lastAxis = new Vector3();
     this._lastAngle = 0;
     this._zoomStart = new Vector2();
     this._zoomEnd = new Vector2();
     this._touchZoomDistanceStart = 0;
     this._touchZoomDistanceEnd = 0;
     this._panStart = new Vector2();
     this._panEnd = new Vector2();
     // events
 
     // for reset
     this.target0 = this.target.clone();
     this.position0 = this.object.position.clone();
     this.up0 = this.object.up.clone();
 
     /*
     this.domElement.addEventListener('contextmenu', this.contextmenu, false);
     this.domElement.addEventListener('mousedown', this.mousedown, false);
     this.domElement.addEventListener('mousemove', this.mousemove, false);
     this.domElement.addEventListener('mouseup', this.mouseup, false);
     this.domElement.addEventListener('mousewheel', this.mousewheel, {passive: true});
     this.domElement.addEventListener('MozMousePixelScroll', this.mousewheel, false); // firefox
 
     this.domElement.addEventListener('touchstart', this.touchstart, {passive: true});
     this.domElement.addEventListener('touchend', this.touchend, {passive: true});
     this.domElement.addEventListener('touchmove', this.touchmove, {passive: true});
 
     window.addEventListener('keydown', this.keydown, false);
     window.addEventListener('keyup', this.keyup, false);
     */
 
     this.handleResize();
 
     // force an update at start
     this.update();
   }
 
   contextmenu(event: any) {
     event.preventDefault();
   }

   set constraint(constr: any) {
     this._constraint = constr
   }
   get constraint() {
    return this._constraint
  }
 
   handleResize() {
     if (this.domElement === document) {
       this.screen.left = 0;
       this.screen.top = 0;
       this.screen.width = window.innerWidth;
       this.screen.height = window.innerHeight;
     } else {
       let box = this.domElement.getBoundingClientRect();
       // adjustments come from similar code in the jquery offset() function
 
       let d = this.domElement.ownerDocument.documentElement;
 
       this.screen.left = box.left + window.pageXOffset - d.clientLeft;
       this.screen.top = box.top + window.pageYOffset - d.clientTop;
       this.screen.width = box.width;
       this.screen.height = box.height;
     }
   }
 
   handleEvent(event: any) {
     if (typeof this[ event.type ] === 'function') {
       this[ event.type ](event);
     }
   }
 
   getMouseOnScreen(pageX: any, pageY: any) {
     return new Vector2(
       (pageX - this.screen.left) / this.screen.width,
       (pageY - this.screen.top) / this.screen.height
     )
   }
 
   getMouseOnCircle(pageX: any, pageY: any) {
     return new Vector2(
       ((pageX - this.screen.width * 0.5 - this.screen.left) / (this.screen.width * 0.5)),
       ((this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width) // screen.width intentional
     )
   }
 
   rotateCamera() {
     let axis = new Vector3(),
       quaternion = new Quaternion(),
       eyeDirection = new Vector3(),
       objectUpDirection = new Vector3(),
       objectSidewaysDirection = new Vector3(),
       moveDirection = new Vector3(),
       angle;
 
     moveDirection.set(this._moveCurr.x - this._movePrev.x, this._moveCurr.y - this._movePrev.y, 0)
     angle = moveDirection.length()
 
     if (angle) {
       this._eye.copy(this.object.position).sub(this.target)
 
       eyeDirection.copy(this._eye).normalize()
       objectUpDirection.copy(this.object.up).normalize();
       objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize()
 
       objectUpDirection.setLength(this._moveCurr.y - this._movePrev.y)
       objectSidewaysDirection.setLength(this._moveCurr.x - this._movePrev.x)
 
       moveDirection.copy(objectUpDirection.add(objectSidewaysDirection))
 
       axis.crossVectors(moveDirection, this._eye).normalize()

       //console.log(axis.x, axis.y, axis.z)
       let sign = 1
       const dot = axis.dot(new Vector3(0,0,1))
       if (dot<0) sign = -1

       switch(this._constraint) {
         case CONSTRAINT.X: axis.set(1,0,0); break
         case CONSTRAINT.Y: axis.set(0,1,0); break
         case CONSTRAINT.Z: axis.set(0,0,1); break
         default: sign = 1; break
       }
        
       angle *= this.rotateSpeed * sign
       quaternion.setFromAxisAngle(axis, angle)
 
       this._eye.applyQuaternion(quaternion)
       this.object.up.applyQuaternion(quaternion)
 
       this._lastAxis.copy(axis)
       this._lastAngle = angle
     } else if (!this.staticMoving && this._lastAngle) {
 
       this._lastAngle *= Math.sqrt(1.0 - this.dynamicDampingFactor)
       this._eye.copy(this.object.position).sub(this.target)
       quaternion.setFromAxisAngle(this._lastAxis, this._lastAngle)
       this._eye.applyQuaternion(quaternion)
       this.object.up.applyQuaternion(quaternion)
     }
 
     this._movePrev.copy(this._moveCurr)
   }
 
   zoomCamera() {
     let factor;
 
     if (this._state === STATE.TOUCH_ZOOM_PAN) {
       factor = this._touchZoomDistanceStart / this._touchZoomDistanceEnd;
       this._touchZoomDistanceStart = this._touchZoomDistanceEnd;
       this._eye.multiplyScalar(factor);
     } else {
       factor = 1.0 + (this._zoomEnd.y - this._zoomStart.y) * this.zoomSpeed;
       if (factor !== 1.0 && factor > 0.0) {
         
         this._eye.multiplyScalar(factor)
         if (this.staticMoving) {
           this._zoomStart.copy(this._zoomEnd);
         } else {
           this._zoomStart.y += (this._zoomEnd.y - this._zoomStart.y) * this.dynamicDampingFactor;
         }
       }
     }
   }
 
   panCamera() {
     let mouseChange = new Vector2(),
       objectUp = new Vector3(),
       pan = new Vector3()
 
     mouseChange.copy(this._panEnd).sub(this._panStart)
     if (mouseChange.lengthSq()) {
       mouseChange.multiplyScalar(this._eye.length() * this.panSpeed)
       pan.copy(this._eye).cross(this.object.up).setLength(mouseChange.x)
       pan.add(objectUp.copy(this.object.up).setLength(mouseChange.y))
 
       this.object.position.add(pan);
       this.target.add(pan);
 
       if (this.staticMoving) {
         this._panStart.copy(this._panEnd)
       } else {
         this._panStart.add(
           mouseChange.subVectors(this._panEnd, this._panStart).multiplyScalar(this.dynamicDampingFactor))
       }
     }
   }

  // Xaliphostes 20200416
  //
  // screen coordinates
  moveCameraByKeys(x: number, y: number) {
    let mouseChange = new Vector2(x, y)
    let objectUp = new Vector3()
    let pan = new Vector3()

    if (mouseChange.lengthSq()) {
      mouseChange.multiplyScalar(this._eye.length() * this.panSpeed)
      pan.copy(this._eye).cross(this.object.up).setLength(mouseChange.x)
      pan.add(objectUp.copy(this.object.up).setLength(mouseChange.y))
 
      this.object.position.add(pan);
      this.target.add(pan);
    }
  }

  zoomCameraByKeys(amount: number) {
    const factor = 1.0 + amount * this.zoomSpeed;
    if (factor !== 1.0 && factor > 0.0) {
      this._eye.multiplyScalar(factor)

      this.object.position.addVectors(this.target, this._eye);
      this.checkDistances();
      this.object.lookAt(this.target);
    }
  }
 
  checkDistances() {
     if (!this.noZoom || !this.noPan) {
       if (this._eye.lengthSq() > this.maxDistance * this.maxDistance) {
         this.object.position.addVectors(this.target, this._eye.setLength(this.maxDistance))
         this._zoomStart.copy(this._zoomEnd)
       }
 
       if (this._eye.lengthSq() < this.minDistance * this.minDistance) {
         this.object.position.addVectors(this.target, this._eye.setLength(this.minDistance))
         this._zoomStart.copy(this._zoomEnd)
       }
     }
   }
 
   update() {
     this._eye.subVectors(this.object.position, this.target)
 
     if (!this.noRotate) {
       this.rotateCamera();
     }
 
     if (!this.noZoom) {
       this.zoomCamera();
     }
 
     if (!this.noPan) {
       this.panCamera();
     }
 
     this.object.position.addVectors(this.target, this._eye);
     this.checkDistances();
     this.object.lookAt(this.target);
 
     if (this.lastPosition.distanceToSquared(this.object.position) > this.EPS) {
       super.dispatchEvent(changeEvent)
       this.lastPosition.copy(this.object.position)
     }
   }
 
   reset() {
     this._state = STATE.NONE
     this._prevState = STATE.NONE
 
     this.target.copy(this.target0)
     this.object.position.copy(this.position0)
     this.object.up.copy(this.up0)
 
     this._eye.subVectors(this.object.position, this.target)
     this.object.lookAt(this.target);
 
     super.dispatchEvent(changeEvent)
     this.lastPosition.copy(this.object.position)
   }
 
   dispose() {
     /*
     this.domElement.removeEventListener('contextmenu', this.contextmenu, false)
     this.domElement.removeEventListener('mousedown', this.mousedown, false)
     this.domElement.removeEventListener('mousemove', this.mousemove, false);
     this.domElement.removeEventListener('mouseup', this.mouseup, false);
     this.domElement.removeEventListener('mousewheel', this.mousewheel, false)
     this.domElement.removeEventListener('MozMousePixelScroll', this.mousewheel, false) // firefox
 
     this.domElement.removeEventListener('touchstart', this.touchstart, false)
     this.domElement.removeEventListener('touchend', this.touchend, false)
     this.domElement.removeEventListener('touchmove', this.touchmove, false)
     */
 
     //document.removeEventListener('mousemove', this.mousemove, false)
     //document.removeEventListener('mouseup', this.mouseup, false)
 
     /*
     window.removeEventListener('keydown', this.keydown, false)
     window.removeEventListener('keyup', this.keyup, false)
     */
   }
 
   // Listeners
   keydown(event: any) {
     if (this.enabled === false) return;
 
     //window.removeEventListener('keydown', this.keydown);
     this._prevState = this._state;
 
     if (this._state !== STATE.NONE) {
       return;
     } else if (event.keyCode === this.keys[ STATE.ROTATE ] && !this.noRotate) {
       this._state = STATE.ROTATE;
     } else if (event.keyCode === this.keys[ STATE.ZOOM ] && !this.noZoom) {
       this._state = STATE.ZOOM;
     } else if (event.keyCode === this.keys[ STATE.PAN ] && !this.noPan) {
       this._state = STATE.PAN;
     }
   }
 
   keyup(event: any) {
     if (this.enabled === false) return
     this._state = this._prevState
     //window.addEventListener('keydown', this.keydown, false)
   }
 
   mousedown(event: any) {
     if (this.enabled === false) return;
 
     event.preventDefault();
     event.stopPropagation();
 
     if (this._state === STATE.NONE) {
       this._state = event.button;
     }
 
     if (this._state === STATE.ROTATE && !this.noRotate) {
       this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY))
       this._movePrev.copy(this._moveCurr);
     } else if (this._state === STATE.ZOOM && !this.noZoom) {
       this._zoomStart.copy(this.getMouseOnScreen(event.pageX, event.pageY))
       this._zoomEnd.copy(this._zoomStart);
     } else if (this._state === STATE.PAN && !this.noPan) {
       this._panStart.copy(this.getMouseOnScreen(event.pageX, event.pageY))
       this._panEnd.copy(this._panStart);
     }
 
     //document.addEventListener('mousemove', this.mousemove, false)
     //document.addEventListener('mouseup', this.mouseup, false)
 
     super.dispatchEvent({type: 'start'})
   }
 
   mousemove(event: any) {
     if (this.enabled === false) return;
 
     event.preventDefault();
     event.stopPropagation();
 
     if (this._state === STATE.ROTATE && !this.noRotate) {
       this._movePrev.copy(this._moveCurr);
       this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
     } else if (this._state === STATE.ZOOM && !this.noZoom) {
       this._zoomEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
     } else if (this._state === STATE.PAN && !this.noPan) {
       this._panEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
     }
   }
 
   mouseup(event: any) {
     if (this.enabled === false) return;
     event.preventDefault();
     event.stopPropagation();
 
     this._state = STATE.NONE;
 
     //document.removeEventListener('mousemove', this.mousemove);
     //document.removeEventListener('mouseup', this.mouseup);
     super.dispatchEvent(endEvent);
   }
 
   mousewheel(event: any) {
     if (this.enabled === false) return;
 
     // event.preventDefault();
     event.stopPropagation();
 
     let delta = 0;
 
     if (event.wheelDelta) {
       // WebKit / Opera / Explorer 9
       delta = event.wheelDelta / 40;
     } else if (event.detail) {
       // Firefox
       delta = -event.detail / 3;
     }
 
     this._zoomStart.y -= delta * 0.01;
     super.dispatchEvent(startEvent);
     super.dispatchEvent(endEvent);
   }
 
   touchstart(event: any) {
     if (this.enabled === false) return;
 
     switch (event.touches.length) {
     case 1:
       this._state = STATE.TOUCH_ROTATE;
       this._moveCurr.copy(this.getMouseOnCircle(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY));
       this._movePrev.copy(this._moveCurr);
       break;
     default: // 2 or more
       this._state = STATE.TOUCH_ZOOM_PAN;
       let dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
 
       let dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
 
       this._touchZoomDistanceEnd = this._touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
 
       let x = (event.touches[ 0 ].pageX + event.touches[ 1 ].pageX) / 2;
 
       let y = (event.touches[ 0 ].pageY + event.touches[ 1 ].pageY) / 2;
 
       this._panStart.copy(this.getMouseOnScreen(x, y));
       this._panEnd.copy(this._panStart);
       break;
     }
     super.dispatchEvent(startEvent);
   }
 
   touchmove(event: any) {
     if (this.enabled === false) return;
 
     event.preventDefault();
     event.stopPropagation();
 
     switch (event.touches.length) {
 
     case 1:
       this._movePrev.copy(this._moveCurr);
       this._moveCurr.copy(this.getMouseOnCircle(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY));
       break;
     default: // 2 or more
       let dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
 
       let dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
 
       this._touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);
 
       let x = (event.touches[ 0 ].pageX + event.touches[ 1 ].pageX) / 2;
 
       let y = (event.touches[ 0 ].pageY + event.touches[ 1 ].pageY) / 2;
 
       this._panEnd.copy(this.getMouseOnScreen(x, y));
       break;
     }
   }
 
   touchend(event: any) {
     if (this.enabled === false) return;
 
     switch (event.touches.length) {
     case 0:
       this._state = STATE.NONE;
       break;
     case 1:
       this._state = STATE.TOUCH_ROTATE;
       this._moveCurr.copy(this.getMouseOnCircle(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY));
       this._movePrev.copy(this._moveCurr);
       break;
     }
     super.dispatchEvent(endEvent);
   }
 
 }
 
 