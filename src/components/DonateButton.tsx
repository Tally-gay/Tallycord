

import { Button } from "@webpack/common";
import { ButtonProps } from "@webpack/types";

import { Heart } from "./Heart";

export default function DonateButton({
    look = Button.Looks.LINK,
    color = Button.Colors.TRANSPARENT,
    ...props
}: Partial<ButtonProps>) {
    return (
        <Button
            {...props}
            look={look}
            color={color}
            onClick={() => VencordNative.native.openExternal("https://github.com/sponsors/Vendicated")}
            innerClassName="vc-donate-button"
        >
            <Heart />
            Donate
        </Button>
    );
}
