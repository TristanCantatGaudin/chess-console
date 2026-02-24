This is a clone/fork of https://github.com/shaack/chess-console

## Additions

- src/MoveComment.js    
- src/players/PuzzlePlayer.js
- src/players/PuzzleOpponent.js
- examples/puzzle-read-lichess.html
- examples/puzzle-read-local.html

Loads a random PGN from a list of lichess studies, make it playable like a puzzle, with comments (similar to lichess interactive studies but without variations).

`examples/puzzle-read-lichess.html` only works if the app is served with `python3 server.py`, which avoids CORS errors by setting a proxy for grabbing PGNs directly from lichess.

# Todo

* add titles in lichess_study_list?
* new local studies
* split: all, just some
* fix comment mismatch when variations
