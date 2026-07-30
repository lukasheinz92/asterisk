---
name: code-audit
description: Perform a thorough manual audit of the Asterisk codebase - dead code, unused exports, security-sensitive file/path handling, and correctness bugs. Use when asked to audit, review, clean up, or "check" the codebase.
---

This methodology found a real path-traversal vulnerability and several
genuine correctness bugs (a tab-name crash, a silent drag-and-drop revert, a
broken default icon reference) that a quick skim would have missed - and a
second full pass afterward still caught two more dead-code spots the first
pass missed. Don't shortcut it.

## 1. Read every file completely

Read every file under `app/`, plus `simple-server.js`, `setup.ps1`,
`index.html`, and `styles/main.css` in full - not excerpts. Partial reads
miss the call site or CSS rule that proves something is (or isn't) actually
used.

## 2. Verify "unused" with grep across the whole repo, not impression

Before calling a method, class, or CSS class dead, grep for every reference
to it repo-wide. A method can be *defined* and still never *called* (e.g.
`TabSortManager` was imported but never instantiated); a CSS class can exist
with zero elements ever created with it. Confirm both directions - is it
defined, and is it reached - before flagging or deleting.

## 3. Scrutinize anything that builds a filesystem path from a URL

This is where the real vulnerability was: `simple-server.js` builds file
paths from `req.url` / `pathname`. Any `path.join(baseDir, userControlledSegment)`
is a path-traversal candidate unless the result is verified to stay inside
`baseDir` after resolution. Don't just read the code - prove it, by
attempting a real `../` traversal against the live server (use `restart-server`
first) targeting a file *outside* the repo (e.g. a sibling directory) as a
harmless proof target. Note: `path.resolve(base, segment)` treats a
leading-`/` segment as an absolute-path override on Windows (resets to the
drive root) - use `path.join` to combine segments, then `path.resolve` only
on the final combined path for the containment check.

## 4. Watch for mixed legacy/current data formats

`tabSortOrder` values are read as either legacy numbers or current
`"top-N"`/`"bottom-N"` strings depending on which code path touches them.
Any `.startsWith()` or similar string method call on a config-derived value
needs a `typeof x === 'string'` guard, checked consistently everywhere that
value is read - a guard present in one function and missing in its sibling
is exactly the kind of bug that slips through.

## 5. For anything touching drag-and-drop (SortableJS), verify against the DOM, don't compute

Any logic that computes a numeric position/index for a reorder (rather than
reading the actual final DOM order after a drop) is a likely source of
"reverts back" or "silently wrong position" bugs - a computed index can
collide with another item's existing position, and reconciling that
collision by re-sorting introduces tie-breaks unrelated to what was actually
dragged. Prefer reading `container.querySelectorAll(...)` for the real
post-drop order over trusting `evt.newIndex` composed into a stored value.

## 6. Categorize findings by severity before acting

- **Security**: fix immediately, verify the fix against the live server
  (`restart-server`), then report what was found and fixed.
- **Correctness bugs**: describe the concrete failure scenario, then ask
  before fixing unless trivial and unambiguous.
- **Dead code**: ask before deleting - the user may want it kept for future
  revival.
- **Maintenance/style notes** (duplicated constants, deprecated APIs,
  verbose logging): report only, no action needed.

## 7. Re-audit after applying fixes

A second full pass (steps 1-2 again) after fixes are applied reliably finds
things the first pass's momentum missed - e.g. a dead method that shared the
exact bug just fixed elsewhere, or CSS that was only reachable through code
just deleted. Don't treat one pass as final.
