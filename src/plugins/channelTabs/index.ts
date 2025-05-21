/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { definePluginSettings, migratePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { NavigationRouter } from "@webpack/common";
migratePluginSettings("Channel Tabs", "ChannelTabs");
const plugin = definePlugin({
    name: "Channel Tabs",
    description: "Adds tabs for your channels with drag and drop support",
    authors: [Devs.tally],

    tabs: {} as { [tabKey: string]: any; },
    closedTabs: [] as Array<{ url: string; name: string; iconUrl: string; }>,
    activeTabId: null as string | null,
    originalTitleBar: null as HTMLElement | null,
    scrollInterval: null as NodeJS.Timeout | null,
    settings: definePluginSettings({
        addTabKeybinds: {
            type: OptionType.BOOLEAN,
            description:
                "ctrl+w: close tab, ctrl+t: new tab, ctrl+shift+t: reopen last closed tab and other web tab related keybinds",

            default: true,
            onChange: (enabled) => {
                if (enabled) {
                    plugin.enableKeybinds();
                } else {
                    plugin.disableKeybinds();
                }
            },
        },
    }),
    dragState: {
        isDragging: false,
        draggedTabId: null as string | null,
        draggedTab: null as HTMLElement | null,
        startX: 0,
        offsetX: 0,
        lastMouseX: 0,
        placeholder: null as HTMLElement | null,
        tabPositions: [] as Array<{ id: string; left: number; width: number; }>,
    },

    createTab(url, name, iconUrl) {
        const tabId = Date.now().toString();
        const tabElement = document.createElement("div");
        tabElement.className = "channel-tab";
        tabElement.dataset.tabId = tabId;
        if (Object.keys(this.tabs).length === 0) {
            tabElement.classList.add("active-tab");
            this.activeTabId = tabId;
        }
        const icon = document.createElement("div");
        icon.className = "tab-icon";
        icon.style.backgroundImage = iconUrl ? `url("${iconUrl}")` : "";
        const nameElement = document.createElement("div");
        nameElement.className = "tab-name";
        nameElement.textContent = name || "Untitled";
        const closeButton = document.createElement("div");
        closeButton.className = "tab-close";
        closeButton.innerHTML = "×";
        closeButton.onclick = (e) => {
            e.stopPropagation();
            this.closeTab(tabId);
        };
        tabElement.appendChild(icon);
        tabElement.appendChild(nameElement);
        tabElement.appendChild(closeButton);
        tabElement.addEventListener("click", () => {
            this.switchToTab(tabId);
        });

        this.addDragHandlers(tabElement, tabId);

        this.tabs[tabId] = {
            id: tabId,
            element: tabElement,
            url: url,
            name: name || "Untitled",
            iconUrl: iconUrl || "",
        };
        const tabBar = this.getTabBar();
        if (tabBar) {
            const tabsContainer = tabBar.querySelector(
                ".tabs-scroll-container"
            );
            if (tabsContainer) {
                const addBtn = tabsContainer.querySelector(".tab-add-button")!;
                tabsContainer.insertBefore(tabElement, addBtn);
                this.checkScrollability();
            }
        }

        return tabId;
    },

    addDragHandlers(tabElement, tabId) {
        tabElement.addEventListener("mousedown", (e) => {
            if ((e.target as HTMLElement).classList.contains("tab-close")) {
                return;
            }

            e.stopPropagation();

            const rect = tabElement.getBoundingClientRect();
            this.dragState.isDragging = false;
            this.dragState.draggedTabId = tabId;
            this.dragState.draggedTab = tabElement;
            this.dragState.startX = e.clientX;
            this.dragState.offsetX = e.clientX - rect.left;
            this.dragState.lastMouseX = e.clientX;

            this.updateTabPositions();

            e.preventDefault();
        });
    },

    setupDragListeners() {
        document.addEventListener("mousemove", this.handleMouseMove.bind(this));
        document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    },

    updateTabPositions() {
        const tabBar = this.getTabBar();
        if (!tabBar) return;

        const tabsContainer = tabBar.querySelector(".tabs-scroll-container");
        if (!tabsContainer) return;

        this.dragState.tabPositions = [];
        const tabs: NodeListOf<HTMLElement> =
            tabsContainer.querySelectorAll(".channel-tab");

        tabs.forEach((tab) => {
            if (tab.dataset.tabId) {
                const rect = tab.getBoundingClientRect();
                this.dragState.tabPositions.push({
                    id: tab.dataset.tabId,
                    left: rect.left,
                    width: rect.width,
                });
            }
        });
    },

    handleMouseMove(e) {
        const { draggedTabId, draggedTab, startX } = this.dragState;
        if (!draggedTabId || !draggedTab) return;
        const moveDistance = Math.abs(e.clientX - startX);
        if (!this.dragState.isDragging && moveDistance > 5) {
            this.startDrag();
        }

        if (this.dragState.isDragging) {
            this.processDragMove(e.clientX);
        }
    },

    startDrag() {
        const { draggedTab } = this.dragState;
        if (!draggedTab) return;

        this.dragState.isDragging = true;

        const rect = draggedTab.getBoundingClientRect();

        const placeholder = draggedTab.cloneNode(false) as HTMLElement;
        placeholder.classList.add("tab-placeholder");
        placeholder.style.visibility = "hidden";

        draggedTab.parentNode?.insertBefore(
            placeholder,
            draggedTab.nextSibling
        );
        this.dragState.placeholder = placeholder;

        draggedTab.classList.add("tab-dragging");
        draggedTab.style.position = "absolute";
        draggedTab.style.zIndex = "1000";
        draggedTab.style.width = `${draggedTab.offsetWidth}px`;

        draggedTab.style.left = `${rect.left}px`;
        draggedTab.style.top = `${rect.top}px`;

        this.updateTabPositions();
    },

    processDragMove(mouseX) {
        const { draggedTab, offsetX, lastMouseX } = this.dragState;
        if (!draggedTab) return;

        draggedTab.style.left = `${mouseX - offsetX}px`;
        this.dragState.lastMouseX = mouseX;

        this.checkForTabSwap(mouseX - offsetX + draggedTab.offsetWidth / 2);
    },

    checkForTabSwap(centerX) {
        const { draggedTabId, placeholder } = this.dragState;
        if (!draggedTabId || !placeholder) return;

        for (const tab of this.dragState.tabPositions) {
            if (tab.id === draggedTabId) continue;

            const tabCenter = tab.left + tab.width / 2;
            const tabElement = document.querySelector(
                `.channel-tab[data-tab-id="${tab.id}"]`
            ) as HTMLElement;

            if (!tabElement) continue;

            if (Math.abs(centerX - tabCenter) < tab.width * 0.4) {
                const tabBar = this.getTabBar();
                if (!tabBar) return;

                const tabsContainer = tabBar.querySelector(
                    ".tabs-scroll-container"
                );
                if (!tabsContainer) return;
                // const draggedIndex = this.dragState.tabPositions.findIndex(
                //     (t) => t.id === draggedTabId
                // );
                // const targetIndex = this.dragState.tabPositions.findIndex(
                //     (t) => t.id === tab.id
                // );

                // if (draggedIndex < targetIndex) {
                //     tabElement.style.transform = `translateX(-${tab.width}px)`;
                // } else {
                //     tabElement.style.transform = `translateX(${tab.width}px)`;
                // }
                // tabElement.style.transition = 'transform 0.2s ease;';
                // requestAnimationFrame(() => {
                //     tabElement.style.transform = "translateX(0px)";
                // });

                // setTimeout(() => {
                //     tabElement.style.transition = "";
                //     tabElement.style.transform = "";
                // }, 200);
                const activeTab = tabsContainer.querySelector(".active-tab");

                if (centerX < tabCenter) {
                    tabElement.parentNode?.insertBefore(
                        placeholder,
                        tabElement
                    );
                } else {
                    tabElement.parentNode?.insertBefore(
                        placeholder,
                        tabElement.nextSibling
                    );
                }

                if (activeTab) {
                    const activeTabId = activeTab.getAttribute("data-tab-id");
                    if (activeTabId) {
                        tabsContainer
                            .querySelectorAll(
                                `.channel-tab[data-tab-id="${activeTabId}"]`
                            )
                            .forEach((tab) => {
                                if (tab !== this.dragState.draggedTab) {
                                    tab.classList.add("active-tab");
                                }
                            });
                    }
                }

                this.updateTabPositions();
                break;
            }
        }
    },

    handleMouseUp() {
        const { isDragging, draggedTabId, draggedTab, placeholder } =
            this.dragState;

        if (!isDragging || !draggedTabId || !draggedTab) {
            this.resetDragState();
            return;
        }

        draggedTab.classList.remove("tab-dragging");
        draggedTab.style.position = "";
        draggedTab.style.left = "";
        draggedTab.style.zIndex = "";

        if (placeholder && placeholder.parentNode) {
            placeholder.parentNode.insertBefore(draggedTab, placeholder);
            placeholder.remove();
        }

        if (draggedTabId === this.activeTabId) {
            draggedTab.classList.add("active-tab");
        }

        this.checkScrollability();
        this.resetDragState();
    },

    resetDragState() {
        this.dragState = {
            isDragging: false,
            draggedTabId: null,
            draggedTab: null,
            startX: 0,
            offsetX: 0,
            lastMouseX: 0,
            placeholder: null,
            tabPositions: [],
        };
    },

    switchToTab(tabId) {
        if (!this.tabs[tabId]) return;
        if (this.activeTabId && this.tabs[this.activeTabId]) {
            this.tabs[this.activeTabId].element.classList.remove("active-tab");
        }
        this.activeTabId = tabId;
        this.tabs[tabId].element.classList.add("active-tab");
        NavigationRouter.transitionTo(this.tabs[tabId].url);

        this.scrollTabIntoView(tabId);
    },

    scrollTabIntoView(tabId) {
        const tabElement = this.tabs[tabId]?.element;
        if (!tabElement) return;

        const tabBar = this.getTabBar();
        if (!tabBar) return;

        const tabsContainer = tabBar.querySelector(".tabs-scroll-container");
        if (!tabsContainer) return;

        const tabRect = tabElement.getBoundingClientRect();
        const containerRect = tabsContainer.getBoundingClientRect();

        if (
            tabRect.left < containerRect.left ||
            tabRect.right > containerRect.right
        ) {
            const scrollAmount =
                tabRect.left -
                containerRect.left -
                containerRect.width / 2 +
                tabRect.width / 2;

            tabsContainer.scrollBy({
                left: scrollAmount,
                behavior: "smooth",
            });
        }
    },

    closeTab(tabId) {
        if (!this.tabs[tabId]) return;
        const tab = this.tabs[tabId];
        if (!tab) return;
        this.closedTabs.push({
            url: tab.url,
            name: tab.name,
            iconUrl: tab.iconUrl,
        });
        const tabElement = tab.element;
        tabElement.remove();
        if (tabId === this.activeTabId) {
            const remainingTabIds = Object.keys(this.tabs).filter(
                (id) => id !== tabId
            );
            if (remainingTabIds.length > 0) {
                this.switchToTab(remainingTabIds[0]);
            }
        }
        delete this.tabs[tabId];
        this.checkScrollability();
    },

    updateTab(tabId, { url, name, iconUrl }) {
        if (!this.tabs[tabId]) return;
        const tab = this.tabs[tabId];
        if (url) tab.url = url;
        if (name) {
            tab.name = name;
            const nameElement = tab.element.querySelector(".tab-name");
            if (nameElement) nameElement.textContent = name;
        }
        if (iconUrl) {
            tab.iconUrl = iconUrl;
            const iconElement = tab.element.querySelector(".tab-icon");
            if (iconElement)
                iconElement.style.backgroundImage = `url("${iconUrl}")`;
        }
    },

    getPageInfo() {
        const pathname = window.location.pathname;
        let name = document.title.replace(/\(\d+\) Discord \| /, "");
        let iconUrl = "";
        if (pathname.includes("/channels/")) {
            if (pathname.includes("/channels/@me")) {
                if (pathname === "/channels/@me") {
                    name = "Friends";
                } else {
                    const iconElement = document.querySelector(
                        "section.title_f75fb0 .avatarStack__44b0c > img"
                    ) as HTMLImageElement;
                    console.log(iconElement);
                    const image = iconElement?.src;
                    if (image) iconUrl = image;
                }
            } else {
                const iconElement = document.querySelector(
                    ".title_c38106 > .title__85643 > .guildIcon__85643"
                );
                if (iconElement) {
                    const bgImage =
                        window.getComputedStyle(iconElement).backgroundImage;
                    if (bgImage && bgImage !== "none")
                        iconUrl = bgImage.slice(5, -2);
                }
            }
        }
        if (!iconUrl)
            iconUrl =
                "https://www.gracefullittlehoneybee.com/wp-content/uploads/2014/09/Slow-Cooker-Pinto-Beans-3.jpg";
        return {
            url: pathname,
            name: name || "Untitled",
            iconUrl,
        };
    },

    getTabBar() {
        let tabBar = document.getElementById("channel-tabs-bar");
        if (!tabBar) {
            tabBar = document.createElement("div");
            tabBar.id = "channel-tabs-bar";
            tabBar.className = "channel-tabs-container";

            tabBar.addEventListener("dblclick", (e) => {
                e.stopPropagation();
            });

            const scrollButtonsContainer = document.createElement("div");
            scrollButtonsContainer.className = "tabs-scroll-buttons";

            scrollButtonsContainer.addEventListener("dblclick", (e) => {
                e.stopPropagation();
            });

            const leftScrollButton = document.createElement("div");
            leftScrollButton.className = "tab-scroll-button tab-scroll-left";
            leftScrollButton.innerHTML = "‹";
            leftScrollButton.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                this.startScrolling("left");
            });
            leftScrollButton.addEventListener("mouseup", (e) => {
                e.stopPropagation();
                this.stopScrolling();
            });
            leftScrollButton.addEventListener("mouseleave", () =>
                this.stopScrolling()
            );

            const rightScrollButton = document.createElement("div");
            rightScrollButton.className = "tab-scroll-button tab-scroll-right";
            rightScrollButton.innerHTML = "›";
            rightScrollButton.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                this.startScrolling("right");
            });
            rightScrollButton.addEventListener("mouseup", (e) => {
                e.stopPropagation();
                this.stopScrolling();
            });
            rightScrollButton.addEventListener("mouseleave", () =>
                this.stopScrolling()
            );

            scrollButtonsContainer.appendChild(leftScrollButton);
            scrollButtonsContainer.appendChild(rightScrollButton);

            const tabsScrollContainer = document.createElement("div");
            tabsScrollContainer.className = "tabs-scroll-container";

            tabsScrollContainer.addEventListener("dblclick", (e) => {
                e.stopPropagation();
            });

            const addButton = document.createElement("div");
            addButton.className = "tab-add-button";
            addButton.textContent = "+";
            addButton.onclick = (e) => {
                e.stopPropagation();
                const info = this.getPageInfo();
                this.switchToTab(
                    this.createTab(info.url, info.name, info.iconUrl)
                );
            };
            tabsScrollContainer.appendChild(addButton);

            tabBar.appendChild(scrollButtonsContainer);
            tabBar.appendChild(tabsScrollContainer);

            const titleBar = document.querySelector(".title_c38106");
            if (titleBar) {
                titleBar.parentNode?.insertBefore(tabBar, titleBar);
            } else {
                const appMount = document.getElementById("app-mount");
                if (appMount) {
                    appMount.firstChild?.insertBefore(
                        tabBar,
                        appMount.firstChild.firstChild
                    );
                }
            }
            this.addStyles();
        }
        return tabBar;
    },

    startScrolling(direction) {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
        }

        const tabBar = this.getTabBar();
        if (!tabBar) return;

        const tabsContainer = tabBar.querySelector(".tabs-scroll-container");
        if (!tabsContainer) return;

        const scrollAmount = direction === "left" ? -15 : 15;

        tabsContainer.scrollBy({ left: scrollAmount });

        this.scrollInterval = setInterval(() => {
            tabsContainer.scrollBy({ left: scrollAmount * 10 });
        }, 350);

        this.updateScrollButtonVisibility();
    },

    stopScrolling() {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
    },

    checkScrollability() {
        const tabBar = this.getTabBar();
        if (!tabBar) return;

        const tabsContainer = tabBar.querySelector(".tabs-scroll-container");
        if (!tabsContainer) return;

        const isScrollable =
            tabsContainer.scrollWidth > tabsContainer.clientWidth;

        tabBar.classList.toggle("is-scrollable", isScrollable);
        this.updateScrollButtonVisibility();
    },

    updateScrollButtonVisibility() {
        const tabBar = this.getTabBar();
        if (!tabBar) return;

        const tabsContainer = tabBar.querySelector(".tabs-scroll-container");
        if (!tabsContainer) return;

        const leftButton = tabBar.querySelector(".tab-scroll-left");
        const rightButton = tabBar.querySelector(".tab-scroll-right");

        if (leftButton && rightButton) {
            const visible =
                tabsContainer.scrollLeft > 0 ||
                tabsContainer.scrollLeft <
                tabsContainer.scrollWidth - tabsContainer.clientWidth;
            leftButton.classList.toggle("visible", visible);

            rightButton.classList.toggle("visible", visible);
        }
    },

    addStyles() {
        const style = document.createElement("style");
        style.id = "channel-tabs-styles";
        style.textContent = `
        .channel-tabs-container {
            display: flex;
            height: 36px;
            border-bottom: 1px solid var(--background-tertiary);
            position: absolute;
            right: 6em;
            top: 0;
            left: 0;
            color: var(--text-normal);
            z-index: 100;
            pointer-events: auto;
            -webkit-app-region: no-drag;
            background-color: var(--background-secondary);
            height: 32px
        }
        .tabs-scroll-container {
            display: flex;
            flex: 1;
            overflow-x: auto;
            overflow-y: hidden;
            white-space: nowrap;
            scrollbar-width: none;
            position: relative;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            -webkit-app-region: no-drag;
        }
        .tabs-scroll-container::-webkit-scrollbar {
            display: none;
        }
        .tabs-scroll-buttons {
            display: none;
            position: relative;
            z-index: 2;
        }
        .channel-tabs-container.is-scrollable .tabs-scroll-buttons {
            display: flex;
        }
        .tab-scroll-button {
            width: 24px;
            display: none;
            align-items: center;
            justify-content: center;
            background-color: var(--background-secondary);
            cursor: pointer;
            opacity: 0.8;
            font-size: 18px;
            user-select: none;
            -webkit-app-region: no-drag;
        }
        .tab-scroll-button.visible {
            display: flex;
        }
        .tab-scroll-button:hover {
            opacity: 1;
            background-color: var(--background-modifier-hover);
        }
        .tab-scroll-left {
            border-right: 1px solid var(--background-tertiary);
        }
        .tab-scroll-right {
            border-left: 1px solid var(--background-tertiary);
        }

        .channel-tab {
            display: flex;
            align-items: center;
            padding: 0 12px;
            min-width: 100px;
            max-width: 200px;
            height: 32px;
            background-color: var(--background-secondary);
            margin-right: 4px;
            border-radius: 6px 6px 0 0;
            cursor: pointer;
            transition: background-color 0.2s, box-shadow 0.2s;
            overflow: hidden;
            user-select: none;
            -webkit-app-region: no-drag;

            position: relative;
            top: 2px;
        }

        .channel-tab:hover {
            background-color: var(--background-modifier-hover);
        }

        .channel-tab.active-tab {
            background-color: var(--background-primary);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            border-bottom: none;
            z-index: 5;
        }

        .channel-tab::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 6px 6px 0 0;
        }

        .channel-tab.active-tab::before {
            border-top: 0.1em solid var(--text-normal);
        }

        .tab-dragging {
            transition: none;
            opacity: 0.8;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            pointer-events: none;
        }

        .tab-placeholder {
            min-width: 100px;
            height: 32px;
            border: 2px dashed var(--background-tertiary);
            background-color: var(--background-secondary-alt);
            opacity: 0.6;
        }

        .tab-icon {
            width: 16px;
            height: 16px;
            background-size: cover;
            background-position: center;
            margin-right: 6px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .tab-name {
            flex: 1;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            font-size: 14px;
            color: var(--text-normal);
        }

        .tab-close {
            margin-left: 6px;
            font-size: 16px;
            line-height: 16px;
            width: 16px;
            height: 16px;
            text-align: center;
            border-radius: 50%;
            opacity: 0.7;
            flex-shrink: 0;
            z-index:999;
        }

        .tab-close:hover {
            background-color: var(--background-modifier-active);
            opacity: 1;
        }

        .tab-add-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 32px;
            font-size: 20px;
            cursor: pointer;
            opacity: 0.7;
            border-radius: 6px 6px 0 0;
            flex-shrink: 0;
            background-color: var(--background-secondary);
        }

        .tab-add-button:hover {
            opacity: 1;
            background-color: var(--background-modifier-hover);
        }
    `;

        document.head.appendChild(style);
    },

    setupNavListener() {
        const originalTransitionTo = NavigationRouter.transitionTo;
        NavigationRouter.transitionTo = (path, ...args) => {
            const result = originalTransitionTo.call(
                NavigationRouter,
                path,
                ...args
            );
            setTimeout(() => this.handleNavigation(path), 100);
            return result;
        };
        this.urlObserver = new MutationObserver(() => {
            const currentPath = window.location.pathname;
            if (this.lastObservedPath === currentPath) return;
            this.lastObservedPath = currentPath;
            this.handleNavigation(currentPath);
        });
        this.urlObserver.observe(document.querySelector("title"), {
            childList: true,
        });
        this.lastObservedPath = window.location.pathname;
    },

    handleNavigation(path) {
        if (this.activeTabId && this.tabs[this.activeTabId]) {
            const info = this.getPageInfo();
            this.updateTab(this.activeTabId, {
                url: path,
                name: info.name,
                iconUrl: info.iconUrl,
            });
        } else {
            const info = this.getPageInfo();
            const newTabId = this.createTab(path, info.name, info.iconUrl);
            this.switchToTab(newTabId);
        }
    },

    keybindListener(e: KeyboardEvent) {
        if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "w") {
            e.preventDefault();
            if (plugin.activeTabId) plugin.closeTab(plugin.activeTabId);
        } else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "t") {
            e.preventDefault();
            const info = plugin.getPageInfo();
            const newId = plugin.createTab(info.url, info.name, info.iconUrl);
            plugin.switchToTab(newId);
        } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "t") {
            e.preventDefault();
            const last = plugin.closedTabs.pop();
            if (last) {
                const reopened = plugin.createTab(
                    last.url,
                    last.name,
                    last.iconUrl
                );
                plugin.switchToTab(reopened);
            }
        } else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "tab") {
            e.preventDefault();
            const tabIds = Object.keys(plugin.tabs);
            if (plugin.activeTabId) {
                const currentIndex = tabIds.indexOf(plugin.activeTabId);
                const nextIndex = (currentIndex + 1) % tabIds.length;
                plugin.switchToTab(tabIds[nextIndex]);
            }
        } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "tab") {
            e.preventDefault();
            const tabIds = Object.keys(plugin.tabs);
            if (plugin.activeTabId) {
                const currentIndex = tabIds.indexOf(plugin.activeTabId);
                const prevIndex =
                    (currentIndex - 1 + tabIds.length) % tabIds.length;
                plugin.switchToTab(tabIds[prevIndex]);
            }
        }
    },
    keybindEnabled: false,
    enableKeybinds() {
        if (this.settings.store.addTabKeybinds && !this.keybindEnabled) {
            if (Vencord.PlainSettings.plugins.WebKeybinds.enabled) {
                showNotification({
                    title: "Channel Tabs",
                    body: "Incompatible Plugin!\nWebKeybinds is incompatible with ChannelTabs keybinds, disable WebKeybinds and restart to use ChannelTabs keybinds.",
                    permanent: true,
                });
                return;
            }
            console.log("keybind registered");
            document.addEventListener("keydown", this.keybindListener);
            this.keybindEnabled = true;
        } else {
            this.disableKeybinds();
        }
    },

    disableKeybinds() {
        console.log("keybind unregisterd");
        document.removeEventListener("keydown", this.keybindListener);
        this.keybindEnabled = false;
    },
    repairObserver: null as MutationObserver | null,
    async start() {
        const waitForTitleBar = new Promise<HTMLElement>((resolve) => {
            const observer = new MutationObserver(() => {
                const titleBar = document.querySelector(".title_c38106");
                if (titleBar) {
                    observer.disconnect();
                    resolve(titleBar as HTMLElement);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            const titleBar = document.querySelector(".title_c38106");
            if (titleBar) {
                observer.disconnect();
                resolve(titleBar as HTMLElement);
            }
        });
        const titlebar = await waitForTitleBar;
        titlebar.style.display = "none";
        this.getTabBar();
        this.setupNavListener();
        this.setupDragListeners();
        const info = this.getPageInfo();
        const initialTabId = this.createTab(info.url, info.name, info.iconUrl);
        this.switchToTab(initialTabId);

        const tabBar = this.getTabBar();
        if (tabBar) {
            const tabsContainer = tabBar.querySelector(
                ".tabs-scroll-container"
            );
            if (tabsContainer) {
                tabsContainer.addEventListener("scroll", () => {
                    this.updateScrollButtonVisibility();
                });

                window.addEventListener("resize", () => {
                    this.checkScrollability();
                });

                tabsContainer.addEventListener("wheel", (e: any) => {
                    e = e as WheelEvent;
                    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                        tabsContainer.scrollLeft += e.deltaY;
                    }
                });
            }
        }

        this.repairObserver = new MutationObserver(() => {
            const originalTitleBar = document.querySelector(
                ".title_c38106"
            ) as HTMLDivElement;
            const customTabBar = document.getElementById(
                "channel-tabs-bar"
            ) as HTMLDivElement;

            if (originalTitleBar && originalTitleBar.style.display !== "none") {
                originalTitleBar.style.display = "none";
            }

            if (!customTabBar) {
                this.getTabBar();
                this.setupDragListeners();
            }
        });

        this.repairObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });

        setTimeout(() => this.checkScrollability(), 500);

        this.enableKeybinds();
    },
    stop() {
        this.repairObserver?.disconnect();
        this.disableKeybinds();
        const tabBar = document.getElementById("channel-tabs-bar");
        if (tabBar) tabBar.remove();
        const styles = document.getElementById("channel-tabs-styles");
        if (styles) styles.remove();
        if (this.urlObserver) {
            this.urlObserver.disconnect();
        }
        const titleBar: HTMLElement | null =
            document.querySelector(".title_c38106");
        if (titleBar) {
            titleBar.style.display = "flex";
        }
        document.removeEventListener(
            "mousemove",
            this.handleMouseMove.bind(this)
        );
        document.removeEventListener("mouseup", this.handleMouseUp.bind(this));

        window.removeEventListener("resize", () => {
            this.checkScrollability();
        });

        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }

        this.tabs = {};
        this.activeTabId = null;
    },
});

export default plugin;
