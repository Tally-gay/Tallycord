

import { Margins } from "@utils/margins";
import { wordsFromCamel, wordsToTitle } from "@utils/text";
import { PluginOptionSelect } from "@utils/types";
import { Forms, React, Select } from "@webpack/common";

import { ISettingElementProps } from ".";

export function SettingSelectComponent({ option, pluginSettings, definedSettings, onChange, onError, id }: ISettingElementProps<PluginOptionSelect>) {
    const def = pluginSettings[id] ?? option.options?.find(o => o.default)?.value;

    const [state, setState] = React.useState<any>(def ?? null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        onError(error !== null);
    }, [error]);

    function handleChange(newValue) {
        const isValid = option.isValid?.call(definedSettings, newValue) ?? true;
        if (typeof isValid === "string") setError(isValid);
        else if (!isValid) setError("Invalid input provided.");
        else {
            setError(null);
            setState(newValue);
            onChange(newValue);
        }
    }

    return (
        <Forms.FormSection>
            <Forms.FormTitle>{wordsToTitle(wordsFromCamel(id))}</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom16} type="description">{option.description}</Forms.FormText>
            <Select
                isDisabled={option.disabled?.call(definedSettings) ?? false}
                options={option.options}
                placeholder={option.placeholder ?? "Select an option"}
                maxVisibleItems={5}
                closeOnSelect={true}
                select={handleChange}
                isSelected={v => v === state}
                serialize={v => String(v)}
                {...option.componentProps}
            />
            {error && <Forms.FormText style={{ color: "var(--text-danger)" }}>{error}</Forms.FormText>}
        </Forms.FormSection>
    );
}
