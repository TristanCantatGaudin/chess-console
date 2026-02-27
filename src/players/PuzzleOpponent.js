/**
 * PuzzleOpponent automatically plays the scripted PGN moves on its turn
 * Now verifies that the user played the correct move before responding
 */

import {ChessConsolePlayer} from "../ChessConsolePlayer.js"
import {Chess} from "chess.mjs/src/Chess.js"

export class PuzzleOpponent extends ChessConsolePlayer {

    constructor(chessConsole, name, props = {}) {
        super(chessConsole, name)
        this.props = {delay: 1000} // default delay before playing
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

        const currentPly = chess.plyCount()
        const lastPlayerPly = currentPly - 1

        // Determine what the player was expected to play
        const expectedPlayerMove = this.scriptQueue[lastPlayerPly]

        // Delay a bit to let the player move settle
        setTimeout(() => {

            const actualLastMove = chess.history({verbose: true})[lastPlayerPly]
            
            if (expectedPlayerMove && (!actualLastMove || 
                actualLastMove.from !== expectedPlayerMove.from || 
                actualLastMove.to !== expectedPlayerMove.to || 
                actualLastMove.promotion !== expectedPlayerMove.promotion)) {
                
                console.warn(`PuzzleOpponent notices the player did NOT play the expected move!`)
                console.warn(`Expected: ${expectedPlayerMove.san}, Actual: ${actualLastMove ? actualLastMove.san : "none"}`)
                // Do NOT play the scripted move yet
                return

            } else {
                if (expectedPlayerMove) {
                    console.log(`PuzzleOpponent notices the player played the expected move: ${expectedPlayerMove.san}`)
                } else {
                    console.log(`PuzzleOpponent has no expected player move at this ply ${lastPlayerPly}`)
                }

                // Play the scripted move
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

        }, 100) // small wait to ensure player move settled
    }
}