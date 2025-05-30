

export function hex2Rgb(hex: string) {
    hex = hex.slice(1);
    if (hex.length < 6)
        hex = hex
            .split("")
            .map(c => c + c)
            .join("");
    if (hex.length === 6) hex += "ff";
    if (hex.length > 6) hex = hex.slice(0, 6);
    return hex
        .split(/(..)/)
        .filter(Boolean)
        .map(c => parseInt(c, 16));
}
