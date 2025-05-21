

export function Badge({ text, color }) {
    return (
        <div className="vc-plugins-badge" style={{
            backgroundColor: color,
            justifySelf: "flex-end",
            marginLeft: "auto"
        }}>
            {text}
        </div>
    );
}
