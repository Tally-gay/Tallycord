

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoRPC",
    description: "Disables Discord's RPC server.",
    authors: [Devs.Cyn],
    patches: [
        {
            find: '.ensureModule("discord_rpc")',
            replacement: {
                match: /\.ensureModule\("discord_rpc"\)\.then\(\(.+?\)}\)}/,
                replace: '.ensureModule("discord_rpc")}',
            },
        },
    ],
});
