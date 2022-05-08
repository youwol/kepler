import { Serie } from '@youwol/dataframe'
//import { createStreamLines, StreamLinesParameters } from '../lib'
// import { streamlines2D } from '../lib'

const positions = Serie.create({
    array: [0,0,0, 1,0,0, 1,1,0, 0,1,0],
    itemSize: 3
})

const indices = Serie.create({
    array: [0,1,2, 0,2,3],
    itemSize: 3
})

const field = Serie.create({
    array: [0,0,0, 2,0,0, 1,-1,0, 0,2,0],
    itemSize: 3
})

test('streamlines', () => {    
    // createStreamLines(positions, indices, field, new StreamLinesParameters({
    //     onStreamlineAddedCB: pts => console.log('added',pts.length,'points')
    // }) )
})
