

import { PluginOptionComponent } from "@utils/types";

import { ISettingCustomElementProps } from ".";

export function SettingCustomComponent({ option, onChange, onError }: ISettingCustomElementProps<PluginOptionComponent>) {
    return option.component({ setValue: onChange, setError: onError, option });
}
