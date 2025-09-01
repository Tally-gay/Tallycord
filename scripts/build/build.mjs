#!/usr/bin/node
/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// @ts-check

import { readdir } from "fs/promises";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";

import { BUILD_TIMESTAMP, commonOpts, exists, globPlugins, IS_DEV, IS_REPORTER, IS_STANDALONE, IS_UPDATER_DISABLED, resolvePluginName, VERSION, commonRendererPlugins, watch, buildOrWatchAll, stringifyValues } from "./common.mjs";

const defines = stringifyValues({
    IS_STANDALONE,
    IS_DEV,
    IS_REPORTER,
    IS_UPDATER_DISABLED,
    IS_WEB: false,
    IS_EXTENSION: false,
    IS_USERSCRIPT: false,
    VERSION,
    BUILD_TIMESTAMP
});

if (defines.IS_STANDALONE === "false") {
    // If this is a local build (not standalone), optimize
    // for the specific platform we're on
    defines["process.platform"] = JSON.stringify(process.platform);
}

/**
 * @type {import("esbuild").BuildOptions}
 */
const nodeCommonOpts = {
    ...commonOpts,
    define: defines,
    format: "cjs",
    platform: "node",
    target: ["esnext"],
    // @ts-expect-error this is never undefined
    external: ["electron", "original-fs", "~pluginNatives", ...commonOpts.external]
};

const sourceMapFooter = s => watch ? "" : `//# sourceMappingURL=tallycord://${s}.js.map`;
const sourcemap = watch ? "inline" : "external";

/**
 * @type {import("esbuild").Plugin}
 */
const globNativesPlugin = {
    name: "glob-natives-plugin",
    setup: build => {
        const filter = /^~pluginNatives$/;
        build.onResolve({ filter }, args => {
            return {
                namespace: "import-natives",
                path: args.path
            };
        });

        build.onLoad({ filter, namespace: "import-natives" }, async () => {
            const pluginDirs = ["plugins", "userplugins"];
            let code = "";
            let natives = "\n";
            let i = 0;
            for (const dir of pluginDirs) {
                const dirPath = join("src", dir);
                if (!await exists(dirPath)) continue;
                const plugins = await readdir(dirPath, { withFileTypes: true });
                for (const file of plugins) {
                    const fileName = file.name;
                    const nativePath = join(dirPath, fileName, "native.ts");
                    const indexNativePath = join(dirPath, fileName, "native/index.ts");

                    if (!(await exists(nativePath)) && !(await exists(indexNativePath)))
                        continue;

                    const pluginName = await resolvePluginName(dirPath, file);

                    const mod = `p${i}`;
                    code += `import * as ${mod} from "./${dir}/${fileName}/native";\n`;
                    natives += `${JSON.stringify(pluginName)}:${mod},\n`;
                    i++;
                }
            }
            code += `export default {${natives}};`;
            return {
                contents: code,
                resolveDir: "./src"
            };
        });
    }
};

/** @type {import("esbuild").BuildOptions[]} */
const buildConfigs = ([
    // Discord Desktop main & renderer & preload
    {
        ...nodeCommonOpts,
        entryPoints: ["src/main/index.ts"],
        outfile: "dist/patcher.js",
        footer: { js: "//# sourceURL=file:///TallycordPatcher\n" + sourceMapFooter("patcher") },
        sourcemap,
        plugins: [
            // @ts-ignore this is never undefined
            ...(nodeCommonOpts.plugins || []),
            globNativesPlugin
        ],
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: "true",
            IS_VESKTOP: "false",
            IS_TALLYTOP: "false"
        }
    },
    {
        ...commonOpts,
        entryPoints: ["src/Vencord.ts"],
        outfile: "dist/renderer.js",
        format: "iife",
        target: ["esnext"],
        footer: { js: "//# sourceURL=file:///TallycordRenderer\n" + sourceMapFooter("renderer") },
        globalName: "Tallycord",
        sourcemap,
        plugins: [
            globPlugins("discordDesktop"),
            ...commonRendererPlugins
        ],
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: "true",
            IS_VESKTOP: "false",
            IS_TALLYTOP: "false"
        }
    },
    {
        ...nodeCommonOpts,
        entryPoints: ["src/preload.ts"],
        outfile: "dist/preload.js",
        footer: { js: "//# sourceURL=file:///TallycordPreload\n" + sourceMapFooter("preload") },
        sourcemap,
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: "true",
            IS_VESKTOP: "false",
            IS_TALLYTOP: "false"
        }
    },

    // Tallycord Desktop main & renderer & preload
    {
        ...nodeCommonOpts,
        entryPoints: ["src/main/index.ts"],
        outfile: "dist/tallycordDesktopMain.js",
        footer: { js: "//# sourceURL=file:///TallycordDesktopMain\n" + sourceMapFooter("tallycordDesktopMain") },
        sourcemap,
        plugins: [
            ...(nodeCommonOpts.plugins || []),
            globNativesPlugin
        ],
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: "false",
            IS_VESKTOP: "true",
            IS_TALLYTOP: "true"
        }
    },
    {
        ...commonOpts,
        entryPoints: ["src/Vencord.ts"],
        outfile: "dist/tallycordDesktopRenderer.js",
        format: "iife",
        target: ["esnext"],
        footer: { js: "//# sourceURL=file:///TallycordDesktopRenderer\n" + sourceMapFooter("tallycordDesktopRenderer") },
        globalName: "Tallycord",
        sourcemap,
        plugins: [
            globPlugins("vesktop"),
            ...commonRendererPlugins
        ],
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: "false",
            IS_VESKTOP: "true",
            IS_TALLYTOP: "true",
        }
    },
    {
        ...nodeCommonOpts,
        entryPoints: ["src/preload.ts"],
        outfile: "dist/tallycordDesktopPreload.js",
        footer: { js: "//# sourceURL=file:///TallycordPreload\n" + sourceMapFooter("tallycordDesktopPreload") },
        sourcemap,
        define: {
            ...defines,
            IS_DISCORD_DESKTOP: "false",
            IS_VESKTOP: "true",
            IS_TALLYTOP: "true"
        }
    }
]);

/**
 * Replace Vencord/VencordNative with Tallycord/TallycordNative in built files
 */
async function replaceVencordWithTallycord() {
    const distPath = "./dist";
    const files = await readdir(distPath);

    for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.map')) {
            const filePath = join(distPath, file);
            try {
                let content = await readFile(filePath, 'utf-8');

                // Replace all variations while preserving case
                content = content
                    .replace(/VencordNative/g, 'TallycordNative')
                    .replace(/vencordNative/g, 'tallycordNative')
                    .replace(/VENCORDNATIVE/g, 'TALLYCORDNATIVE')
                    .replace(/Vencord/g, 'Tallycord')
                    .replace(/vencord/g, 'tallycord')
                    .replace(/VENCORD/g, 'TALLYCORD');

                await writeFile(filePath, content);
                console.log(`Updated ${file}`);
            } catch (error) {
                console.warn(`Failed to update ${file}:`, error instanceof Error ? error.message : String(error));
            }
        }
    }
}

await buildOrWatchAll(buildConfigs);
await buildOrWatchAll(buildConfigs.map(b => ({
    ...b,
    outfile: b.outfile?.replace("tallycord", "tallycord")
})));

// Automatically replace Vencord with Tallycord in all built files
if (!watch) {
    console.log("Replacing Vencord with Tallycord in built files...");
    await replaceVencordWithTallycord();
    console.log("String replacement complete!");
}


