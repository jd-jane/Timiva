/**
 * Validates yearProgressThemeUrl pure helpers.
 * Run: node scripts/validate-year-progress-theme-url.mjs
 */
import {
	buildCurrentThemeUrl,
	buildThemeShareUrl,
	readThemeSearchParam,
	resolveInitialTheme,
} from "../src/lib/yearProgressThemeUrl.ts";

let passed = 0;
let failed = 0;

function assert(condition, message) {
	if (condition) {
		passed += 1;
		return;
	}

	failed += 1;
	console.error(`FAIL: ${message}`);
}

console.log("validate-year-progress-theme-url");

const validThemes = ["mist", "forest", "aurora", "sunset", "midnight"];

for (const theme of validThemes) {
	assert(readThemeSearchParam(`?theme=${theme}`) === theme, `?theme=${theme} → ${theme}`);
}

assert(readThemeSearchParam("?theme=Forest") === null, "?theme=Forest → null");
assert(readThemeSearchParam("?theme=FOREST") === null, "?theme=FOREST → null");
assert(readThemeSearchParam("?theme=blue") === null, "?theme=blue → null");
assert(readThemeSearchParam("?theme=") === null, "?theme= → null");
assert(readThemeSearchParam("") === null, "no theme → null");
assert(
	readThemeSearchParam("?theme=forest&theme=sunset") === "forest",
	"duplicate theme uses first URLSearchParams.get() value",
);

console.log("URL parsing: pass");

assert(
	resolveInitialTheme("sunset", "forest") === "sunset",
	"URL valid > storage valid",
);
assert(resolveInitialTheme(null, "forest") === "forest", "storage valid > Mist");
assert(resolveInitialTheme(null, null) === "mist", "absent URL and storage → mist");
assert(
	resolveInitialTheme(null, "sunset") === "sunset",
	"invalid/absent URL does not block valid storage",
);
assert(
	resolveInitialTheme("forest", null) === "forest",
	"valid URL without storage → URL theme",
);

console.log("Initial precedence: pass");

const shareUrl = buildThemeShareUrl(
	"https://timiva.app",
	"/en/year-progress/",
	"forest",
);
assert(
	shareUrl === "https://timiva.app/en/year-progress/?theme=forest",
	"clean Share URL strips unrelated query and hash",
);

const mistShareUrl = buildThemeShareUrl("https://timiva.app", "/zh/year-progress/", "mist");
assert(
	mistShareUrl === "https://timiva.app/zh/year-progress/?theme=mist",
	"Mist Share URL includes explicit ?theme=mist",
);

const currentUrl = buildCurrentThemeUrl(
	"https://timiva.app/en/year-progress/?source=test&theme=forest#faq",
	"sunset",
);
assert(
	currentUrl === "/en/year-progress/?source=test&theme=sunset#faq",
	"current URL sync preserves unrelated query and hash",
);

const appendedThemeUrl = buildCurrentThemeUrl(
	"https://timiva.app/en/year-progress/?source=test#faq",
	"forest",
);
assert(
	appendedThemeUrl === "/en/year-progress/?source=test&theme=forest#faq",
	"missing theme param is appended",
);

const replacedThemeUrl = buildCurrentThemeUrl(
	"https://timiva.app/en/year-progress/?theme=mist&source=test",
	"aurora",
);
assert(
	replacedThemeUrl === "/en/year-progress/?theme=aurora&source=test",
	"existing theme param is replaced",
);
assert(
	(new URL(`https://timiva.app${replacedThemeUrl}`).search.match(/theme=/g) ?? []).length === 1,
	"no duplicate theme params after update",
);

console.log("Current URL sync: pass");
console.log("Clean Share URL: pass");
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
	process.exitCode = 1;
}
