

import { React } from "@webpack/common";

interface Props extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    disabled?: boolean;
}

export function Link(props: React.PropsWithChildren<Props>) {
    if (props.disabled) {
        props.style ??= {};
        props.style.pointerEvents = "none";
        props["aria-disabled"] = true;
    }
    return (
        <a role="link" target="_blank" {...props}>
            {props.children}
        </a>
    );
}
