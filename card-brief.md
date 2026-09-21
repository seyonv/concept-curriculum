# Card-writer brief

Fill in the placeholders, append the card-specific brief, and send the result as the whole prompt to one subagent per card. Every subagent gets the same text except the last section.

---

You are writing ONE card in a curriculum of HTML explainer cards in DIR.

Read these first, fully:
- the concept-explainer skill: ~/.claude/skills/concept-explainer/SKILL.md and its template.html (card structure and style; follow them exactly)
- ~/.claude/skills/concept-curriculum/patterns.md (the curriculum's default patterns and colour meanings)
- DIR/_facts.md (the reader, the running example, the shared numbers; reuse them exactly and don't re-derive them)
- EXISTING_CARDS (one or two finished cards in this set: copy their `<head>`/`<style>` shell and voice)

Rules:
- Write only DIR/FILE. Don't edit any other file.
- Never invent a measured number. Reuse the measurements in _facts.md; a quick, light local check is fine, but run nothing load-sensitive. Otherwise research and cite a source link in the footer. Label anything made up "illustrative" on the card itself.
- Compute every number with a quick script and show the arithmetic on the card.
- Use MathML (patterns.md §1) when the mechanism is an equation. If the card names parts or terms, give each one a two-examples row (§3). If the numbers depend on the provider or setup, add a comparison table (§4). Follow the colour meanings (§7).
- Only state what a source actually says. If you're inferring, say so on the card.
- The footer's "Related:" line links to existing cards and to sibling cards from this list: SIBLINGS.
- Verify with the curriculum's gate. It starts its own private headless Chrome, so it's safe to run in parallel with other writers: `node ~/.claude/skills/concept-curriculum/verify.mjs DIR --only FILE --allow-missing --shots SCRATCH/FILE-shots`. `--allow-missing` stops sibling cards that aren't written yet from counting as broken links or missing index entries; it must print PASS. Read the light and dark screenshots it saves and fix what you see. Don't run load-sensitive measurements such as benchmarks; use the numbers in _facts.md. Don't use a shared browser daemon, and never use Chrome MCP tools.

Return:
1. the file path
2. a 3-line summary of what the card says
3. every researched or measured number with its source URL or command, so the overview cards can reuse it
4. anything you were unsure about, and which values are illustrative

## This card
FILE: …
Brief: title, aliases, the worked example to build around, the sources to look for, the grid alternatives, and the clarification box question.
