

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "ContextMenuAPI",
    description: "API for adding/removing items to/from context menus.",
    authors: [Devs.Nuckyz, Devs.Ven, Devs.Kyuuhachi],
    required: true,

    patches: [
        {
            find: "♫ (つ｡◕‿‿◕｡)つ ♪",
            replacement: {
                match: /(?=let{navId:)(?<=function \i\((\i)\).+?)/,
                replace: "$1=Vencord.Api.ContextMenu._usePatchContextMenu($1);"
            }
        },
        {
            find: "navId:",
            all: true,
            noWarn: true,
            replacement: [
                {
                    match: /navId:(?=.+?([,}].*?\)))/g,
                    replace: (m, rest) => {
                        // Check if this navId: match is a destructuring statement, ignore it if it is
                        const destructuringMatch = rest.match(/}=.+/);
                        if (destructuringMatch == null) {
                            return `contextMenuAPIArguments:typeof arguments!=='undefined'?arguments:[],${m}`;
                        }
                        return m;
                    }
                }
            ]
        }
    ]
});
