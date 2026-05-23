"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    GripVertical,
    History,
    Monitor,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApp } from "@/lib/storage";
import { createDefaultUiConfig } from "@/lib/defaults/ui-config.defaults";
import { getUiConfig, saveUiConfig, getVersionHistory, VersionEntry } from "@/lib/ui-config";
import type {
    ComponentType,
    FilterBarConfig,
    GlobalConfig,
    HeroBannerConfig,
    HorizontalScrollListConfig,
    ItemGridConfig,
    ItemListConfig,
    PromoBannerConfig,
    ScreenId,
    SearchBarConfig,
    SectionHeaderConfig,
    UiComponent,
    UiConfig,
} from "@/lib/types/ui-config.types";

// ─── helpers ───────────────────────────────────────────────────────────────

const COMPONENT_META: Record<ComponentType, { label: string; emoji: string }> = {
    hero_banner: { label: "Hero Banner", emoji: "🖼" },
    search_bar: { label: "Search Bar", emoji: "🔍" },
    section_header: { label: "Section Header", emoji: "📋" },
    item_grid: { label: "Item Grid", emoji: "▦" },
    item_list: { label: "Item List", emoji: "☰" },
    horizontal_scroll_list: { label: "Horizontal Scroll List", emoji: "↔" },
    promo_banner: { label: "Promo Banner", emoji: "🏷" },
    filter_bar: { label: "Filter Bar", emoji: "🔽" },
};

function buildDefaultComponent(type: ComponentType): UiComponent {
    const id = crypto.randomUUID();
    const meta = COMPONENT_META[type];
    const base = { id, type, name: meta.label, visible: true };

    switch (type) {
        case "hero_banner":
            return { ...base, config: { imageUrl: "", title: "Welcome", subtitle: "", backgroundColor: "#2563eb", textColor: "#ffffff", height: 200, borderRadius: 0 } };
        case "search_bar":
            return { ...base, config: { placeholder: "Search...", backgroundColor: "#f3f4f6", iconColor: "#6b7280", borderRadius: 8 } };
        case "section_header":
            return { ...base, config: { title: "Section", showSeeAll: false, fontSize: 18 } };
        case "item_grid":
            return { ...base, config: { sectionTitle: "Featured", columns: 2, spacing: 12, cardStyle: "Elevated", imagePosition: "Top", showDescription: true, showButton: false, buttonLabel: "View", buttonAlignment: "Center", cardBorderRadius: 8, cardElevation: 2 } };
        case "item_list":
            return { ...base, config: { sectionTitle: "Items", layout: "Vertical", cardStyle: "Image Left", imageSize: 60, spacing: 8, showDivider: true, showDescription: true, showButton: false, buttonLabel: "View", buttonAlignment: "Left", descriptionLines: 2, cardBorderRadius: 8 } };
        case "horizontal_scroll_list":
            return { ...base, config: { sectionTitle: "Browse", cardWidth: 160, cardHeight: 200, spacing: 12, cardStyle: "Elevated" } };
        case "promo_banner":
            return { ...base, config: { imageUrl: "", title: "Special Offer", subtitle: "", backgroundColor: "#f59e0b", borderRadius: 8 } };
        case "filter_bar":
            return { ...base, config: { filters: ["All"], selectedColor: "#2563eb", alignment: "Start" } };
    }
}

// ─── small reusable editors ────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">{label}</label>
            {children}
        </div>
    );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <Field label={label}>
            <div className="flex items-center gap-2">
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-gray-300" />
                <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 font-mono text-xs flex-1" />
            </div>
        </Field>
    );
}

function SliderField({ label, value, min, max, onChange, unit = "" }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; unit?: string }) {
    return (
        <Field label={`${label}: ${value}${unit}`}>
            <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-blue-600" />
        </Field>
    );
}

function RadioField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
    return (
        <Field label={label}>
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                    <button key={opt} onClick={() => onChange(opt)} className={`px-3 py-1 text-xs rounded border transition-colors ${value === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"}`}>
                        {opt}
                    </button>
                ))}
            </div>
        </Field>
    );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <Field label={label}>
            <button onClick={() => onChange(!value)} className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
        </Field>
    );
}

function TagInput({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
    const [draft, setDraft] = useState("");
    const add = () => {
        const trimmed = draft.trim();
        if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
        setDraft("");
    };
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
                {values.map((v) => (
                    <span key={v} className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {v}
                        <button onClick={() => onChange(values.filter((x) => x !== v))} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add filter…" className="h-7 text-xs" />
                <Button size="sm" variant="outline" onClick={add} className="h-7 text-xs">Add</Button>
            </div>
        </div>
    );
}

// ─── per-type editors ──────────────────────────────────────────────────────

function HeroBannerEditor({ config, onChange }: { config: HeroBannerConfig; onChange: (c: HeroBannerConfig) => void }) {
    const u = <K extends keyof HeroBannerConfig>(k: K) => (v: HeroBannerConfig[K]) => onChange({ ...config, [k]: v });
    return (
        <div className="space-y-4">
            <Field label="Image URL">
                <Input value={config.imageUrl ?? ""} onChange={(e) => u("imageUrl")(e.target.value)} placeholder="https://…" className="h-8 text-xs" />
                {config.imageUrl && <img src={config.imageUrl} alt="" className="mt-1 h-16 w-full object-cover rounded" />}
            </Field>
            <Field label="Title"><Input value={config.title ?? ""} onChange={(e) => u("title")(e.target.value)} className="h-8 text-xs" /></Field>
            <Field label="Subtitle"><Input value={config.subtitle ?? ""} onChange={(e) => u("subtitle")(e.target.value)} className="h-8 text-xs" /></Field>
            <ColorField label="Background color" value={config.backgroundColor ?? "#2563eb"} onChange={u("backgroundColor")} />
            <ColorField label="Text color" value={config.textColor ?? "#ffffff"} onChange={u("textColor")} />
            <SliderField label="Height" value={config.height ?? 200} min={100} max={400} onChange={u("height")} unit="px" />
            <SliderField label="Border radius" value={config.borderRadius ?? 0} min={0} max={24} onChange={u("borderRadius")} unit="px" />
        </div>
    );
}

function SearchBarEditor({ config, onChange }: { config: SearchBarConfig; onChange: (c: SearchBarConfig) => void }) {
    const u = <K extends keyof SearchBarConfig>(k: K) => (v: SearchBarConfig[K]) => onChange({ ...config, [k]: v });
    return (
        <div className="space-y-4">
            <Field label="Placeholder"><Input value={config.placeholder ?? ""} onChange={(e) => u("placeholder")(e.target.value)} className="h-8 text-xs" /></Field>
            <ColorField label="Background color" value={config.backgroundColor ?? "#f3f4f6"} onChange={u("backgroundColor")} />
            <ColorField label="Icon color" value={config.iconColor ?? "#6b7280"} onChange={u("iconColor")} />
            <SliderField label="Border radius" value={config.borderRadius ?? 8} min={0} max={32} onChange={u("borderRadius")} unit="px" />
        </div>
    );
}

function SectionHeaderEditor({ config, onChange }: { config: SectionHeaderConfig; onChange: (c: SectionHeaderConfig) => void }) {
    const u = <K extends keyof SectionHeaderConfig>(k: K) => (v: SectionHeaderConfig[K]) => onChange({ ...config, [k]: v });
    return (
        <div className="space-y-4">
            <Field label="Title"><Input value={config.title ?? ""} onChange={(e) => u("title")(e.target.value)} className="h-8 text-xs" /></Field>
            <ToggleField label='Show "See all" button' value={config.showSeeAll ?? false} onChange={u("showSeeAll")} />
            <SliderField label="Font size" value={config.fontSize ?? 18} min={14} max={24} onChange={u("fontSize")} unit="px" />
        </div>
    );
}

function ItemGridEditor({ config, onChange }: { config: ItemGridConfig; onChange: (c: ItemGridConfig) => void }) {
    const u = <K extends keyof ItemGridConfig>(k: K) => (v: ItemGridConfig[K]) => onChange({ ...config, [k]: v });
    return (
        <div className="space-y-4">
            <Field label="Section title"><Input value={config.sectionTitle ?? ""} onChange={(e) => u("sectionTitle")(e.target.value)} className="h-8 text-xs" /></Field>
            <RadioField label="Columns" value={String(config.columns ?? 2)} options={["1", "2", "3"]} onChange={(v) => u("columns")(Number(v) as 1 | 2 | 3)} />
            <SliderField label="Spacing" value={config.spacing ?? 12} min={4} max={24} onChange={u("spacing")} unit="px" />
            <RadioField label="Card style" value={config.cardStyle ?? "Elevated"} options={["Elevated", "Flat", "Outlined"]} onChange={u("cardStyle")} />
            <RadioField label="Image position" value={config.imagePosition ?? "Top"} options={["Top", "Left", "Right"]} onChange={u("imagePosition")} />
            <ToggleField label="Show description" value={config.showDescription ?? true} onChange={u("showDescription")} />
            <ToggleField label="Show button" value={config.showButton ?? false} onChange={u("showButton")} />
            {config.showButton && (
                <>
                    <Field label="Button label"><Input value={config.buttonLabel ?? ""} onChange={(e) => u("buttonLabel")(e.target.value)} className="h-8 text-xs" /></Field>
                    <RadioField label="Button alignment" value={config.buttonAlignment ?? "Center"} options={["Left", "Center", "Right"]} onChange={u("buttonAlignment")} />
                </>
            )}
            <SliderField label="Card border radius" value={config.cardBorderRadius ?? 8} min={0} max={24} onChange={u("cardBorderRadius")} unit="px" />
            <SliderField label="Card elevation" value={config.cardElevation ?? 2} min={0} max={8} onChange={u("cardElevation")} />
        </div>
    );
}

function ItemListEditor({ config, onChange }: { config: ItemListConfig; onChange: (c: ItemListConfig) => void }) {
    const u = <K extends keyof ItemListConfig>(k: K) => (v: ItemListConfig[K]) => onChange({ ...config, [k]: v });
    return (
        <div className="space-y-4">
            <Field label="Section title"><Input value={config.sectionTitle ?? ""} onChange={(e) => u("sectionTitle")(e.target.value)} className="h-8 text-xs" /></Field>
            <RadioField label="Layout" value={config.layout ?? "Vertical"} options={["Vertical", "Horizontal"]} onChange={u("layout")} />
            <RadioField label="Card style" value={config.cardStyle ?? "Image Left"} options={["Image Left", "Image Top", "Image Right"]} onChange={u("cardStyle")} />
            <SliderField label="Image size" value={config.imageSize ?? 60} min={40} max={120} onChange={u("imageSize")} unit="px" />
            <SliderField label="Spacing" value={config.spacing ?? 8} min={4} max={24} onChange={u("spacing")} unit="px" />
            <ToggleField label="Show divider" value={config.showDivider ?? true} onChange={u("showDivider")} />
            <ToggleField label="Show description" value={config.showDescription ?? true} onChange={u("showDescription")} />
            <ToggleField label="Show button" value={config.showButton ?? false} onChange={u("showButton")} />
            {config.showButton && (
                <>
                    <Field label="Button label"><Input value={config.buttonLabel ?? ""} onChange={(e) => u("buttonLabel")(e.target.value)} className="h-8 text-xs" /></Field>
                    <RadioField label="Button alignment" value={config.buttonAlignment ?? "Left"} options={["Left", "Center", "Right"]} onChange={u("buttonAlignment")} />
                </>
            )}
            <RadioField label="Description lines" value={String(config.descriptionLines ?? 2)} options={["1", "2", "3"]} onChange={(v) => u("descriptionLines")(Number(v) as 1 | 2 | 3)} />
            <SliderField label="Card border radius" value={config.cardBorderRadius ?? 8} min={0} max={24} onChange={u("cardBorderRadius")} unit="px" />
        </div>
    );
}

function HorizontalScrollEditor({ config, onChange }: { config: HorizontalScrollListConfig; onChange: (c: HorizontalScrollListConfig) => void }) {
    const u = <K extends keyof HorizontalScrollListConfig>(k: K) => (v: HorizontalScrollListConfig[K]) => onChange({ ...config, [k]: v });
    return (
        <div className="space-y-4">
            <Field label="Section title"><Input value={config.sectionTitle ?? ""} onChange={(e) => u("sectionTitle")(e.target.value)} className="h-8 text-xs" /></Field>
            <SliderField label="Card width" value={config.cardWidth ?? 160} min={120} max={240} onChange={u("cardWidth")} unit="px" />
            <SliderField label="Card height" value={config.cardHeight ?? 200} min={140} max={280} onChange={u("cardHeight")} unit="px" />
            <SliderField label="Spacing" value={config.spacing ?? 12} min={8} max={24} onChange={u("spacing")} unit="px" />
            <RadioField label="Card style" value={config.cardStyle ?? "Elevated"} options={["Elevated", "Flat", "Outlined"]} onChange={u("cardStyle")} />
        </div>
    );
}

function FilterBarEditor({ config, onChange }: { config: FilterBarConfig; onChange: (c: FilterBarConfig) => void }) {
    const u = <K extends keyof FilterBarConfig>(k: K) => (v: FilterBarConfig[K]) => onChange({ ...config, [k]: v });
    return (
        <div className="space-y-4">
            <Field label="Filters">
                <TagInput values={config.filters ?? ["All"]} onChange={u("filters")} />
            </Field>
            <ColorField label="Selected color" value={config.selectedColor ?? "#2563eb"} onChange={u("selectedColor")} />
            <RadioField label="Alignment" value={config.alignment ?? "Start"} options={["Start", "Center"]} onChange={u("alignment")} />
        </div>
    );
}

function PromoBannerEditor({ config, onChange }: { config: PromoBannerConfig; onChange: (c: PromoBannerConfig) => void }) {
    const u = <K extends keyof PromoBannerConfig>(k: K) => (v: PromoBannerConfig[K]) => onChange({ ...config, [k]: v });
    return (
        <div className="space-y-4">
            <Field label="Image URL">
                <Input value={config.imageUrl ?? ""} onChange={(e) => u("imageUrl")(e.target.value)} placeholder="https://…" className="h-8 text-xs" />
                {config.imageUrl && <img src={config.imageUrl} alt="" className="mt-1 h-16 w-full object-cover rounded" />}
            </Field>
            <Field label="Title"><Input value={config.title ?? ""} onChange={(e) => u("title")(e.target.value)} className="h-8 text-xs" /></Field>
            <Field label="Subtitle"><Input value={config.subtitle ?? ""} onChange={(e) => u("subtitle")(e.target.value)} className="h-8 text-xs" /></Field>
            <ColorField label="Background color" value={config.backgroundColor ?? "#f59e0b"} onChange={u("backgroundColor")} />
            <SliderField label="Border radius" value={config.borderRadius ?? 8} min={0} max={24} onChange={u("borderRadius")} unit="px" />
        </div>
    );
}

function GlobalConfigEditor({ config, onChange }: { config: GlobalConfig; onChange: (c: GlobalConfig) => void }) {
    const u = <K extends keyof GlobalConfig>(k: K) => (v: GlobalConfig[K]) => onChange({ ...config, [k]: v });
    return (
        <div className="space-y-4 p-4 border-t border-gray-200 mt-auto">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Global Config</p>
            <ColorField label="Background color" value={config.backgroundColor ?? "#ffffff"} onChange={u("backgroundColor")} />
            <SliderField label="AppBar elevation" value={config.appBarElevation ?? 2} min={0} max={8} onChange={u("appBarElevation")} />
            <SliderField label="Font scale" value={config.fontScale ?? 1.0} min={0.8} max={1.4} onChange={(v) => u("fontScale")(Math.round(v * 10) / 10)} />
        </div>
    );
}

function ComponentEditor({ component, onChange }: { component: UiComponent; onChange: (c: UiComponent) => void }) {
    const update = (cfg: unknown) => onChange({ ...component, config: cfg as never });

    return (
        <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <span className="text-lg">{COMPONENT_META[component.type].emoji}</span>
                <div>
                    <p className="text-sm font-semibold text-gray-900">{component.name}</p>
                    <p className="text-xs text-gray-500">{COMPONENT_META[component.type].label}</p>
                </div>
            </div>
            {component.type === "hero_banner" && <HeroBannerEditor config={component.config as HeroBannerConfig} onChange={update} />}
            {component.type === "search_bar" && <SearchBarEditor config={component.config as SearchBarConfig} onChange={update} />}
            {component.type === "section_header" && <SectionHeaderEditor config={component.config as SectionHeaderConfig} onChange={update} />}
            {component.type === "item_grid" && <ItemGridEditor config={component.config as ItemGridConfig} onChange={update} />}
            {component.type === "item_list" && <ItemListEditor config={component.config as ItemListConfig} onChange={update} />}
            {component.type === "horizontal_scroll_list" && <HorizontalScrollEditor config={component.config as HorizontalScrollListConfig} onChange={update} />}
            {component.type === "promo_banner" && <PromoBannerEditor config={component.config as PromoBannerConfig} onChange={update} />}
            {component.type === "filter_bar" && <FilterBarEditor config={component.config as FilterBarConfig} onChange={update} />}
        </div>
    );
}

// ─── sortable component row ────────────────────────────────────────────────

function SortableComponentRow({
    component,
    isSelected,
    onSelect,
    onToggleVisibility,
    onDelete,
}: {
    component: UiComponent;
    isSelected: boolean;
    onSelect: () => void;
    onToggleVisibility: () => void;
    onDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: component.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    const meta = COMPONENT_META[component.type];

    return (
        <div ref={setNodeRef} style={style} onClick={onSelect}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"}`}>
            <button {...attributes} {...listeners} className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
                <GripVertical className="w-4 h-4" />
            </button>
            <span className="text-base">{meta.emoji}</span>
            <span className={`flex-1 text-sm truncate ${!component.visible ? "text-gray-400" : "text-gray-700"}`}>{component.name}</span>
            <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }} className="text-gray-400 hover:text-gray-600">
                {component.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// ─── add-component modal ───────────────────────────────────────────────────

function AddComponentModal({ onAdd, onClose }: { onAdd: (type: ComponentType) => void; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-80 p-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-gray-900">Add Component</p>
                    <button onClick={onClose}><X className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="space-y-1">
                    {(Object.entries(COMPONENT_META) as [ComponentType, { label: string; emoji: string }][]).map(([type, meta]) => (
                        <button key={type} onClick={() => { onAdd(type); onClose(); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-blue-50 transition-colors">
                            <span className="text-xl">{meta.emoji}</span>
                            <span className="text-sm text-gray-700">{meta.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── version history drawer ────────────────────────────────────────────────

function HistoryDrawer({
    appSlug,
    onRestore,
    onClose,
}: {
    appSlug: string;
    onRestore: (config: UiConfig) => void;
    onClose: () => void;
}) {
    const [versions, setVersions] = useState<VersionEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getVersionHistory(appSlug).then((v) => { setVersions(v); setLoading(false); }).catch(() => setLoading(false));
    }, [appSlug]);

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative w-80 bg-white h-full shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <p className="font-semibold text-gray-900">Version History</p>
                    <button onClick={onClose}><X className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading && <p className="text-sm text-gray-500">Loading…</p>}
                    {!loading && versions.length === 0 && <p className="text-sm text-gray-500">No versions yet.</p>}
                    {versions.map((v) => {
                        const d = new Date(Number(v.timestamp));
                        return (
                            <div key={v.timestamp} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                                <div>
                                    <p className="text-xs font-medium text-gray-700">{d.toLocaleDateString()}</p>
                                    <p className="text-xs text-gray-500">{d.toLocaleTimeString()}</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => { onRestore(v.config); onClose(); }} className="text-xs">Restore</Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── phone preview ─────────────────────────────────────────────────────────

function PhonePreview({ config, lastSaved }: { config: UiConfig; lastSaved: Date | null }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [previewReady, setPreviewReady] = useState(false);
    const sendTimerRef = useRef<NodeJS.Timeout | null>(null);
    const previewUrl = process.env.NEXT_PUBLIC_FLUTTER_PREVIEW_URL;

    const sendConfigToPreview = useCallback(() => {
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ type: "UI_CONFIG_UPDATE", config }),
            "*"
        );
    }, [config]);

    // Listen for FLUTTER_READY and send config immediately when received
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.data?.type === "FLUTTER_READY") {
                setPreviewReady(true);
                sendConfigToPreview();
            }
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [sendConfigToPreview]);

    // Debounced send on every config change (only when preview is ready)
    useEffect(() => {
        if (!previewReady) return;
        if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
        sendTimerRef.current = setTimeout(sendConfigToPreview, 300);
        return () => {
            if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
        };
    }, [config, previewReady, sendConfigToPreview]);

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Live Preview</span>
                </div>
                {previewUrl && (
                    <div className="flex items-center gap-1.5 text-xs">
                        {previewReady ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-green-600">Preview ready</span>
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                <span className="text-gray-500">Connecting…</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Phone frame */}
            <div className="relative" style={{ width: 280 }}>
                <div className="absolute inset-0 rounded-[2.5rem] border-[10px] border-gray-800 shadow-2xl pointer-events-none z-10" />
                {/* notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-2xl z-20" />
                <div className="rounded-[2rem] overflow-hidden bg-gray-100" style={{ height: 560 }}>
                    {previewUrl ? (
                        <iframe
                            ref={iframeRef}
                            src={previewUrl}
                            className="w-full h-full border-0"
                            title="Flutter preview"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 p-6 text-center">
                            <Monitor className="w-10 h-10" />
                            <p className="text-xs">Set NEXT_PUBLIC_FLUTTER_PREVIEW_URL to enable the live preview</p>
                        </div>
                    )}
                </div>
            </div>

            {lastSaved && (
                <p className="text-xs text-gray-400">Last saved: {lastSaved.toLocaleTimeString()}</p>
            )}
        </div>
    );
}

// ─── save indicator ────────────────────────────────────────────────────────

type SaveState = "idle" | "saving" | "saved" | "error";

function SaveIndicator({ state }: { state: SaveState }) {
    if (state === "idle") return null;
    const map: Record<Exclude<SaveState, "idle">, { dot: string; label: string }> = {
        saving: { dot: "bg-yellow-400", label: "Saving…" },
        saved: { dot: "bg-green-500", label: "Saved" },
        error: { dot: "bg-red-500", label: "Error" },
    };
    const { dot, label } = map[state as Exclude<SaveState, "idle">];
    return (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {label}
        </div>
    );
}

// ─── main page ─────────────────────────────────────────────────────────────

export default function BuilderPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [appName, setAppName] = useState("");
    const [appSlug, setAppSlug] = useState("");
    const [config, setConfig] = useState<UiConfig | null>(null);
    const [activeScreen, setActiveScreen] = useState<ScreenId>("home");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [saveState, setSaveState] = useState<SaveState>("idle");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showSavedBanner, setShowSavedBanner] = useState(false);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Load app + config on mount
    useEffect(() => {
        const app = getApp(id);
        if (!app) { router.push("/"); return; }
        setAppName(app.name);
        setAppSlug(app.slug);

        getUiConfig(app.slug).then((saved) => {
            setConfig(saved ?? createDefaultUiConfig());
        }).catch(() => {
            setConfig(createDefaultUiConfig());
        });
    }, [id, router]);

    // Debounced auto-save
    const triggerSave = useCallback((cfg: UiConfig, slug: string) => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setSaveState("saving");
        saveTimerRef.current = setTimeout(async () => {
            try {
                await saveUiConfig(slug, cfg);
                setSaveState("saved");
                setLastSaved(new Date());
                setShowSavedBanner(true);
                if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
                bannerTimerRef.current = setTimeout(() => setShowSavedBanner(false), 5000);
            } catch {
                setSaveState("error");
                toast.error("Failed to save config");
            }
        }, 1000);
    }, []);

    const updateConfig = useCallback((next: UiConfig) => {
        setConfig(next);
        if (appSlug) triggerSave(next, appSlug);
    }, [appSlug, triggerSave]);

    // DnD sensors
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const currentComponents = config?.screens[activeScreen].components ?? [];
    const selectedComponent = currentComponents.find((c) => c.id === selectedId) ?? null;

    const updateComponents = useCallback((components: UiComponent[]) => {
        if (!config) return;
        updateConfig({ ...config, screens: { ...config.screens, [activeScreen]: { components } } });
    }, [config, activeScreen, updateConfig]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = currentComponents.findIndex((c) => c.id === active.id);
            const newIndex = currentComponents.findIndex((c) => c.id === over.id);
            updateComponents(arrayMove(currentComponents, oldIndex, newIndex));
        }
    }, [currentComponents, updateComponents]);

    const handleAddComponent = useCallback((type: ComponentType) => {
        const newComp = buildDefaultComponent(type);
        updateComponents([...currentComponents, newComp]);
        setSelectedId(newComp.id);
    }, [currentComponents, updateComponents]);

    const handleDeleteComponent = useCallback((compId: string) => {
        updateComponents(currentComponents.filter((c) => c.id !== compId));
        if (selectedId === compId) setSelectedId(null);
    }, [currentComponents, updateComponents, selectedId]);

    const handleToggleVisibility = useCallback((compId: string) => {
        updateComponents(currentComponents.map((c) => c.id === compId ? { ...c, visible: !c.visible } : c));
    }, [currentComponents, updateComponents]);

    const handleComponentChange = useCallback((updated: UiComponent) => {
        updateComponents(currentComponents.map((c) => c.id === updated.id ? updated : c));
    }, [currentComponents, updateComponents]);

    const handleGlobalConfigChange = useCallback((gc: GlobalConfig) => {
        if (!config) return;
        updateConfig({ ...config, globalConfig: gc });
    }, [config, updateConfig]);

    if (!config) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mx-auto mb-4" />
                    <p className="text-gray-500">Loading builder…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />Back
                    </Button>
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">Screen Builder</h1>
                        <p className="text-xs text-gray-500">{appName} · {appSlug}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <SaveIndicator state={saveState} />
                    <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="gap-2">
                        <History className="w-4 h-4" />History
                    </Button>
                </div>
            </div>

            {/* Saved banner */}
            {showSavedBanner && (
                <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-xs text-green-700 flex items-center justify-between flex-shrink-0">
                    <span>Changes saved. All installed apps will update within 60 seconds.</span>
                    <button onClick={() => setShowSavedBanner(false)}><X className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {/* Three-column layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT — palette */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
                    {/* Screen tabs */}
                    <div className="flex border-b border-gray-200">
                        {(["home", "listing"] as ScreenId[]).map((screen) => (
                            <button key={screen} onClick={() => { setActiveScreen(screen); setSelectedId(null); }}
                                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeScreen === screen ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                                {screen === "home" ? "Home Screen" : "Listing Screen"}
                            </button>
                        ))}
                    </div>

                    {/* Component list */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={currentComponents.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                                {currentComponents.map((comp) => (
                                    <SortableComponentRow key={comp.id} component={comp}
                                        isSelected={selectedId === comp.id}
                                        onSelect={() => setSelectedId(comp.id)}
                                        onToggleVisibility={() => handleToggleVisibility(comp.id)}
                                        onDelete={() => handleDeleteComponent(comp.id)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                        {currentComponents.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-6">No components. Add one below.</p>
                        )}
                    </div>

                    {/* Add button */}
                    <div className="p-3 border-t border-gray-200">
                        <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)} className="w-full gap-2 text-xs">
                            <Plus className="w-3.5 h-3.5" />Add Component
                        </Button>
                    </div>

                    {/* Global config */}
                    <GlobalConfigEditor config={config.globalConfig} onChange={handleGlobalConfigChange} />
                </div>

                {/* MIDDLE — property editor */}
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedComponent ? (
                        <div className="max-w-sm mx-auto bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <ComponentEditor component={selectedComponent} onChange={handleComponentChange} />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <p className="text-sm">Select a component to edit its properties</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT — phone preview */}
                <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-5 flex-shrink-0">
                    <PhonePreview config={config} lastSaved={lastSaved} />
                </div>
            </div>

            {showAddModal && <AddComponentModal onAdd={handleAddComponent} onClose={() => setShowAddModal(false)} />}
            {showHistory && <HistoryDrawer appSlug={appSlug} onRestore={(cfg) => updateConfig(cfg)} onClose={() => setShowHistory(false)} />}
        </div>
    );
}
