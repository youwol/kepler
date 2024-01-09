/**
 * Computes streamlines of a vector field based on http://web.cs.ucdavis.edu/~ma/SIGGRAPH02/course23/notes/papers/Jobard.pdf
 */

import { Vector } from './Vector'
import { createLookupGrid } from './createLookupGrid'
import { createStreamlineIntegrator } from './streamLineIntegrator'

const STATE_INIT = 0
const STATE_STREAMLINE = 1
const STATE_PROCESS_QUEUE = 2
const STATE_DONE = 3
const STATE_SEED_STREAMLINE = 4

export function computeStreamlines(protoOptions) {
    const options = Object.create(null)
    if (!protoOptions) {
        throw new Error('Configuration is required to compute streamlines')
    }
    if (!protoOptions.boundingBox) {
        console.warn(
            'No bounding box passed to streamline. Creating default one',
        )
        options.boundingBox = { left: -5, top: -5, width: 10, height: 10 }
    } else {
        options.boundingBox = {}
        Object.assign(options.boundingBox, protoOptions.boundingBox)
    }

    //console.log( options.boundingBox )

    normalizeBoundingBox(options.boundingBox)

    const boundingBox = options.boundingBox
    options.vectorField = protoOptions.vectorField
    options.onStreamlineAdded = protoOptions.onStreamlineAdded
    options.onPointAdded = protoOptions.onPointAdded
    options.forwardOnly = protoOptions.forwardOnly

    if (!protoOptions.seed) {
        options.seed = new Vector(
            Math.random() * boundingBox.width + boundingBox.left,
            Math.random() * boundingBox.height + boundingBox.top,
        )
    } else if (Array.isArray(protoOptions.seed)) {
        const seed = protoOptions.seed.shift()
        options.seed = new Vector(seed.x, seed.y)
        options.seedArray = protoOptions.seed
    } else {
        options.seed = new Vector(protoOptions.seed.x, protoOptions.seed.y)
    }

    // Separation between streamlines. Naming according to the paper.
    options.dSep =
        protoOptions.dSep > 0
            ? protoOptions.dSep
            : 1 / Math.max(boundingBox.width, boundingBox.height)

    // When should we stop integrating a streamline.
    options.dTest =
        protoOptions.dTest > 0 ? protoOptions.dTest : options.dSep * 0.5

    // Lookup grid helps to quickly tell if there are points nearby
    const grid = createLookupGrid(boundingBox, options.dSep)

    // Integration time step.
    options.timeStep = protoOptions.timeStep > 0 ? protoOptions.timeStep : 0.01
    options.stepsPerIteration =
        protoOptions.stepsPerIteration > 0 ? protoOptions.stepsPerIteration : 10
    options.maxTimePerIteration =
        protoOptions.maxTimePerIteration > 0
            ? protoOptions.maxTimePerIteration
            : 1000

    const stepsPerIteration = options.stepsPerIteration
    // var resolve;
    let state = STATE_INIT
    const finishedStreamlineIntegrators = []
    let streamlineIntegrator = createStreamlineIntegrator(
        options.seed,
        grid,
        options,
    )

    // var disposed = false;
    // var running = false;
    // var nextTimeout;

    // It is asynchronous. If this is used in a browser we don't want to freeze the UI thread.
    // On the other hand, if you need this to be sync - we can extend the API. Just let me know.

    return {
        run: run,
        getGrid: getGrid,
        // dispose: dispose
    }

    function run() {
        while (state !== STATE_DONE) {
            oneStep()
        }
    }

    function oneStep() {
        for (let i = 0; i < stepsPerIteration; ++i) {
            if (state === STATE_INIT) {
                initProcessing()
            }
            if (state === STATE_STREAMLINE) {
                continueStreamline()
            }
            if (state === STATE_PROCESS_QUEUE) {
                processQueue()
            }
            if (state === STATE_SEED_STREAMLINE) {
                seedStreamline()
            }
            if (state === STATE_DONE) {
                return
            }
        }
    }

    function getGrid() {
        return grid
    }

    // function run() {
    //     if (running) return;
    //     running = true;
    //     nextTimeout = setTimeout(nextStep, 0);

    //     return new Promise(assignResolve);
    // }

    // function assignResolve(pResolve) {
    //     resolve = pResolve;
    // }

    // function dispose() {
    //     disposed = true;
    //     clearTimeout(nextTimeout);
    // }

    // function nextStep() {
    //     if (disposed) return;
    //     var maxTimePerIteration = options.maxTimePerIteration;
    //     var start = window.performance.now();

    //     for (var i = 0; i < stepsPerIteration; ++i) {
    //         if (state === STATE_INIT)           initProcessing();
    //         if (state === STATE_STREAMLINE)     continueStreamline();
    //         if (state === STATE_PROCESS_QUEUE)      processQueue();
    //         if (state === STATE_SEED_STREAMLINE)    seedStreamline();
    //         if (window.performance.now() - start > maxTimePerIteration) break;

    //         if (state === STATE_DONE) {
    //             resolve(options);
    //             return;
    //         }
    //     }

    //     nextTimeout = setTimeout(nextStep, 0);
    // }

    function initProcessing() {
        const streamLineCompleted = streamlineIntegrator.next()
        if (streamLineCompleted) {
            addStreamLineToQueue()
            state = STATE_PROCESS_QUEUE
        }
    }

    function seedStreamline() {
        const currentStreamLine = finishedStreamlineIntegrators[0]

        const validCandidate = currentStreamLine.getNextValidSeed()
        if (validCandidate) {
            streamlineIntegrator = createStreamlineIntegrator(
                validCandidate,
                grid,
                options,
            )
            state = STATE_STREAMLINE
        } else {
            finishedStreamlineIntegrators.shift()
            state = STATE_PROCESS_QUEUE
        }
    }

    function processQueue() {
        if (finishedStreamlineIntegrators.length === 0) {
            state = STATE_DONE
        } else {
            state = STATE_SEED_STREAMLINE
        }
    }

    function continueStreamline() {
        const isDone = streamlineIntegrator.next()
        if (isDone) {
            addStreamLineToQueue()
            state = STATE_SEED_STREAMLINE
        }
    }

    function addStreamLineToQueue() {
        const streamLinePoints = streamlineIntegrator.getStreamline()
        if (streamLinePoints.length > 1) {
            finishedStreamlineIntegrators.push(streamlineIntegrator)
            if (options.onStreamlineAdded) {
                options.onStreamlineAdded(streamLinePoints, options)
            }
        }
    }
}

function normalizeBoundingBox(bbox) {
    const requiredBoxMessage =
        'Bounding box {left, top, width, height} is required'
    if (!bbox) {
        throw new Error(requiredBoxMessage)
    }

    assertNumber(bbox.left, requiredBoxMessage)
    assertNumber(bbox.top, requiredBoxMessage)
    if (typeof bbox.size === 'number') {
        bbox.width = bbox.size
        bbox.height = bbox.size
    }
    assertNumber(bbox.width, requiredBoxMessage)
    assertNumber(bbox.height, requiredBoxMessage)

    if (bbox.width <= 0 || bbox.height <= 0) {
        throw new Error('Bounding box cannot be empty')
    }
}

function assertNumber(x, msg) {
    if (typeof x !== 'number' || Number.isNaN(x)) {
        throw new Error(msg)
    }
}
