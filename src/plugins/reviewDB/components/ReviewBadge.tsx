

import { MaskedLink, React, Tooltip } from "@webpack/common";
import { HTMLAttributes } from "react";

import { Badge } from "../entities";
import { cl } from "../utils";

export default function ReviewBadge(badge: Badge & { onClick?(): void; }) {
    const Wrapper = badge.redirectURL
        ? MaskedLink
        : (props: HTMLAttributes<HTMLDivElement>) => (
            <span {...props} role="button">{props.children}</span>
        );

    return (
        <Tooltip
            text={badge.name}>
            {({ onMouseEnter, onMouseLeave }) => (
                <Wrapper className={cl("blocked-badge")} href={badge.redirectURL!} onClick={badge.onClick}>
                    <img
                        className={cl("badge")}
                        width="22px"
                        height="22px"
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        src={badge.icon}
                        alt={badge.description}
                    />
                </Wrapper>
            )}
        </Tooltip>
    );
}
