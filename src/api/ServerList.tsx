

import ErrorBoundary from "@components/ErrorBoundary";
import { ComponentType } from "react";

export const enum ServerListRenderPosition {
    Above,
    In,
}

const componentsAbove = new Set<ComponentType>();
const componentsBelow = new Set<ComponentType>();

function getRenderFunctions(position: ServerListRenderPosition) {
    return position === ServerListRenderPosition.Above ? componentsAbove : componentsBelow;
}

export function addServerListElement(position: ServerListRenderPosition, renderFunction: ComponentType) {
    getRenderFunctions(position).add(renderFunction);
}

export function removeServerListElement(position: ServerListRenderPosition, renderFunction: ComponentType) {
    getRenderFunctions(position).delete(renderFunction);
}

export const renderAll = (position: ServerListRenderPosition) => {
    return Array.from(
        getRenderFunctions(position),
        (Component, i) => (
            <ErrorBoundary noop key={i}>
                <Component />
            </ErrorBoundary>
        )
    );
};
