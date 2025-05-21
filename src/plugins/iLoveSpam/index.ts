

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "iLoveSpam",
    description: "Do not hide messages from 'likely spammers'",
    authors: [Devs.botato, Devs.Nyako],
    patches: [
        {
            find: "hasFlag:{writable",
            replacement: {
                match: /if\((\i)<=(?:0x40000000|(?:1<<30|1073741824))\)return/,
                replace: "if($1===(1<<20))return false;$&",
            },
        },
    ],
});
