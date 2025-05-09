/*
 * Tallycord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { UserStore, useStateFromStores } from "@webpack/common";
import { ReactNode } from "react";

const UserMentionComponent = findComponentByCodeLazy(".USER_MENTION)");

interface UserMentionComponentProps {
    id: string;
    channelId: string;
    guildId: string;
    originalComponent: () => ReactNode;
}

export default definePlugin({
    name: "FullUserInChatbox",
    description: "Makes the user mention in the chatbox have more functionalities, like left/right clicking",
    authors: [Devs.sadan],

    patches: [
        {
            find: ':"text":',
            replacement: {
                match: /(hidePersonalInformation\).+?)(if\(null!=\i\){.+?return \i)(?=})/,
                replace: "$1return $self.UserMentionComponent({...arguments[0],originalComponent:()=>{$2}});"
            }
        }
    ],

    UserMentionComponent: ErrorBoundary.wrap((props: UserMentionComponentProps) => {
        const user = useStateFromStores([UserStore], () => UserStore.getUser(props.id));
        if (user == null) {
            return props.originalComponent();
        }

        return <UserMentionComponent
            // This seems to be constant
            className="mention"
            userId={props.id}
            channelId={props.channelId}
        />;
    }, {
        fallback: ({ wrappedProps: { originalComponent } }) => originalComponent()
    })
});
