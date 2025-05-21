

/// <reference path="../src/modules.d.ts" />
/// <reference path="../src/globals.d.ts" />

import monacoHtmlLocal from "file://monacoWin.html?minify";
import monacoHtmlCdn from "file://../src/main/monacoWin.html?minify";
import * as DataStore from "../src/api/DataStore";
import { debounce } from "../src/utils";
import { EXTENSION_BASE_URL } from "../src/utils/web-metadata";
import { getTheme, Theme } from "../src/utils/discord";
import { getThemeInfo } from "../src/main/themes";
import { Settings } from "../src/Vencord";

// Discord deletes this so need to store in variable
const { localStorage } = window;

// listeners for ipc.on
const cssListeners = new Set<(css: string) => void>();
const NOOP = () => { };
const NOOP_ASYNC = async () => { };

const setCssDebounced = debounce((css: string) => VencordNative.quickCss.set(css));

const themeStore = DataStore.createStore("VencordThemes", "VencordThemeData");

// probably should make this less cursed at some point
window.VencordNative = {
    themes: {
        uploadTheme: (fileName: string, fileData: string) => DataStore.set(fileName, fileData, themeStore),
        deleteTheme: (fileName: string) => DataStore.del(fileName, themeStore),
        getThemesDir: async () => "",
        getThemesList: () => DataStore.entries(themeStore).then(entries =>
            entries.map(([name, css]) => getThemeInfo(css, name.toString()))
        ),
        getThemeData: (fileName: string) => DataStore.get(fileName, themeStore),
        getSystemValues: async () => ({}),
    },

    native: {
        getVersions: () => ({}),
        openExternal: async (url) => void open(url, "_blank")
    },

    updater: {
        getRepo: async () => ({ ok: true, value: "https://github.com/Vendicated/Vencord" }),
        getUpdates: async () => ({ ok: true, value: [] }),
        update: async () => ({ ok: true, value: false }),
        rebuild: async () => ({ ok: true, value: true }),
    },

    quickCss: {
        get: () => DataStore.get("VencordQuickCss").then(s => s ?? ""),
        set: async (css: string) => {
            await DataStore.set("VencordQuickCss", css);
            cssListeners.forEach(l => l(css));
        },
        addChangeListener(cb) {
            cssListeners.add(cb);
        },
        addThemeChangeListener: NOOP,
        openFile: NOOP_ASYNC,
        async openEditor() {
            const features = `popup,width=${Math.min(window.innerWidth, 1000)},height=${Math.min(window.innerHeight, 1000)}`;
            const win = open("about:blank", "VencordQuickCss", features);
            if (!win) {
                alert("Failed to open QuickCSS popup. Make sure to allow popups!");
                return;
            }

            win.baseUrl = EXTENSION_BASE_URL;
            win.setCss = setCssDebounced;
            win.getCurrentCss = () => VencordNative.quickCss.get();
            win.getTheme = () =>
                getTheme() === Theme.Light
                    ? "vs-light"
                    : "vs-dark";

            win.document.write(IS_EXTENSION ? monacoHtmlLocal : monacoHtmlCdn);
        },
    },

    settings: {
        get: () => {
            try {
                return JSON.parse(localStorage.getItem("VencordSettings") || "{}");
            } catch (e) {
                console.error("Failed to parse settings from localStorage: ", e);
                return {};
            }
        },
        set: async (s: Settings) => localStorage.setItem("VencordSettings", JSON.stringify(s)),
        getSettingsDir: async () => "LocalStorage"
    },

    pluginHelpers: {} as any,
};
