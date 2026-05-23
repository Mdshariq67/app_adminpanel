export type ComponentType =
    | "hero_banner"
    | "search_bar"
    | "section_header"
    | "item_grid"
    | "item_list"
    | "horizontal_scroll_list"
    | "promo_banner"
    | "filter_bar";

export type ScreenId = "home" | "listing";

/** Config for a Hero Banner component */
export interface HeroBannerConfig {
    /** @default "" */
    imageUrl?: string;
    /** @default "Welcome" */
    title?: string;
    /** @default "" */
    subtitle?: string;
    /** @default "#2563eb" */
    backgroundColor?: string;
    /** @default "#ffffff" */
    textColor?: string;
    /** @default 200 */
    height?: number;
    /** @default 0 */
    borderRadius?: number;
}

/** Config for a Search Bar component */
export interface SearchBarConfig {
    /** @default "Search..." */
    placeholder?: string;
    /** @default "#f3f4f6" */
    backgroundColor?: string;
    /** @default "#6b7280" */
    iconColor?: string;
    /** @default 8 */
    borderRadius?: number;
}

/** Config for an Item Grid component */
export interface ItemGridConfig {
    /** @default "Featured" */
    sectionTitle?: string;
    /** @default 2 */
    columns?: 1 | 2 | 3;
    /** @default 12 */
    spacing?: number;
    /** @default "Elevated" */
    cardStyle?: "Elevated" | "Flat" | "Outlined";
    /** @default "Top" */
    imagePosition?: "Top" | "Left" | "Right";
    /** @default true */
    showDescription?: boolean;
    /** @default false */
    showButton?: boolean;
    /** @default "View" */
    buttonLabel?: string;
    /** @default "Center" */
    buttonAlignment?: "Left" | "Center" | "Right";
    /** @default 8 */
    cardBorderRadius?: number;
    /** @default 2 */
    cardElevation?: number;
}

/** Config for an Item List component */
export interface ItemListConfig {
    /** @default "Items" */
    sectionTitle?: string;
    /** @default "Vertical" */
    layout?: "Vertical" | "Horizontal";
    /** @default "Image Left" */
    cardStyle?: "Image Left" | "Image Top" | "Image Right";
    /** @default 60 */
    imageSize?: number;
    /** @default 8 */
    spacing?: number;
    /** @default true */
    showDivider?: boolean;
    /** @default true */
    showDescription?: boolean;
    /** @default false */
    showButton?: boolean;
    /** @default "View" */
    buttonLabel?: string;
    /** @default "Left" */
    buttonAlignment?: "Left" | "Center" | "Right";
    /** @default 2 */
    descriptionLines?: 1 | 2 | 3;
    /** @default 8 */
    cardBorderRadius?: number;
}

/** Config for a Horizontal Scroll List component */
export interface HorizontalScrollListConfig {
    /** @default "Browse" */
    sectionTitle?: string;
    /** @default 160 */
    cardWidth?: number;
    /** @default 200 */
    cardHeight?: number;
    /** @default 12 */
    spacing?: number;
    /** @default "Elevated" */
    cardStyle?: "Elevated" | "Flat" | "Outlined";
}

/** Config for a Filter Bar component */
export interface FilterBarConfig {
    /** @default ["All"] */
    filters?: string[];
    /** @default "#2563eb" */
    selectedColor?: string;
    /** @default "Start" */
    alignment?: "Start" | "Center";
}

/** Config for a Section Header component */
export interface SectionHeaderConfig {
    /** @default "Section" */
    title?: string;
    /** @default false */
    showSeeAll?: boolean;
    /** @default 18 */
    fontSize?: number;
}

/** Config for a Promo Banner component */
export interface PromoBannerConfig {
    /** @default "" */
    imageUrl?: string;
    /** @default "Special Offer" */
    title?: string;
    /** @default "" */
    subtitle?: string;
    /** @default "#f59e0b" */
    backgroundColor?: string;
    /** @default 8 */
    borderRadius?: number;
}

type ComponentConfigMap = {
    hero_banner: HeroBannerConfig;
    search_bar: SearchBarConfig;
    section_header: SectionHeaderConfig;
    item_grid: ItemGridConfig;
    item_list: ItemListConfig;
    horizontal_scroll_list: HorizontalScrollListConfig;
    promo_banner: PromoBannerConfig;
    filter_bar: FilterBarConfig;
};

export interface UiComponent<T extends ComponentType = ComponentType> {
    id: string;
    type: T;
    name: string;
    visible: boolean;
    config: ComponentConfigMap[T];
}

export interface UiScreen {
    components: UiComponent[];
}

/** Global visual settings applied across all screens */
export interface GlobalConfig {
    /** @default "#ffffff" */
    backgroundColor?: string;
    /** @default 2 */
    appBarElevation?: number;
    /** @default 1.0 */
    fontScale?: number;
}

export interface UiConfig {
    screens: Record<ScreenId, UiScreen>;
    globalConfig: GlobalConfig;
    updatedAt?: string;
}
