# Working on Brent Football

The app is `index.html` (plus `selection.js`, `sw.js`) on GitHub Pages, with Supabase and the `notify` Edge Function (`supabase/functions/notify/index.ts`).

## Every release, without exception

1. **Version:** use MAJOR.MINOR (see `docs/SOLUTION_DESIGN.md` section 1.1).
   - **Minor:** wording, layout, small rule changes and fixes.
   - **Major:** new workflows, new or changed tables, or changes to squad, team or money logic.
2. **Update `docs/SOLUTION_DESIGN.md`** in the same pull request:
   - the version and release in the header;
   - a revision history row;
   - every section the change affects (requirements, components, data, integration, security, UX, defaults, decisions, risks, roadmap, glossary).

   Check that its mermaid diagrams still render. The organisers require this for every change, even a small one.
3. **Update `docs/SYSTEM_SPEC.md`** (version, revision row, affected pages) and the README's "Current release".
4. **Bump `APP_VERSION`** in `index.html`. The version shows on the front page.
5. **Show the organisers** a mock-up or screenshots before deploying anything visual, and deploy only when they say so.
6. **Test before pushing:**
   - Playwright in Chromium at 390px and 1280px, with outside network blocked and no page errors or sideways scroll;
   - for function changes, Deno against a mock database.

## Things to keep in step

- The squad rules in `selection.js` are copied exactly into the function between `// BEGIN selection.js` and `// END selection.js`. Change both together. Supabase can't import from the website.
- The function is deployed by an organiser pasting it into the Supabase dashboard (Verify JWT off). New SQL files are run by hand. Say so in the release notes.
- Every new table needs explicit `grant` lines in its SQL file.
