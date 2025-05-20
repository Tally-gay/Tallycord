/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { NavigationRouter } from "@webpack/common";

export default definePlugin({
    name: "ChannelTabs",
    description: "Adds tabs for your channels",
    authors: [Devs.tally],

    tabs: {} as { [tabKey: string]: any; },
    activeTabId: null as string | null,
    originalTitleBar: null as HTMLElement | null,

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
        this.tabs[tabId] = {
            id: tabId,
            element: tabElement,
            url: url,
            name: name || "Untitled",
            iconUrl: iconUrl || "",
        };
        const tabBar = this.getTabBar();
        if (tabBar) {
            tabBar.appendChild(tabElement);
        }
        return tabId;
    },
    switchToTab(tabId) {
        if (!this.tabs[tabId]) return;
        if (this.activeTabId && this.tabs[this.activeTabId]) {
            this.tabs[this.activeTabId].element.classList.remove("active-tab");
        }
        this.activeTabId = tabId;
        this.tabs[tabId].element.classList.add("active-tab");
        NavigationRouter.transitionTo(this.tabs[tabId].url);
    },
    closeTab(tabId) {
        if (!this.tabs[tabId]) return;
        const tabElement = this.tabs[tabId].element;
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

                if (
                    pathname === "/channels/@me"
                ) {

                    name = "Friends";

                } else {
                    const iconElement = document.querySelector(
                        "section.title_f75fb0 .avatarStack__44b0c > img"
                    ) as HTMLImageElement;
                    console.log(iconElement);
                    const image = iconElement.src;
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
            const addButton = document.createElement("div");
            addButton.className = "tab-add-button";
            addButton.textContent = "+";
            addButton.onclick = () => {
                const info = this.getPageInfo();
                this.switchToTab(
                    this.createTab(info.url, info.name, info.iconUrl)
                );
            };
            tabBar.appendChild(addButton);
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
    addStyles() {
        const style = document.createElement("style");
        style.id = "channel-tabs-styles";
        style.textContent = `
            .channel-tabs-container {
                display: flex;
                height: 32px;
                border-bottom: 1px solid var(--background-tertiary);
                overflow-x: auto;
                overflow-y: hidden;
                white-space: nowrap;
                position: absolute;
                right: 5em;
                top: 0;
                left: 0;
                color: var(--text-normal)
            }
            .channel-tab {
                display: flex;
                align-items: center;
                padding: 0 10px;
                min-width: 100px;
                max-width: 200px;
                height: 32px;
                background-color: var(--background-secondary);
                border-right: 1px solid var(--background-tertiary);
                cursor: pointer;
                transition: background-color 0.2s;
                overflow: hidden;
            }
            .channel-tab:hover {
                background-color: var(--background-modifier-hover);
            }
            .channel-tab.active-tab {
                background-color: var(--background-primary);
                border-bottom: 2px solid var(--brand-experiment);
            }
            .tab-icon {
                width: 16px;
                height: 16px;
                background-size: cover;
                background-position: center;
                margin-right: 5px;
                border-radius: 50%;
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
                margin-left: 5px;
                font-size: 16px;
                line-height: 16px;
                width: 16px;
                height: 16px;
                text-align: center;
                border-radius: 50%;
                opacity: 0.7;
            }
            .tab-close:hover {
                background-color: var(--background-modifier-active);
                opacity: 1;
            }
            .tab-add-button {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 32px;
                font-size: 20px;
                cursor: pointer;
                opacity: 0.7;
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
        const info = this.getPageInfo();
        const initialTabId = this.createTab(info.url, info.name, info.iconUrl);
        this.switchToTab(initialTabId);

        const observer = new MutationObserver(() => {
            const originalTitleBar = document.querySelector(".title_c38106") as HTMLDivElement;
            const customTabBar = document.getElementById("channel-tabs-bar") as HTMLDivElement;

            if (originalTitleBar && originalTitleBar.style.display !== "none") {
                originalTitleBar.style.display = "none";
            }

            if (!customTabBar) {
                this.getTabBar();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    },
    stop() {
        const tabBar = document.getElementById("channel-tabs-bar");
        if (tabBar) tabBar.remove();
        const styles = document.getElementById("channel-tabs-styles");
        if (styles) styles.remove();
        if (this.urlObserver) {
            this.urlObserver.disconnect();
        }
        this.tabs = {};
        this.activeTabId = null;
    },
});
