

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    source: {
        description: "Source to replace ban GIF with (Video or Gif)",
        type: OptionType.STRING,
        default: "https://i.imgur.com/wp5q52C.mp4",
        restartNeeded: true,
    }
});

export default definePlugin({
    name: "BANger",
    description: "Replaces the GIF in the ban dialogue with a custom one.",
    authors: [Devs.Xinto, Devs.Glitch],
    settings,
    patches: [
        {
            find: "#{intl::jeKpoq::raw}", // BAN_CONFIRM_TITLE
            replacement: {
                match: /src:\i\("?\d+"?\)/g,
                replace: "src:$self.source"
            }
        }
    ],
    get source() {
        return settings.store.source;
    }
});
