/**
 * See https://github.com/anvaka/streamlines from Ankava
 * MIT License
 */

import { Vector } from "./Vector"
import { createLookupGrid } from "./createLookupGrid"
import { createStreamlineIntegrator } from "./integrator"

enum State {
    STATE_INIT,
    STATE_STREAMLINE,
    STATE_PROCESS_QUEUE,
    STATE_DONE,
    STATE_SEED_STREAMLINE
}

/**
 * 
 * @param protoOptions of the form:
 * ```js
 * {
 *      boundingBox: {
 *          left  : -5, 
 *          top   : -5, 
 *          width : 10, 
 *          height: 10
 *      },
 *      vectorField      : value,
 *      onStreamlineAdded: value,
 *      onPointAdded     : value,
 *      forwardOnly      : value,
 *      seed             : Vector
 *      dSep             : number, // Separation between streamlines. Naming according to the paper
 *      dTest            : number, // When should we stop integrating a streamline
 *      timeStep         : 0.01,
 *      stepsPerIteration: 10,
 *      maxTimePerIteration: 1000
 * }
 * ``` 
 */
export function streamlines2D(protoOptions: any) {
    const options = Object.create(null)
    if (!protoOptions) {
        throw new Error('Configuration is required to compute streamlines')
    }
    if (!protoOptions.boundingBox) {
        console.warn('No bounding box passed to streamline. Creating default one')
        options.boundingBox = { left: -5, top: -5, width: 10, height: 10 }
    } else {
        options.boundingBox = {}
        Object.assign(options.boundingBox, protoOptions.boundingBox)
    }

    normalizeBoundingBox(options.boundingBox)

    const boundingBox = options.boundingBox
    options.vectorField = protoOptions.vectorField
    options.onStreamlineAdded = protoOptions.onStreamlineAdded;
    options.onPointAdded = protoOptions.onPointAdded;
    options.forwardOnly = protoOptions.forwardOnly;

    if (!protoOptions.seed) {
        options.seed = new Vector(
            Math.random() * boundingBox.width + boundingBox.left,
            Math.random() * boundingBox.height + boundingBox.top
        )
    } else if (Array.isArray(protoOptions.seed)) {
        const seed = protoOptions.seed.shift()
        options.seed = new Vector(seed.x, seed.y)
        options.seedArray = protoOptions.seed
    } else {
        options.seed = new Vector(protoOptions.seed.x, protoOptions.seed.y)
    }

    // Separation between streamlines. Naming according to the paper.
    options.dSep = protoOptions.dSep > 0 ? protoOptions.dSep
        : 1 / Math.max(boundingBox.width, boundingBox.height)

    // When should we stop integrating a streamline.
    options.dTest = protoOptions.dTest > 0 ? protoOptions.dTest : options.dSep * 0.5

    // Lookup grid helps to quickly tell if there are points nearby
    const grid = createLookupGrid(boundingBox, options.dSep)

    // Integration time step.
    options.timeStep            = protoOptions.timeStep > 0 ? protoOptions.timeStep : 0.01
    options.stepsPerIteration   = protoOptions.stepsPerIteration > 0 ? protoOptions.stepsPerIteration : 10
    options.maxTimePerIteration = protoOptions.maxTimePerIteration > 0 ? protoOptions.maxTimePerIteration : 1000

    const stepsPerIteration = options.stepsPerIteration
    //const resolve
    let state = State.STATE_INIT
    const finishedStreamlineIntegrators: Array<any> = []
    let streamlineIntegrator = createStreamlineIntegrator(options.seed, grid, options)
    return {
        //run: run
        run: nextStep
    }

    /*
        Order:
        initProcessing()
        processQueue()
    */

    function nextStep() {
        while (state !== State.STATE_DONE) {
            for (var i = 0; i < stepsPerIteration; ++i) {
                if (state === State.STATE_INIT)            initProcessing()
                if (state === State.STATE_STREAMLINE)      continueStreamline()
                if (state === State.STATE_PROCESS_QUEUE)   processQueue()
                if (state === State.STATE_SEED_STREAMLINE) seedStreamline()
            }
        }
    }

    function initProcessing() {
        const streamLineCompleted = streamlineIntegrator.next()
        if (streamLineCompleted) {
            addStreamLineToQueue()
            state = State.STATE_PROCESS_QUEUE
        }
    }

    function seedStreamline() {
        const currentStreamLine = finishedStreamlineIntegrators[0]
        const validCandidate = currentStreamLine.getNextValidSeed()
        if (validCandidate) {
            streamlineIntegrator = createStreamlineIntegrator(
                validCandidate,
                grid,
                options
            )
            state = State.STATE_STREAMLINE
        } else {
            finishedStreamlineIntegrators.shift()
            state = State.STATE_PROCESS_QUEUE
        }
    }

    function processQueue() {
        if (finishedStreamlineIntegrators.length === 0) {
            state = State.STATE_DONE
        } else {
            state = State.STATE_SEED_STREAMLINE;
        }
    }

    function continueStreamline() {
        const isDone = streamlineIntegrator.next()
        if (isDone) {
            addStreamLineToQueue()
            state = State.STATE_SEED_STREAMLINE
        }
    }

    function addStreamLineToQueue() {
        var streamLinePoints = streamlineIntegrator.getStreamline()
        if (streamLinePoints.length > 1) {
            finishedStreamlineIntegrators.push(streamlineIntegrator)
            if (options.onStreamlineAdded) {
                options.onStreamlineAdded(streamLinePoints, options)
            }
        }
    }
}

function assertNumber(x: any, msg: string) {
    if (typeof x !== 'number' || Number.isNaN(x)) throw new Error(msg)
}

function normalizeBoundingBox(bbox: any) {
    const msg = 'Bounding box {left, top, width, height} is required'
    if (!bbox) throw new Error(msg)

    assertNumber(bbox.left, msg)
    assertNumber(bbox.top, msg)
    if (typeof bbox.size === 'number') {
        bbox.width = bbox.size;
        bbox.height = bbox.size;
    }
    assertNumber(bbox.width, msg)
    assertNumber(bbox.height, msg)

    if (bbox.width <= 0 || bbox.height <= 0) throw new Error('Bounding box cannot be empty')
}