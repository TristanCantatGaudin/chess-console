/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Adapted for Puzzle Mode by AI
 * Repository: https://github.com/shaack/chess-console
 * License: MIT
 */

import {COLOR, INPUT_EVENT_TYPE} from "cm-chessboard/src/Chessboard.js"
import {Chess} from "chess.mjs/src/Chess.js"
import {ChessConsolePlayer} from "../ChessConsolePlayer.js"
import {PremoveManager} from "./PremoveManager.js"

export class PuzzlePlayer extends ChessConsolePlayer {

    constructor(chessConsole, name, props) {
        super(chessConsole, name)

        this.props = {
            allowPremoves: false,
            scriptPGN: null
        }
        Object.assign(this.props, props)

        this.premoveManager = new PremoveManager(chessConsole)

        // --- Parse PGN into move queue ---
        this.scriptQueue = []
        if (this.props.scriptPGN) {
            const tmpChess = new Chess()
            tmpChess.load_pgn(this.props.scriptPGN)
            this.scriptQueue = tmpChess.history({verbose: true}) // array of move objects {from, to, promotion, san}
        }
    }

    // --- Handle move input events from cm-chessboard ---
    chessboardMoveInputCallback(event, moveResponse) {
        const isPlayerTurn = this.chessConsole.playerToMove() === this
        if (isPlayerTurn) {
            return this.handlePlayerMove(event, moveResponse)
        } else {
            return this.handlePremove(event)
        }
    }

    handlePlayerMove(event, moveResponse) {
        if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
            const gameFen = this.chessConsole.state.chess.fen()
            return this.validateMoveAndPromote(gameFen, event.squareFrom, event.squareTo, moveResponse)
        }

        if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
            return this.handleMoveInputStarted(event)
        }
    }

    handleMoveInputStarted(event) {
        if (this.chessConsole.state.plyViewed !== this.chessConsole.state.chess.plyCount()) {
            this.chessConsole.state.plyViewed = this.chessConsole.state.chess.plyCount()
            return false
        }

        const possibleMoves = this.chessConsole.state.chess.moves({square: event.square})
        if (possibleMoves.length > 0) {
            return true
        }

        this.chessConsole.messageBroker.publish('illegalMove', {move: {from: event.squareFrom}})
        return false
    }

    handlePremove(event) {
        if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
            this.premoveManager.add(event)
        }
        return true
    }

    // --- Called when it's this player's turn ---
    moveRequest(fen, moveResponse) {
        this.premoveManager.initContextMenu()
        if (this.chessConsole.state.chess.gameOver()) return

        // Execute queued premove
        if (this.premoveManager.hasPremoves()) {
            const premoveEvent = this.premoveManager.shift()
            setTimeout(() => this.chessboardMoveInputCallback(premoveEvent, moveResponse), 20)
            return
        }

        // Enable normal move input
        const chessboard = this.chessConsole.components.board.chessboard
        if (!chessboard.isMoveInputEnabled()) {
            const color = this.chessConsole.state.chess.turn() === 'w' ? COLOR.white : COLOR.black
            chessboard.enableMoveInput((event) => this.chessboardMoveInputCallback(event, moveResponse), color)
        }
    }

    // --- Validate move, handle promotion, enforce PGN ---
    validateMoveAndPromote(fen, squareFrom, squareTo, callback) {
        const chess = this.chessConsole.state.chess
        const currentPly = chess.plyCount()

        const isChess960 = chess.props.gameVariant === 'chess960'
        const tmpChess = new Chess(fen, isChess960 ? {chess960: true} : undefined)
        const move = {from: squareFrom, to: squareTo}
        let moveResult = tmpChess.move(move)

        // Check for normal move
        if (!moveResult) {
            // Maybe it's a promotion move
            const piece = tmpChess.get(squareFrom)
            if (piece && piece.type === "p") {
                const possibleMoves = tmpChess.moves({square: squareFrom, verbose: true})
                for (const possibleMove of possibleMoves) {
                    if (possibleMove.to === squareTo && possibleMove.promotion) {
                        this.showPromotionDialog(squareTo, tmpChess.turn(), move, tmpChess, (result) => {
                            this._postMoveCheck(result, currentPly, callback)
                        })
                        return true
                    }
                }
            }
            callback(null)
            return false
        }

        // Post-move verification
        this._postMoveCheck(moveResult, currentPly, callback)
        return true
    }

    _postMoveCheck(moveResult, ply, callback) {
        console.log(`Ply ${ply}: Player attempted move ${moveResult.san}`)

        // Verify against PGN script
        const expectedMove = this.scriptQueue[ply]
        if (expectedMove) {
            if (moveResult.from !== expectedMove.from || moveResult.to !== expectedMove.to || moveResult.promotion !== expectedMove.promotion) {
                console.log(`Move not allowed! Expected ${expectedMove.san}. Undoing...`)
                callback(moveResult) // execute for a moment
                setTimeout(() => this.chessConsole.undoMove(), 10)
                return
            }
        }

        callback(moveResult)
    }

    showPromotionDialog(square, color, move, chess, callback) {
        const chessboard = this.chessConsole.components.board.chessboard
        chessboard.showPromotionDialog(square, color, (event) => {
            if (event.piece) {
                move.promotion = event.piece.charAt(1)
                callback(chess.move(move))
            } else {
                callback(null)
            }
        })
    }
}