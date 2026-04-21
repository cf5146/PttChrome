// @vitest-environment jsdom

import { act } from "react";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { HyperLink } from "./HyperLink";

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

describe("HyperLink", () => {
  let container: HTMLDivElement;
  let root: Root;
  let previousActEnvironment: boolean | undefined;

  beforeEach(() => {
    previousActEnvironment = reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    if (previousActEnvironment === undefined) {
      delete reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;
    } else {
      reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    }
  });

  it("renders safe external urls as anchors", async () => {
    await act(async () => {
      root.render(
        <HyperLink
          col={1}
          row={2}
          href="https://example.com/path?x=1"
          inner="Link"
        />
      );
    });

    const link = container.querySelector("a.y");

    expect(link?.getAttribute("href")).toBe("https://example.com/path?x=1");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("falls back to a span for unsafe urls", async () => {
    await act(async () => {
      root.render(
        <HyperLink
          col={3}
          row={4}
          href="javascript:alert(1)"
          inner="Unsafe"
        />
      );
    });

    expect(container.querySelector("a.y")).toBeNull();

    const fallback = container.querySelector<HTMLSpanElement>("span.y");

    expect(fallback?.dataset.scol).toBe("3");
    expect(fallback?.dataset.srow).toBe("4");
    expect(fallback?.textContent).toBe("Unsafe");
  });

  it("does not treat movement between link children as leaving the link", async () => {
    let leaveCount = 0;

    await act(async () => {
      root.render(
        <HyperLink
          col={5}
          row={6}
          href="https://example.com"
          inner={
            <span>
              <span className="HyperLink__first">A</span>
              <span className="HyperLink__second">B</span>
            </span>
          }
          onMouseOut={(_event) => {
            leaveCount += 1;
          }}
        />
      );
    });

    const first = container.querySelector(".HyperLink__first");
    const second = container.querySelector(".HyperLink__second");

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    act(() => {
      first?.dispatchEvent(
        new MouseEvent("mouseout", {
          bubbles: true,
          relatedTarget: second
        })
      );
    });

    expect(leaveCount).toBe(0);
  });
});