// Covers the root layout's nav bar so the preview fills the full iframe viewport.
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                overflowY: "auto",
                overflowX: "hidden",
                background: "#F5F6FA",
            }}
        >
            {children}
        </div>
    );
}
