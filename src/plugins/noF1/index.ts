

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoF1",
    description: "Disables F1 help bind.",
    authors: [Devs.Cyn],
    patches: [
        {
            find: ',"f1"],comboKeysBindGlobal:',
            replacement: {
                match: ',"f1"],comboKeysBindGlobal:',
                replace: "],comboKeysBindGlobal:",
            },
        },
    ],
});
