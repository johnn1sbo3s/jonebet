# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/` inside this repo, tracked in git.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is the bold line `**Status:**` near the top of each issue file — one of the triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) or `done` once the work is finished (see `triage-labels.md`). `resolved` belongs to wayfinding children only
- A finished ticket keeps its file in `issues/` with `Status: done`; there is no `done/` folder
- Comments and conversation history append to the bottom of the file under a `## Comments` heading
- Cross-repo features: the spec lives once, in the repo that owns the effort. A repo that only owns some tickets keeps them here and adds a `README.md` in the feature directory pointing at the owner's spec

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` in this repo (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body)
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins
- **Claim**: set `Status: claimed` and save before any work
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`
