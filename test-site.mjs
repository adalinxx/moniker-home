// Checks the landing page without a browser: every local file it names
// exists, links point where they should, and the name search sends people
// to the app with the name normalized as the app expects.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
assert.match(html, /<html lang="en">/, "declares its language");
assert.match(html, /<meta name="viewport"/, "is responsive");
assert.match(html, /<title>[^<]+<\/title>/, "has a title");
assert.match(html, /<meta name="description" content="[^"]+">/, "has a description");

for (const [, target] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
  if (/^(?:https?:|mailto:)/.test(target)) continue;
  const path = decodeURIComponent(new URL(target, `file://${process.cwd()}/index.html`).pathname);
  assert.ok(existsSync(path.endsWith("/") ? `${path}index.html` : path), `local file exists: ${target}`);
}

// The app is served over HTTPS (Selfhold reaches only https pages), and every link to it agrees.
const APP = "https://app.moniker.bio/app/";
assert.ok(html.includes(`const APP = "${APP}";`), "the search opens the app at app.moniker.bio");
for (const [, href] of html.matchAll(/href="([^"]+)" data-app/g)) assert.equal(href, APP, "Open Moniker links go to the app");
assert.equal(html.match(/<form class="search" data-search>/g)?.length, 2, "a name search in the hero and at the end");
assert.ok(!html.includes("http://"), "no plain http links");

// The search's normalization, run as the page runs it.
const normalize = new Function("value", `return ${html.match(/const q = (form\.q\.value[^;]+);/)[1].replace("form.q.value", "value")};`);
for (const [typed, want] of [["@Rae Ok", "raeok"], ["  alice ", "alice"], ["@@x_1", "x_1"], ["", ""]]) {
  assert.equal(normalize(typed), want, `“${typed}” is searched as “${want}”`);
}
console.log("site ok");
