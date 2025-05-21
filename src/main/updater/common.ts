

export const VENCORD_FILES = [
    IS_DISCORD_DESKTOP ? "patcher.js" : "tallycordDesktopMain.js",
    IS_DISCORD_DESKTOP ? "preload.js" : "tallycordDesktopPreload.js",
    IS_DISCORD_DESKTOP ? "renderer.js" : "tallycordDesktopRenderer.js",
    IS_DISCORD_DESKTOP ? "renderer.css" : "tallycordDesktopRenderer.css",
];

export function serializeErrors(func: (...args: any[]) => any) {
    return async function () {
        try {
            return {
                ok: true,
                value: await func(...arguments)
            };
        } catch (e: any) {
            return {
                ok: false,
                error: e instanceof Error ? {
                    // prototypes get lost, so turn error into plain object
                    ...e
                } : e
            };
        }
    };
}
