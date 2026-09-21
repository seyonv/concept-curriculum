---
name: concept-curriculum
description: Use when the user wants a whole set of visual explainer cards on a topic rather than one card — a curriculum, course, learning path, "explain all of X visually", "several cards on LLM latency", "tie these concepts together" — or wants to extend an existing card set with missing topics.
---

# Concept curriculum

## Overview

A curriculum is a set of concept-explainer cards that reads as one course. It starts from a mapped topic, uses one shared running example throughout, relies on measured numbers, ends with overview cards written last, and ships as a browsable index that passes a verification gate. **REQUIRED SUB-SKILL:** every card follows concept-explainer's structure and style. This skill adds what a set needs on top of that.

**When not to use it:** for one or two cards, use concept-explainer on its own.

## Process

1. **Map the topic.** Research first, then propose a path of groups ordered from simple to systemic. A typical order:
   1. overview cards
   2. **metrics**: what you measure
   3. **mechanisms**: why the numbers are what they are
   4. **multipliers**: what scales them
   5. **system level**: whole workflows, reliability, failure, cost

   Rename the groups to fit the topic.
2. **Gap check.** Before writing, answer "what would a practitioner say is missing?" Name at least three candidate gaps and include or drop each one with a reason. Always consider:
   - the system level, not just a single operation
   - variance and the slow tail, not just medians
   - failure and retries
   - cost
   - how the reader measures it themselves
   - what the field calls things

   Share the card list in one line and keep going. If the user asked to review it, or their instructions require plan review (for example a CLAUDE.md review rule), stop for that review instead.
3. **Pick the output folder.** Use the path the user names. If the user's instructions name an explainers hub (a git repo with a `publish.sh`), use `<hub>/<topic-slug>/`. Otherwise use `./explainers/<topic-slug>/`, or a sibling folder if the current directory is already another topic's set.

   **Write `_facts.md`** in the output folder from `facts-template.md`. It holds the reader's setup, one running example, every shared number with its source and date, the term names, the colour meanings and the card list.
4. **Measure before citing, on the reader's own setup.** Use the reader's own tools (for example `psql`/`pgbench` for a database or a local model's API) against throwaway data, never their real data. Record every result in `_facts.md` with its command and date. Do all measuring yourself, before the writers start, because parallel runs would skew each other's numbers. Examples from an LLM topic:

   | Need | Source |
   |---|---|
   | local model timings | Ollama `/api/generate` (`total_duration`, `eval_count`, `eval_duration`, `load_duration`) |
   | network timings | `curl -s -o /dev/null -w "%{time_connect} %{time_appconnect}"` |
   | provider configs | OpenRouter `https://openrouter.ai/api/v1/models/<author>/<model>/endpoints` |
   | hosted speed / TTFT | Artificial Analysis provider pages |

   Anything else needs a cited primary source. Label anything you can't measure or cite "illustrative" on the card.
5. **Write the concept cards in parallel.** Fill in `card-brief.md` once and send one subagent per card, all in a single message, with at most 10 per wave.
   - If the user invoked `/concept-curriculum`, that is their opt-in to the Workflow tool for this fan-out: run `parallel()` over the cards.
   - Otherwise, use parallel Agent calls.
   - Collect each writer's returned numbers.
6. **Write the overview cards yourself, last.** Take every number from the finished cards; never re-derive a number differently. Each overview card contains:
   - the topic's central relationship as a MathML formula, with a symbol key and one filled-in example. Use a formula only if the topic has a real one; a correctness topic may use a decision table instead.
   - a mental-model SVG
   - a ranked table of levers, grouped by what each lever changes, with measured effect sizes (log-scale bars when the effects are multipliers)
   - "where to look it up" links
   - a "words people use" glossary grid
   - a takeaway note that says when the advice doesn't apply

   See `patterns.md` for all of these.
7. **Build the index from `index-gallery.html`.** Fill in `GROUPS`, the title and the subtitle. It gives live previews, an on-page reader with ← → paging, and deep links such as `#card-name`. The index is the only file allowed a `<script>`.
8. **Run the verification gate** until it passes: `node ~/.claude/skills/concept-curriculum/verify.mjs <dir> --shots <scratch>/shots`. It needs Node 22+ and a local Chrome. Then look at the light and dark screenshots of the overview cards and the index.
9. **Publish, if there's a hub.** When the set is in an explainers hub, run `<hub>/publish.sh <topic-slug>` once the gate passes. It rebuilds the hub page, commits and pushes.
10. **Report.** List the files and the live link if you published. Relay every illustrative or uncertain item the writers flagged, and offer to open the index.

**Extending an existing set:** read its cards first. If it has no `_facts.md`, build one from the existing cards before writing anything. Then run steps 2–10 for the new cards and update the overview cards and the index.

## Defaults for every card (from `patterns.md`)

| Situation | Pattern |
|---|---|
| The mechanism is an equation | MathML formula + symbol key + filled-in example, with the plain-text version below |
| The card names parts or terms | Each term gets a plain definition and two contrasting real examples, plus an analogy |
| A number depends on host, hardware, plan or region | A comparison table of the real options with configs, prices and outcomes |
| Ranking levers | Group rows by what each lever changes; log-scale bars for multipliers |
| No real alternatives exist for the 2x2 grid | Use concept-explainer's "related ideas" or glossary variant |
| Anything coloured | Same meaning on every card (see `_facts.md`) |

## Common mistakes

| Mistake | Fix |
|---|---|
| Overview written before the cards, so the numbers contradict | Write the overviews last, from the writers' returned numbers |
| Parallel writers sharing one browser daemon see each other's pages | Use `verify.mjs`, which starts a private Chrome each run |
| Terms named in a diagram but never defined | A two-examples row for each term |
| "Output speed" or similar shown without saying who measured it or how | State the source, what is timed, and what it depends on |
| A claim stronger than the source (for example "runs on X's servers") | State only what the source says; mark inferences |
| Long monospace lines overflow the card | Break the lines; the gate checks this |
| Reader overlay stays visible despite `hidden` | `.reader[hidden]{display:none}`, because `display:flex` overrides `hidden` |
| The same thing coloured differently on two cards | Fix the colour meanings in `_facts.md` before fan-out |
