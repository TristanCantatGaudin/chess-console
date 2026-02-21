/**
 * PuzzleOpponent automatically plays the scripted PGN moves on its turn
 */

import {ChessConsolePlayer} from "../ChessConsolePlayer.js"
import {Chess} from "chess.mjs/src/Chess.js"

export class PuzzleOpponent extends ChessConsolePlayer {

    constructor(chessConsole, name, props = {}) {
        super(chessConsole, name)
        this.props = {delay: 1000}
        Object.assign(this.props, props)

        // Parse PGN into a move queue
        this.scriptQueue = []
        if (this.props.scriptPGN) {
            const tmpChess = new Chess()
            tmpChess.load_pgn(this.props.scriptPGN)
            this.scriptQueue = tmpChess.history({verbose: true}) // array of {from, to, promotion, san}
        }
    }

    moveRequest(fen, moveResponse) {
        const chess = this.chessConsole.state.chess
        if (chess.gameOver()) return

        // Determine current ply
        const currentPly = chess.plyCount()
        const nextMove = this.scriptQueue[currentPly]

        if (nextMove) {
            console.log(`Ply ${currentPly}: PuzzleOpponent plays ${nextMove.san}`)
            setTimeout(() => {
                moveResponse({
                    from: nextMove.from,
                    to: nextMove.to,
                    promotion: nextMove.promotion
                })
            }, this.props.delay)
        } else {
            console.warn("No scripted move for this ply!")
        }
    }
}