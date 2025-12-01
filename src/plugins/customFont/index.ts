import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

function applyGoogleFont(fontInput: string, target: "main" | "mono") {
    const isUrl = fontInput.startsWith("http");
    const fontName = isUrl
        ? decodeURIComponent(fontInput.split("family=")[1]?.split("&")[0] || "sans-serif").replace(/\+/g, " ")
        : fontInput;

    const fontUrl = isUrl
        ? fontInput
        : `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontInput).replace(/%20/g, "+")}&display=swap`;

    const styleId = target === "main" ? "google-font-style" : "google-font-mono-style";
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
    @import url('${fontUrl}');
    ${target === "main"
            ? `
            :not(code):not(pre):not(.codeBlock-2FSg53):not(.markup-eYLPri code):not(.hljs):not([class*="code"]):not([class^="dnsFont__"]) {
                font-family: '${fontName}', sans-serif !important;
            }
        `
            : `
            code,
            pre,
            .codeBlock-2FSg53,
            .markup-eYLPri code,
            .hljs,
            [class*="code"] {
                font-family: '${fontName}', monospace !important;
            }
        `
        }
`;

}

function disableGoogleFont(target: "main" | "mono") {
    const styleId = target === "main" ? "google-font-style" : "google-font-mono-style";
    const styleTag = document.getElementById(styleId);
    if (styleTag) {
        styleTag.remove();
    }
}

export default definePlugin({
    name: "CustomFont",
    description: "Allows you to set a custom font for Discord, with optional monospace overrides for code blocks.",
    authors: [Devs.tally],
    start() {
        const { font, monospaceFont } = this.settings.store;
        if (font) applyGoogleFont(font, "main");
        if (monospaceFont) applyGoogleFont(monospaceFont, "mono");
    },
    stop() {
        disableGoogleFont("main");
        disableGoogleFont("mono");
    },
    settings: definePluginSettings({
        font: {
            type: OptionType.STRING,
            default: "Arial",
            description: "Google Font name or URL for general text (not code blocks).",
            onChange: (value) => {
                if (value) {
                    applyGoogleFont(value, "main");
                } else {
                    disableGoogleFont("main");
                }
            },
        },
        monospaceFont: {
            type: OptionType.STRING,
            default: "",
            description: "Google Font name or URL to apply only to code blocks and monospace text.",
            onChange: (value) => {
                if (value) {
                    applyGoogleFont(value, "mono");
                } else {
                    disableGoogleFont("mono");
                }
            },
        },
    }),
});
