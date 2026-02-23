/**
 * MoveComment Component
 * Extracts PGN comments manually and shows comment for current ply
 */

import {Observe} from "cm-web-modules/src/observe/Observe.js"
import {CONSOLE_MESSAGE_TOPICS} from "../ChessConsole.js"

export class MoveComment {

    constructor(chessConsole) {

        this.chessConsole = chessConsole
        this.comments = []

        this.element = document.createElement("div")
        this.element.className = "move-comment mt-3 p-3 border rounded"
        this.element.style.display = "none"

        this.content = document.createElement("div")

        this.element.appendChild(this.content)

        chessConsole.componentContainers.right.appendChild(this.element)

        chessConsole.messageBroker.subscribe(CONSOLE_MESSAGE_TOPICS.initGame, () => {
            this.extractCommentsFromPgn()
            this.update()
        })

        Observe.property(chessConsole.state, "plyViewed", () => {
            this.update()
        })
    }

    extractCommentsFromPgn() {

        const pgn = this.chessConsole.props.pgn

        if (!pgn) {
            this.comments = []
            return
        }

        console.log("=== Extracting comments from PGN ===")

        this.comments = []

        let ply = 0

        // Remove headers
        const body = pgn.replace(/\[[^\]]*\]/g, "")

        // Tokenize moves and comments
        const tokens = body.split(/(\{[^}]*\})/)

        for (let token of tokens) {

            token = token.trim()
            if (!token) continue

            // Comment
            if (token.startsWith("{")) {

                const commentText = token.slice(1, -1).trim()

                this.comments.push({
                    ply: ply,
                    comment: commentText
                })

                continue
            }

            // Otherwise, move text
            const moves = token.split(/\s+/)

            for (let m of moves) {

                // Skip move numbers like "1." or "1..."
                if (/^\d+\./.test(m)) continue

                // Skip results
                if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(m)) continue

                ply++
            }
        }

        console.log("Extracted comments:", this.comments)
    }

    update() {

        const ply = this.chessConsole.state.plyViewed

        const commentObj = this.comments.find(c => c.ply === ply)

        if (commentObj && commentObj.comment.length > 0) {
            this.content.innerHTML = commentObj.comment
            this.element.style.display = "block"
        } else {
            this.element.style.display = "none"
        }
    }
}