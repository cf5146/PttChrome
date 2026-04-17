import React from "react";
import { createRoot } from "react-dom/client";

const roots = new WeakMap();

const ensureRootEntry = container => {
  let entry = roots.get(container);

  if (!entry) {
    entry = {
      root: createRoot(container),
      pendingHighlight: undefined,
      screenHandle: {
        setCurrentHighlighted() {}
      },
      screenInstance: null
    };
    roots.set(container, entry);
  }

  return entry;
};

export const renderReactElement = (container, element) => {
  ensureRootEntry(container).root.render(element);
};

export const unmountReactElement = container => {
  const entry = roots.get(container);

  if (!entry) {
    return;
  }

  entry.root.unmount();
  roots.delete(container);
};

export const renderScreenElement = (container, element) => {
  const entry = ensureRootEntry(container);

  entry.root.render(
    React.cloneElement(element, {
      ref: instance => {
        entry.screenInstance = instance;
        entry.screenHandle.setCurrentHighlighted = row => {
          entry.pendingHighlight = row;
          if (entry.screenInstance) {
            entry.screenInstance.setCurrentHighlighted(row);
          }
        };

        if (
          instance &&
          entry.pendingHighlight !== undefined &&
          entry.pendingHighlight !== null
        ) {
          instance.setCurrentHighlighted(entry.pendingHighlight);
        }
      }
    })
  );

  return entry.screenHandle;
};