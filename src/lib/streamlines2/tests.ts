/**
 * See https://github.com/anvaka/streamlines from Ankava
 * MIT License
 */
import { Vector } from './Vector'
import { createLookupGrid } from './createLookupGrid'
import { createStreamlineIntegrator } from './integrator'

enum State {
    INIT,
    STREAMLINE,
    PROCESS_QUEUE,
    DONE,
    SEED_STREAMLINE,
}

export class Streamlines2D {
    options: any = Object.create(null)
    state: State = State.INIT
    grid: any = undefined
    streamlineIntegrator: any = undefined
    solution: Array<any> = []

    constructor(protoOptions: any) {
        const options = Object.create(null)
        if (!protoOptions) {
            throw new Error('Configuration is required to compute streamlines')
        }
        if (!protoOptions.boundingBox) {
            console.warn(
                'No bounding box passed to streamline.\nCreating default one { left: -5, top: -5, width: 10, height: 10 }',
            )
            options.boundingBox = { left: -5, top: -5, width: 10, height: 10 }
        } else {
            options.boundingBox = {}
            Object.assign(options.boundingBox, protoOptions.boundingBox)
        }

        options.vectorField = protoOptions.vectorField
        options.onStreamlineAdded = protoOptions.onStreamlineAdded
        options.onPointAdded = protoOptions.onPointAdded
        options.forwardOnly = protoOptions.forwardOnly

        normalizeBoundingBox(options.boundingBox)
        const boundingBox = options.boundingBox

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

        // Integration time step.
        options.timeStep =
            protoOptions.timeStep > 0 ? protoOptions.timeStep : 0.01
        options.stepsPerIteration =
            protoOptions.stepsPerIteration > 0
                ? protoOptions.stepsPerIteration
                : 10
        options.maxTimePerIteration =
            protoOptions.maxTimePerIteration > 0
                ? protoOptions.maxTimePerIteration
                : 1000

        this.grid = createLookupGrid(boundingBox, options.dSep)
        this.options = options
        this.state = State.INIT
        this.solution = []
        this.streamlineIntegrator = createStreamlineIntegrator(
            options.seed,
            this.grid,
            this.options,
        )
        this.run()
    }

    run() {
        while (this.state !== State.DONE) {
            for (let i = 0; i < this.options.stepsPerIteration; ++i) {
                if (this.state === State.INIT) this.initProcessing()
                if (this.state === State.STREAMLINE) this.continueStreamline()
                if (this.state === State.PROCESS_QUEUE) this.processQueue()
                if (this.state === State.SEED_STREAMLINE) this.seedStreamline()
            }
        }
    }

    private initProcessing() {
        const streamLineCompleted = this.streamlineIntegrator.next()
        if (streamLineCompleted) {
            this.addStreamLineToQueue()
            this.state = State.PROCESS_QUEUE
        }
    }

    private seedStreamline() {
        const currentStreamLine = this.solution[0]
        const validCandidate = currentStreamLine.getNextValidSeed()
        if (validCandidate) {
            this.streamlineIntegrator = createStreamlineIntegrator(
                validCandidate,
                this.grid,
                this.options,
            )
            this.state = State.STREAMLINE
        } else {
            this.solution.shift()
            this.state = State.PROCESS_QUEUE
        }
    }

    private processQueue() {
        if (this.solution.length === 0) {
            this.state = State.DONE
        } else {
            this.state = State.SEED_STREAMLINE
        }
    }

    private continueStreamline() {
        const isDone = this.streamlineIntegrator.next()
        if (isDone) {
            this.addStreamLineToQueue()
            this.state = State.SEED_STREAMLINE
        }
    }

    private addStreamLineToQueue() {
        const streamLinePoints = this.streamlineIntegrator.getStreamline()
        if (streamLinePoints.length > 1) {
            this.solution.push(this.streamlineIntegrator)
            if (this.options.onStreamlineAdded) {
                this.options.onStreamlineAdded(streamLinePoints, this.options)
            }
        }
    }
}

// ----------------------------------------------------------------------------

function assertNumber(x: any, msg: string) {
    if (typeof x !== 'number' || Number.isNaN(x)) throw new Error(msg)
}

function normalizeBoundingBox(bbox: any) {
    const msg = 'Bounding box {left, top, width, height} is required'
    if (!bbox) throw new Error(msg)

    assertNumber(bbox.left, msg)
    assertNumber(bbox.top, msg)
    if (typeof bbox.size === 'number') {
        bbox.width = bbox.size
        bbox.height = bbox.size
    }
    assertNumber(bbox.width, msg)
    assertNumber(bbox.height, msg)

    if (bbox.width <= 0 || bbox.height <= 0)
        throw new Error('Bounding box cannot be empty')
}
