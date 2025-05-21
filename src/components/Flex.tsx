

import type { React } from "@webpack/common";

export function Flex(props: React.PropsWithChildren<{
    flexDirection?: React.CSSProperties["flexDirection"];
    style?: React.CSSProperties;
    className?: string;
} & React.HTMLProps<HTMLDivElement>>) {
    props.style ??= {};
    props.style.display = "flex";
    // TODO(ven): Remove me, what was I thinking??
    props.style.gap ??= "1em";
    props.style.flexDirection ||= props.flexDirection;
    delete props.flexDirection;
    return (
        <div {...props}>
            {props.children}
        </div>
    );
}
