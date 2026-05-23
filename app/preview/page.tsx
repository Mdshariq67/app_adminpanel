"use client";

import { useEffect, useState } from "react";
import { createDefaultUiConfig } from "@/lib/defaults/ui-config.defaults";
import type {
    FilterBarConfig,
    HeroBannerConfig,
    HorizontalScrollListConfig,
    ItemGridConfig,
    ItemListConfig,
    PromoBannerConfig,
    SearchBarConfig,
    SectionHeaderConfig,
    UiComponent,
    UiConfig,
} from "@/lib/types/ui-config.types";

// ─── branding ──────────────────────────────────────────────────────────────

interface Branding {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    appName: string;
    description: string;
    fontFamily: string;
}

const DEFAULTS: Branding = {
    primaryColor: "#2563eb",
    secondaryColor: "#64748b",
    accentColor: "#ec4899",
    appName: "My App",
    description: "",
    fontFamily: "Poppins",
};

// ─── helpers ───────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
    const c = hex.replace("#", "");
    const r = parseInt(c.slice(0, 2), 16) || 0;
    const g = parseInt(c.slice(2, 4), 16) || 0;
    const b = parseInt(c.slice(4, 6), 16) || 0;
    return `rgba(${r},${g},${b},${alpha})`;
}

function elevationShadow(e: number): string {
    if (e <= 1) return "0 1px 3px rgba(0,0,0,0.08)";
    if (e <= 3) return "0 2px 8px rgba(0,0,0,0.10)";
    return "0 4px 16px rgba(0,0,0,0.13)";
}

const alignMap: Record<string, string> = {
    start: "flex-start",
    Start: "flex-start",
    center: "center",
    Center: "center",
    end: "flex-end",
    End: "flex-end",
    Right: "flex-end",
    right: "flex-end",
    Left: "flex-start",
    left: "flex-start",
};

const PLACEHOLDER_ITEMS = [
    { title: "Item 1", description: "Short description for item one." },
    { title: "Item 2", description: "Short description for item two." },
    { title: "Item 3", description: "Short description for item three." },
    { title: "Item 4", description: "Short description for item four." },
    { title: "Item 5", description: "Short description for item five." },
    { title: "Item 6", description: "Short description for item six." },
];

// ─── image placeholder ─────────────────────────────────────────────────────

function ImagePlaceholder({ branding }: { branding: Branding }) {
    return (
        <div
            style={{
                backgroundColor: hexToRgba(branding.primaryColor, 0.15),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
            }}
        >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke={hexToRgba(branding.primaryColor, 0.5)} strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        </div>
    );
}

// ─── shared item card ──────────────────────────────────────────────────────

function ItemCard({
    config,
    branding,
    title = "Item",
    description = "",
    width,
    height,
}: {
    config: Record<string, unknown>;
    branding: Branding;
    title?: string;
    description?: string;
    width?: number;
    height?: number;
}) {
    const cardStyle = (config.cardStyle as string) ?? "Elevated";
    const imagePosition = (config.imagePosition as string) ?? "Top";
    const cardBorderRadius = (config.cardBorderRadius as number) ?? 12;
    const cardElevation = (config.cardElevation as number) ?? 2;
    const showDescription = (config.showDescription as boolean) ?? true;
    const showButton = (config.showButton as boolean) ?? false;
    const buttonLabel = (config.buttonLabel as string) ?? "View";
    const buttonAlignment = (config.buttonAlignment as string) ?? "start";
    const titleAlignment = (config.titleAlignment as string) ?? "start";
    const descLines = (config.descriptionLines as number) ?? 2;
    const imageSize = (config.imageSize as number) ?? 80;

    const isHorizontal =
        imagePosition === "left" || imagePosition === "Left" ||
        imagePosition === "right" || imagePosition === "Right" ||
        cardStyle === "image_left" || cardStyle === "Image Left" ||
        cardStyle === "image_right" || cardStyle === "Image Right";

    const imageOnRight =
        imagePosition === "right" || imagePosition === "Right" ||
        cardStyle === "image_right" || cardStyle === "Image Right";

    const textContent = (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: alignMap[titleAlignment] ?? "flex-start",
        }}>
            <span style={{
                fontWeight: 700,
                fontSize: 14,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
            } as React.CSSProperties}>
                {title}
            </span>
            {showDescription && description && (
                <span style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 4,
                    display: "-webkit-box",
                    WebkitLineClamp: descLines,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                } as React.CSSProperties}>
                    {description}
                </span>
            )}
            {showButton && (
                <div style={{
                    display: "flex",
                    marginTop: 6,
                    justifyContent: alignMap[buttonAlignment] ?? "flex-start",
                    width: "100%",
                }}>
                    <button style={{
                        color: branding.primaryColor,
                        fontSize: 13,
                        fontWeight: 600,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 12px",
                    }}>
                        {buttonLabel}
                    </button>
                </div>
            )}
        </div>
    );

    const cardContent = isHorizontal ? (
        <div style={{
            display: "flex",
            flexDirection: imageOnRight ? "row-reverse" : "row",
            gap: 12,
            padding: 10,
        }}>
            <div style={{ width: imageSize, height: imageSize, flexShrink: 0, borderRadius: 4, overflow: "hidden" }}>
                <ImagePlaceholder branding={branding} />
            </div>
            <div style={{ flex: 1 }}>{textContent}</div>
        </div>
    ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ aspectRatio: "16/9", overflow: "hidden" }}>
                <ImagePlaceholder branding={branding} />
            </div>
            <div style={{ padding: 10 }}>{textContent}</div>
        </div>
    );

    return (
        <div style={{
            backgroundColor: "#ffffff",
            borderRadius: `${cardBorderRadius}px`,
            boxShadow: elevationShadow(cardElevation),
            overflow: "hidden",
            width: width ? `${width}px` : undefined,
            height: height ? `${height}px` : undefined,
            flexShrink: width ? 0 : undefined,
        }}>
            {cardContent}
        </div>
    );
}

// ─── widgets ───────────────────────────────────────────────────────────────

function HeroBannerWidget({ config, branding }: { config: HeroBannerConfig; branding: Branding }) {
    const imageUrl = config.imageUrl ?? "";
    const title = config.title ?? branding.appName;
    const subtitle = config.subtitle ?? "";
    const bgColor = config.backgroundColor || branding.primaryColor;
    const textColor = config.textColor ?? "#ffffff";
    const h = config.height ?? 200;
    const br = config.borderRadius ?? 12;

    return (
        <div style={{
            height: `${h}px`,
            borderRadius: `${br}px`,
            backgroundColor: bgColor,
            backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            overflow: "hidden",
            width: "100%",
        }}>
            <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55))",
            }} />
            <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
                {title && (
                    <p style={{ color: textColor, fontWeight: 700, fontSize: 22, lineHeight: 1.2, margin: 0 }}>
                        {title}
                    </p>
                )}
                {subtitle && (
                    <p style={{ color: textColor, opacity: 0.9, fontSize: 14, margin: "4px 0 0" }}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

function SearchBarWidget({ config, branding }: { config: SearchBarConfig; branding: Branding }) {
    const placeholder = config.placeholder ?? "Search...";
    const bgColor = config.backgroundColor ?? "#f3f4f6";
    const iconColor = config.iconColor ?? branding.primaryColor;
    const br = config.borderRadius ?? 24;

    return (
        <div style={{
            backgroundColor: bgColor,
            borderRadius: `${br}px`,
            border: "1px solid #e5e7eb",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            userSelect: "none",
        }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={iconColor} strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>
            <span style={{ color: "#9ca3af", fontSize: 14 }}>{placeholder}</span>
        </div>
    );
}

function SectionHeaderWidget({ config, branding }: { config: SectionHeaderConfig; branding: Branding }) {
    const title = config.title ?? "";
    const showSeeAll = config.showSeeAll ?? false;
    const fontSize = config.fontSize ?? 18;

    if (!title) return null;

    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, paddingBottom: 8 }}>
            <span style={{ fontSize, fontWeight: 700, color: branding.primaryColor }}>{title}</span>
            {showSeeAll && (
                <button style={{
                    color: branding.primaryColor,
                    fontSize: 13,
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                }}>
                    See all
                </button>
            )}
        </div>
    );
}

function ItemGridWidget({ config, branding }: { config: ItemGridConfig; branding: Branding }) {
    const title = config.sectionTitle ?? "";
    const columns = config.columns ?? 2;
    const spacing = config.spacing ?? 12;

    return (
        <div>
            {title && <SectionHeaderWidget config={{ title }} branding={branding} />}
            <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${spacing}px`,
            }}>
                {PLACEHOLDER_ITEMS.map((item, i) => (
                    <ItemCard key={i} config={config as unknown as Record<string, unknown>}
                        branding={branding} title={item.title} description={item.description} />
                ))}
            </div>
        </div>
    );
}

function ItemListWidget({ config, branding }: { config: ItemListConfig; branding: Branding }) {
    const spacing = config.spacing ?? 8;
    const showDivider = config.showDivider ?? false;

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {PLACEHOLDER_ITEMS.map((item, i) => (
                <div key={i}>
                    <ItemCard config={config as unknown as Record<string, unknown>}
                        branding={branding} title={item.title} description={item.description} />
                    {showDivider && i < PLACEHOLDER_ITEMS.length - 1
                        ? <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: 0 }} />
                        : <div style={{ height: spacing }} />
                    }
                </div>
            ))}
        </div>
    );
}

function HorizontalScrollListWidget({ config, branding }: { config: HorizontalScrollListConfig; branding: Branding }) {
    const title = config.sectionTitle ?? "";
    const cardWidth = config.cardWidth ?? 160;
    const cardHeight = config.cardHeight ?? 200;
    const spacing = config.spacing ?? 12;
    const items = [
        { title: "Featured 1", description: "Short description." },
        { title: "Featured 2", description: "Short description." },
        { title: "Featured 3", description: "Short description." },
        { title: "Featured 4", description: "Short description." },
        { title: "Featured 5", description: "Short description." },
    ];

    return (
        <div>
            {title && <SectionHeaderWidget config={{ title }} branding={branding} />}
            <div style={{
                display: "flex",
                flexDirection: "row",
                gap: `${spacing}px`,
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
            } as React.CSSProperties}>
                {items.map((item, i) => (
                    <ItemCard key={i} config={config as unknown as Record<string, unknown>}
                        branding={branding} title={item.title} description={item.description}
                        width={cardWidth} height={cardHeight} />
                ))}
            </div>
        </div>
    );
}

function FilterBarWidget({ config, branding }: { config: FilterBarConfig; branding: Branding }) {
    const filters = config.filters ?? ["All"];
    const selectedColor = config.selectedColor ?? branding.primaryColor;
    const alignment = (config.alignment as string) ?? "Start";
    const [selected, setSelected] = useState(filters[0] ?? "All");

    const justifyContent =
        alignment === "Center" ? "center" :
            alignment === "End" ? "flex-end" : "flex-start";

    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            gap: 8,
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            justifyContent,
        } as React.CSSProperties}>
            {filters.map((filter) => {
                const isSelected = selected === filter;
                return (
                    <button
                        key={filter}
                        onClick={() => setSelected(filter)}
                        style={{
                            flexShrink: 0,
                            padding: "6px 16px",
                            borderRadius: 20,
                            border: isSelected ? "none" : `1px solid ${hexToRgba(selectedColor, 0.4)}`,
                            backgroundColor: isSelected ? selectedColor : "#ffffff",
                            color: isSelected ? "#ffffff" : selectedColor,
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: 13,
                            cursor: "pointer",
                        }}
                    >
                        {filter}
                    </button>
                );
            })}
        </div>
    );
}

function PromoBannerWidget({ config, branding }: { config: PromoBannerConfig; branding: Branding }) {
    const imageUrl = config.imageUrl ?? "";
    const title = config.title ?? "";
    const subtitle = config.subtitle ?? "";
    const bgColor = config.backgroundColor ?? branding.secondaryColor;
    const br = config.borderRadius ?? 12;

    return (
        <div style={{
            height: 120,
            borderRadius: `${br}px`,
            backgroundColor: bgColor,
            backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            overflow: "hidden",
        }}>
            <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.5))",
            }} />
            <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
                {title && <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0 }}>{title}</p>}
                {subtitle && <p style={{ color: "#fff", opacity: 0.9, fontSize: 13, margin: "4px 0 0" }}>{subtitle}</p>}
            </div>
        </div>
    );
}

// ─── component dispatcher ──────────────────────────────────────────────────

function WidgetRenderer({ component, branding }: { component: UiComponent; branding: Branding }) {
    switch (component.type) {
        case "hero_banner":
            return <HeroBannerWidget config={component.config as HeroBannerConfig} branding={branding} />;
        case "search_bar":
            return <SearchBarWidget config={component.config as SearchBarConfig} branding={branding} />;
        case "section_header":
            return <SectionHeaderWidget config={component.config as SectionHeaderConfig} branding={branding} />;
        case "item_grid":
            return <ItemGridWidget config={component.config as ItemGridConfig} branding={branding} />;
        case "item_list":
            return <ItemListWidget config={component.config as ItemListConfig} branding={branding} />;
        case "horizontal_scroll_list":
            return <HorizontalScrollListWidget config={component.config as HorizontalScrollListConfig} branding={branding} />;
        case "filter_bar":
            return <FilterBarWidget config={component.config as FilterBarConfig} branding={branding} />;
        case "promo_banner":
            return <PromoBannerWidget config={component.config as PromoBannerConfig} branding={branding} />;
        default:
            return null;
    }
}

// ─── page ──────────────────────────────────────────────────────────────────

export default function PreviewPage() {
    const [branding, setBranding] = useState<Branding>(DEFAULTS);
    const [config, setConfig] = useState<UiConfig>(() => createDefaultUiConfig());
    const [activeScreen, setActiveScreen] = useState<"home" | "listing">("home");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");
        const screen = params.get("screen") as "home" | "listing" | null;

        if (screen === "home" || screen === "listing") setActiveScreen(screen);

        const hex = (key: string, fallback: string) => {
            const v = params.get(key);
            return v ? `#${v.replace("#", "")}` : fallback;
        };

        const fontFamily = params.get("fontFamily") ?? DEFAULTS.fontFamily;

        setBranding({
            primaryColor: hex("primary", DEFAULTS.primaryColor),
            secondaryColor: hex("secondary", DEFAULTS.secondaryColor),
            accentColor: hex("accent", DEFAULTS.accentColor),
            appName: params.get("appName") ?? DEFAULTS.appName,
            description: params.get("description") ?? DEFAULTS.description,
            fontFamily,
        });

        // Load Google Font dynamically
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);

        // preview mode: defaultConfig only — no Firestore, no postMessage
        if (mode === "preview") return;

        // live mode (Screen Builder): receive config updates via postMessage
        const handler = (e: MessageEvent) => {
            try {
                const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
                if (data?.type === "UI_CONFIG_UPDATE" && data.config) {
                    setConfig(data.config as UiConfig);
                }
            } catch { /* ignore malformed messages */ }
        };

        window.addEventListener("message", handler);

        // Tell the Screen Builder we are ready to receive config
        try {
            window.parent?.postMessage({ type: "FLUTTER_READY" }, "*");
        } catch { /* ignore cross-origin postMessage errors */ }

        return () => window.removeEventListener("message", handler);
    }, []);

    const components = (config.screens[activeScreen]?.components ?? []).filter(
        (c) => c.visible !== false
    );

    const bgColor = (config.globalConfig?.backgroundColor as string | undefined) ?? "#F5F6FA";

    return (
        <div style={{
            minHeight: "100vh",
            background: bgColor,
            fontFamily: `'${branding.fontFamily}', sans-serif`,
            display: "flex",
            flexDirection: "column",
        }}>
            {/* AppBar */}
            <header style={{
                backgroundColor: branding.primaryColor,
                height: 56,
                display: "flex",
                alignItems: "center",
                paddingLeft: 16,
                paddingRight: 16,
                flexShrink: 0,
            }}>
                <span style={{
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 18,
                    fontFamily: `'${branding.fontFamily}', sans-serif`,
                }}>
                    {branding.appName}
                </span>
            </header>

            {/* Screen content */}
            <main style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                padding: 16,
            }}>
                {components.map((c) => (
                    <WidgetRenderer key={c.id} component={c} branding={branding} />
                ))}
            </main>
        </div>
    );
}
