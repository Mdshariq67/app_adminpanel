"use client";

interface PhoneShellProps {
    /** Screen width in px (not including frame border) */
    width: number;
    /** Screen height in px (not including frame border) */
    height: number;
    children: React.ReactNode;
}

const BORDER = 10;

export default function PhoneShell({ width, height, children }: PhoneShellProps) {
    const totalWidth = width + BORDER * 2;
    const totalHeight = height + BORDER * 2;

    return (
        <div
            style={{
                width: totalWidth,
                height: totalHeight,
                borderRadius: 40,
                backgroundColor: "#1f2937",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)",
                position: "relative",
                flexShrink: 0,
            }}
        >
            {/* Notch */}
            <div
                style={{
                    position: "absolute",
                    top: BORDER,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 80,
                    height: 22,
                    backgroundColor: "#1f2937",
                    borderRadius: "0 0 14px 14px",
                    zIndex: 2,
                    pointerEvents: "none",
                }}
            />
            {/* Screen */}
            <div
                style={{
                    position: "absolute",
                    top: BORDER,
                    left: BORDER,
                    width,
                    height,
                    borderRadius: 30,
                    overflow: "hidden",
                    backgroundColor: "#F5F6FA",
                }}
            >
                {children}
            </div>
        </div>
    );
}
