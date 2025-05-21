

import "./ErrorCard.css";

import { classes } from "@utils/misc";
import type { HTMLProps } from "react";

export function ErrorCard(props: React.PropsWithChildren<HTMLProps<HTMLDivElement>>) {
    return (
        <div {...props} className={classes(props.className, "vc-error-card")}>
            {props.children}
        </div>
    );
}
