

import { getCurrentChannel } from "@utils/discord";
import { UserProfileStore, useStateFromStores } from "@webpack/common";

import { PronounsFormat, settings } from "./settings";

function useDiscordPronouns(id: string, useGlobalProfile: boolean = false): string | undefined {
    const globalPronouns: string | undefined = useStateFromStores([UserProfileStore], () => UserProfileStore.getUserProfile(id)?.pronouns);
    const guildPronouns: string | undefined = useStateFromStores([UserProfileStore], () => UserProfileStore.getGuildMemberProfile(id, getCurrentChannel()?.getGuildId())?.pronouns);

    if (useGlobalProfile) return globalPronouns;
    return guildPronouns || globalPronouns;
}

export function useFormattedPronouns(id: string, useGlobalProfile: boolean = false) {
    const pronouns = useDiscordPronouns(id, useGlobalProfile)?.trim().replace(/\n+/g, "");
    return settings.store.pronounsFormat === PronounsFormat.Lowercase ? pronouns?.toLowerCase() : pronouns;
}
