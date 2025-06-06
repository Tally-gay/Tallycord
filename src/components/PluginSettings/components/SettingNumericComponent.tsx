

import { Margins } from "@utils/margins";
import { wordsFromCamel, wordsToTitle } from "@utils/text";
import { OptionType, PluginOptionNumber } from "@utils/types";
import { Forms, React, TextInput } from "@webpack/common";

import { ISettingElementProps } from ".";

const MAX_SAFE_NUMBER = BigInt(Number.MAX_SAFE_INTEGER);

export function SettingNumericComponent({ option, pluginSettings, definedSettings, id, onChange, onError }: ISettingElementProps<PluginOptionNumber>) {
    function serialize(value: any) {
        if (option.type === OptionType.BIGINT) return BigInt(value);
        return Number(value);
    }

    const [state, setState] = React.useState<any>(`${pluginSettings[id] ?? option.default ?? 0}`);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        onError(error !== null);
    }, [error]);

    function handleChange(newValue) {
        const isValid = option.isValid?.call(definedSettings, newValue) ?? true;

        setError(null);
        if (typeof isValid === "string") setError(isValid);
        else if (!isValid) setError("Invalid input provided.");

        if (option.type === OptionType.NUMBER && BigInt(newValue) >= MAX_SAFE_NUMBER) {
            setState(`${Number.MAX_SAFE_INTEGER}`);
            onChange(serialize(newValue));
        } else {
            setState(newValue);
            onChange(serialize(newValue));
        }
    }

    return (
        <Forms.FormSection>
            <Forms.FormTitle>{wordsToTitle(wordsFromCamel(id))}</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom20} type="description">{option.description}</Forms.FormText>
            <TextInput
                type="number"
                pattern="-?[0-9]+"
                value={state}
                onChange={handleChange}
                placeholder={option.placeholder ?? "Enter a number"}
                disabled={option.disabled?.call(definedSettings) ?? false}
                {...option.componentProps}
            />
            {error && <Forms.FormText style={{ color: "var(--text-danger)" }}>{error}</Forms.FormText>}
        </Forms.FormSection>
    );
}
