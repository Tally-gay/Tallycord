

import { maybePromptToUpdate } from "@utils/updater";

export function handleComponentFailed() {
    maybePromptToUpdate(
        "Uh Oh! Failed to render this Page." +
        " However, there is an update available that might fix it." +
        " Would you like to update and restart now?"
    );
}
