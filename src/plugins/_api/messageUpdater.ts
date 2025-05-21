

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "MessageUpdaterAPI",
    description: "API for updating and re-rendering messages.",
    authors: [Devs.Nuckyz],

    patches: [
        {
            // Message accessories have a custom logic to decide if they should render again, so we need to make it not ignore changed message reference
            find: "}renderEmbeds(",
            replacement: {
                match: /(?<=this.props,\i,\[)"message",/,
                replace: ""
            }
        }
    ]
});
