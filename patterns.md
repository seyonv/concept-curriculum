# Curriculum patterns

Default building blocks for curriculum cards. Each one is additive CSS on top of the concept-explainer template shell. Colours come only from the template's variables.

## Contents
1. Typeset formula (MathML) with symbol key
2. Ranked lever table grouped by formula part
3. Two-examples-side-by-side term table
4. Comparison table for provider- or setup-dependent things
5. Glossary cell: "the words people use"
6. Token stream chips and to-scale waterfall
7. Colour meanings (fix once per curriculum)

---

## 1. Typeset formula (MathML)

Use this in every overview card and any card whose mechanism is an equation. It's native MathML, so it needs no script. Keep the monospace `.formula` version underneath as "the same thing in plain text", and add one filled-in example as a caption using the running example.

```css
.mathbox{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:18px 16px 12px;margin:10px 0;overflow-x:auto}
.mathbox math{font-size:21px;color:var(--text);font-family:"STIX Two Math","Latin Modern Math","Cambria Math",math}
.mathbox .t1{color:var(--text)} .mathbox .t2{color:var(--accent)} .mathbox .t3{color:var(--muted)}
.mathbox .lab{font-size:12px;font-family:-apple-system,"Inter",system-ui,sans-serif;padding-top:3px;border-top:1.5px solid currentColor;margin-top:2px}
.legend{display:grid;grid-template-columns:auto 1fr auto;column-gap:14px;row-gap:5px;font-size:13px;margin-top:12px;align-items:baseline}
.legend .sym{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right}
.legend .v{color:var(--muted);text-align:right;font-variant-numeric:tabular-nums}
@media (max-width:560px){.legend{grid-template-columns:auto 1fr}.legend .v{display:none}}
```

```html
<div class="mathbox">
<math display="block">
  <msub><mi>T</mi><mtext>total</mtext></msub><mo>&#8776;</mo>
  <munderover><mo>&#8721;</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>N</mi></munderover>
  <mo stretchy="true" form="prefix" minsize="2.6em">[</mo>
  <munder class="t1"><mrow><msub><mi>t</mi><mtext>queue</mtext></msub><mo>+</mo><msub><mi>t</mi><mtext>prefill</mtext></msub></mrow><mtext class="lab">time to first token</mtext></munder>
  <mo>+</mo>
  <munder class="t2"><mfrac><msub><mi>n</mi><mtext>out</mtext></msub><msub><mi>v</mi><mtext>out</mtext></msub></mfrac><mtext class="lab">writing time</mtext></munder>
  <mo stretchy="true" form="postfix" minsize="2.6em">]</mo>
</math>
<div class="legend">
  <span class="sym">N</span><span>number of model calls</span><span class="v">1 for curl · many for an agent</span>
  <!-- one row per symbol: symbol | plain meaning | real range or a link to its card -->
</div>
</div>
<p class="cap">Filled in for the running example: … = … s.</p>
```

- Label each group of terms with `munder` + `.lab`. Don't use stretchy under-braces, because they render unreliably.
- The math font stack is required. Without it, brackets don't stretch in Chrome.

## 2. Ranked lever table, grouped by formula part

Group rows by which part of the formula a lever attacks (for example "fewer tokens", "faster tokens", "shorter start"). Each row needs a bold name with a one-line plain meaning, slow → fast with bold measured numbers, a speedup bar on a log scale, and who controls it. Grey rows (`.sp.add`) add or remove seconds instead of multiplying.

```css
.rank td{vertical-align:top}
.rank .grp td{padding-top:16px;font-size:12px;font-weight:600;color:var(--muted);letter-spacing:.02em}
.rank .grp td span{font-weight:400}
.rank .what{font-weight:600}
.rank .what small{display:block;font-weight:400;color:var(--muted);font-size:13px;margin-top:2px}
.rank .ex{color:var(--muted);font-size:13px} .rank .ex b{color:var(--text);font-weight:500}
.sp{display:flex;align-items:center;gap:8px;white-space:nowrap}
.sp em{display:block;width:90px;flex:none;height:8px;border-radius:2px;background:var(--surface2)}
.sp i{display:block;height:8px;border-radius:2px;background:var(--accent)}
@media (max-width:560px){.rank .ex{display:none}}
```

```html
<table class="rank">
  <colgroup><col style="width:27%"><col style="width:33%"><col style="width:20%"><col style="width:20%"></colgroup>
  <tr><th>Lever</th><th>Slow → fast, measured</th><th>Speedup</th><th>Who controls it</th></tr>
  <tr class="grp"><td colspan="4">FEWER TOKENS <span>· shrink the top of the fraction</span></td></tr>
  <tr><td class="what">Output length<small>how long the visible answer is</small></td>
      <td class="ex">Your M3: <b>653 tokens, 42.4 s</b> → <b>82 tokens, 5.4 s</b></td>
      <td><div class="sp"><em><i style="width:45%"></i></em><span class="hi">7.9×</span></div></td><td>You: prompt</td></tr>
</table>
```

Bar width = `log10(speedup) / log10(100) × 100%`, so each 10× is half the bar. Compute the widths with a script and say "log scale" in the lead-in.

## 3. Two examples side by side, for every term

Whenever a card names parts or terms (for example network, queue, cold start, prefill), define each one in plain words and give two contrasting real examples. Put a one-sentence everyday analogy above the table.

```css
.parts td{vertical-align:top} .parts td:first-child{font-weight:600;white-space:nowrap}
.parts .ex{font-size:13px} .parts .ex span{display:block;color:var(--muted)}
@media (max-width:560px){.parts .what{display:none}}
```

```html
<table class="parts">
  <tr><th>Part</th><th class="what">What actually happens</th><th>Example A: short</th><th>Example B: long</th></tr>
  <tr><td>Network</td><td class="what">Your request travels to the server and back…</td>
      <td class="ex"><b class="ok">0.3 ms</b><span>local server on your machine</span></td>
      <td class="ex"><b>53–77 ms</b><span>your machine → remote API</span></td></tr>
</table>
```

## 4. Comparison table when it depends on the provider or setup

If a number changes with who runs it or how it's configured (host, hardware, plan, region, library version), add a table that compares the real options side by side:

- One row per option. Columns: identity | configuration (chip, precision, caps, defaults) | price | the measured outcome.
- Fill configuration from a machine-readable source (for example the OpenRouter endpoints API) and outcomes from an independent benchmark. Write "not published" instead of guessing.
- Below the table, add a `.formula` with the two most telling ratios, such as "same company, two tiers" and "fastest vs cheapest".
- Where one exists, add a contrasting case where the options don't differ (for example a closed model priced the same everywhere).

## 5. Glossary cell: "the words people use"

Every overview card gets a 2x2 glossary grid that names what the field itself calls things. Put the scope terms first (for example "inference latency" = one call vs "end-to-end latency" = the whole task), neighbouring terms next, and the term the curriculum argues matters most in the `.win` cell.

## 6. Token stream chips and to-scale waterfall

Chips: use these for sequences. Label the words as illustrative whenever the counts are real but the words are made up.

```css
.stream{display:grid;grid-template-columns:96px 1fr;column-gap:12px;row-gap:12px;align-items:center}
.chips{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.chips span{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;padding:3px 6px;border-radius:4px;border:1px solid var(--border);background:var(--surface)}
.chips .t{background:var(--surface2);color:var(--muted)}
.chips .a{background:var(--accent-bg);border-color:var(--accent-border);color:var(--accent)}
.chips .gap{border:none;background:none;color:var(--muted);font-family:inherit}
```

Waterfall: use this for "where the time goes". Reuse the template's `.bars` grid and offset each bar with `margin-left:<previous parts>%` so the segments tile the total. Below it, add a `.formula` whose parts sum exactly to the measured total.

## 7. Colour meanings

Decide these once, write them into `_facts.md`, and give them to every card writer:

| Colour | Meaning |
|---|---|
| green `--accent` | the useful or visible part, the winner, the faster option |
| grey `--faint` / `--surface2` | hidden, overhead or waiting parts (for example thinking tokens, queue) |
| red `--red` | ✗, cutoffs, waste, the slowest or worst value |

The same thing must always get the same colour across cards (for example, thinking is always grey and the answer always green).
