/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface ChannelUnreadState {
    channelId: string;
    hasUnread: boolean;
    mentionCount: number;
    unreadCount: number;
}

export type NotificationDotState = {
    pingText: string | null;
    unreadText: string | null;
    shouldShowPing: boolean;
    shouldShowUnread: boolean;
};

export function getNotificationDotState(
    channelStates: ChannelUnreadState[],
    cachedUnreadCounts: Record<string, number>,
    shouldUseFallback: boolean
): NotificationDotState {
    let mentionCount = 0;
    let unreadCount = 0;
    let fallbackCount = 0;

    for (const state of channelStates) {
        mentionCount += state.mentionCount;
        unreadCount += state.unreadCount;

        if (state.unreadCount > 0 || !shouldUseFallback || !state.hasUnread) continue;
        fallbackCount += Math.max(cachedUnreadCounts[state.channelId] ?? 0, 1);
    }

    const totalUnread = unreadCount + fallbackCount;

    return {
        pingText: mentionCount > 0 ? String(mentionCount) : null,
        unreadText: totalUnread > 0 ? (fallbackCount > 0 ? `${totalUnread}+` : String(totalUnread)) : null,
        shouldShowPing: mentionCount > 0,
        shouldShowUnread: (totalUnread > 0) && (totalUnread > mentionCount)
    };
}

export function reconcileUnreadFallbackCache(
    cachedUnreadCounts: Record<string, number>,
    channelStates: ChannelUnreadState[]
): Record<string, number> {
    const nextCachedUnreadCounts = { ...cachedUnreadCounts };

    for (const state of channelStates) {
        if (state.unreadCount > 0) {
            nextCachedUnreadCounts[state.channelId] = state.unreadCount;
            continue;
        }

        if (!state.hasUnread) {
            delete nextCachedUnreadCounts[state.channelId];
        }
    }

    return nextCachedUnreadCounts;
}
