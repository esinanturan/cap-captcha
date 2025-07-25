import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { minify } from "terser";

const rustSrcDir = path.join(process.cwd(), "./src/rust");
const nodeOutDir = path.join(process.cwd(), "./src/node");
const browserOutDir = path.join(process.cwd(), "./src/browser");
const packageName = "cap_wasm";

console.log(`Cleaning old build directories...`);
try {
	fs.rmdirSync(nodeOutDir);
} catch {}
try {
	fs.rmdirSync(browserOutDir);
} catch {}

console.log(`\n  Building for Node...`);
execSync(
	`wasm-pack build "${rustSrcDir}" --target nodejs --out-dir "${nodeOutDir}" --out-name "${packageName}"`,
	{ stdio: "inherit" },
);

console.log(`\n  Building for web...`);
execSync(
	`wasm-pack build "${rustSrcDir}" --target web --out-dir "${browserOutDir}" --out-name "${packageName}"`,
	{ stdio: "inherit" },
);

console.log(`\n  Removing .gitignore...`);

[browserOutDir, nodeOutDir].forEach((dir) => {
	try {
		fs.rmSync(path.join(dir, ".gitignore"));
	} catch {}
});

console.log(`\n  Minifing loaders...`);

await Promise.all(
	[browserOutDir, nodeOutDir].map(async (dir) => {
		const loaderPath = path.join(dir, "cap_wasm.js");
		const code = fs.readFileSync(loaderPath, "utf8");
		const result = await minify(code);
		fs.writeFileSync(loaderPath, result.code);
	}),
);

console.log(`\n🎉 All builds finished successfully!\n`);

const doTest = prompt("test build? (y/N):").toLowerCase() === "y";

if (!doTest) {
	process.exit(0);
}

console.log(`\n  test...`);
execSync(`bun ${path.join("test", "node.js")}`, { stdio: "inherit" });

console.log(`\n  testing odd difficulty...`);
execSync(`bun ${path.join("test", "node_odd_difficulty.js")}`, {
	stdio: "inherit",
});

console.log(`\n  test finished!`);

const doPublish = prompt("publish build? (y/N):").toLowerCase() === "y";
if (!doPublish) {
	process.exit(0);
}
Bun.spawn({
	cmd: ["bun", "publish", "--access", "public"],
	cwd: "./src",
	stdout: "inherit",
});
