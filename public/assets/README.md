# Public assets

`assets/fighters/` is the preferred location for vendored fighter sprite sheets.

Run `npm run assets:vendor` on a machine with internet access to copy the pinned, licensed sprite sheets into this folder. The game is local-first: when a file exists here it is used; otherwise the immutable mirror URL is attempted; if both fail, the procedural fighter renderer keeps the match playable.
