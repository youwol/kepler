import { Vector } from './Vector'

class Cell {
    children: Array<any> = undefined
    occupy(point: Vector) {
        if (this.children === undefined) {
            this.children = []
        }
        this.children.push(point)
    }
    isTaken(x: number, y: number, checkCallback: Function) {
        if (this.children === undefined) {
            return false
        }
        for (let i = 0; i < this.children.length; ++i) {
            const p = this.children[i]
            const dx = p.x - x,
                dy = p.y - y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (checkCallback(dist, p)) {
                return true
            }
        }
        return false
    }
}

export function createLookupGrid(bbox: any, dSep: number) {
    const bboxSize = Math.max(bbox.width, bbox.height)
    const cellsCount = Math.ceil(bboxSize / dSep)
    const cells = new Map()
    return {
        occupyCoordinates,
        isTaken,
        isOutside,
    }

    function isOutside(x: number, y: number) {
        return (
            x < bbox.left ||
            x > bbox.left + bbox.width ||
            y < bbox.top ||
            y > bbox.top + bbox.height
        )
    }

    function occupyCoordinates(point: Vector) {
        const x = point.x,
            y = point.y
        getCellByCoordinates(x, y).occupy(point)
    }

    function isTaken(x: number, y: number, checkCallback: Function) {
        if (!cells) {
            return false
        }
        const cx = gridX(x)
        const cy = gridY(y)
        for (let col = -1; col < 2; ++col) {
            const currentCellX = cx + col
            if (currentCellX < 0 || currentCellX >= cellsCount) {
                continue
            }

            const cellRow = cells.get(currentCellX)
            if (!cellRow) {
                continue
            }

            for (let row = -1; row < 2; ++row) {
                const currentCellY = cy + row
                if (currentCellY < 0 || currentCellY >= cellsCount) {
                    continue
                }

                const cellCol = cellRow.get(currentCellY)
                if (!cellCol) {
                    continue
                }
                if (cellCol.isTaken(x, y, checkCallback)) {
                    return true
                }
            }
        }

        return false
    }

    function getCellByCoordinates(x: number, y: number) {
        assertInBounds(x, y)
        const rowCoordinate = gridX(x)
        let row = cells.get(rowCoordinate)
        if (!row) {
            row = new Map()
            cells.set(rowCoordinate, row)
        }
        const colCoordinate = gridY(y)
        let cell = row.get(colCoordinate)
        if (!cell) {
            cell = new Cell()
            row.set(colCoordinate, cell)
        }
        return cell
    }

    function gridX(x: number) {
        return Math.floor((cellsCount * (x - bbox.left)) / bboxSize)
    }

    function gridY(y: number) {
        return Math.floor((cellsCount * (y - bbox.top)) / bboxSize)
    }

    function assertInBounds(x: number, y: number) {
        if (bbox.left > x || bbox.left + bboxSize < x) {
            throw new Error('x is out of bounds')
        }
        if (bbox.top > y || bbox.top + bboxSize < y) {
            throw new Error('y is out of bounds')
        }
    }
}
