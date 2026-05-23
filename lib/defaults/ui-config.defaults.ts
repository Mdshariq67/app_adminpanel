import { v4 as uuidv4 } from "uuid";
import type { UiConfig } from "@/lib/types/ui-config.types";

export function createDefaultUiConfig(): UiConfig {
    return {
        globalConfig: {
            backgroundColor: "#ffffff",
            appBarElevation: 2,
            fontScale: 1.0,
        },
        screens: {
            home: {
                components: [
                    {
                        id: uuidv4(),
                        type: "hero_banner",
                        name: "Hero Banner",
                        visible: true,
                        config: {
                            imageUrl: "",
                            title: "Welcome",
                            subtitle: "",
                            backgroundColor: "#2563eb",
                            textColor: "#ffffff",
                            height: 200,
                            borderRadius: 0,
                        },
                    },
                    {
                        id: uuidv4(),
                        type: "search_bar",
                        name: "Search Bar",
                        visible: true,
                        config: {
                            placeholder: "Search...",
                            backgroundColor: "#f3f4f6",
                            iconColor: "#6b7280",
                            borderRadius: 8,
                        },
                    },
                    {
                        id: uuidv4(),
                        type: "item_grid",
                        name: "Item Grid",
                        visible: true,
                        config: {
                            sectionTitle: "Featured",
                            columns: 2,
                            spacing: 12,
                            cardStyle: "Elevated",
                            imagePosition: "Top",
                            showDescription: true,
                            showButton: false,
                            buttonLabel: "View",
                            buttonAlignment: "Center",
                            cardBorderRadius: 8,
                            cardElevation: 2,
                        },
                    },
                ],
            },
            listing: {
                components: [
                    {
                        id: uuidv4(),
                        type: "filter_bar",
                        name: "Filter Bar",
                        visible: true,
                        config: {
                            filters: ["All"],
                            selectedColor: "#2563eb",
                            alignment: "Start",
                        },
                    },
                    {
                        id: uuidv4(),
                        type: "item_list",
                        name: "Item List",
                        visible: true,
                        config: {
                            sectionTitle: "Items",
                            layout: "Vertical",
                            cardStyle: "Image Left",
                            imageSize: 60,
                            spacing: 8,
                            showDivider: true,
                            showDescription: true,
                            showButton: false,
                            buttonLabel: "View",
                            buttonAlignment: "Left",
                            descriptionLines: 2,
                            cardBorderRadius: 8,
                        },
                    },
                ],
            },
        },
    };
}
