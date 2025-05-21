

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "BetterUploadButton",
    authors: [Devs.fawn, Devs.Ven],
    description: "Upload with a single click, open menu with right click",
    patches: [
        {
            find: '"ChannelAttachButton"',
            replacement: [
                {
                    // FIXME(Bundler spread transform related): Remove old compatiblity once enough time has passed, if they don't revert
                    match: /\.attachButtonInner,"aria-label":.{0,50},onDoubleClick:(.+?:void 0),.{0,30}?\.\.\.(\i),/,
                    replace: "$&onClick:$1,onContextMenu:$2.onClick,",
                    noWarn: true
                },
                {
                    match: /\.attachButtonInner,"aria-label":.{0,50},onDoubleClick:(.+?:void 0),.{0,100}\},(\i)\).{0,100}children:\i/,
                    replace: "$&,onClick:$1,onContextMenu:$2.onClick,",
                },
            ]
        },
    ],
});
