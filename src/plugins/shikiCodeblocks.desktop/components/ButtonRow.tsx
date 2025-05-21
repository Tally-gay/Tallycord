

import { cl } from "../utils/misc";
import { CopyButton } from "./CopyButton";

export interface ButtonRowProps {
    theme: import("./Highlighter").ThemeBase;
    content: string;
}

export function ButtonRow({ content, theme }: ButtonRowProps) {
    return <div className={cl("btns")}>
        <CopyButton
            content={content}
            className={cl("btn")}
            style={{
                backgroundColor: theme.accentBgColor,
                color: theme.accentFgColor,
            }}
        />
    </div>;
}
