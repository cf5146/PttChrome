// @vitest-environment jsdom

import { act } from "react";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { WordSegmentBuilder } from "./index";
import { forceWidthStyle } from "./ForceWidthWord";

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

const createColorState = (fg: number, bg: number, blink = false) => ({
  fg,
  bg,
  blink,
  equals(other: unknown) {
    return (
      typeof other === "object" &&
      other !== null &&
      (other as { fg?: number }).fg === fg &&
      (other as { bg?: number }).bg === bg &&
      (other as { blink?: boolean }).blink === blink
    );
  },
});

describe("WordSegmentBuilder", () => {
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

  it("concatenates adjacent normal text into one colored span", async () => {
    const colorState = createColorState(1, 2);
    const builder = new WordSegmentBuilder(7, colorState);

    builder.appendNormalText("ab");
    builder.appendNormalText("cd");

    await act(async () => {
      root.render(builder.build());
    });

    const span = container.querySelector("span");

    expect(span?.className).toContain("q1");
    expect(span?.className).toContain("b2");
    expect(span?.textContent).toBe("abcd");
  });

  it("renders mixed helper elements for force-width and two-color words", async () => {
    const colorState = createColorState(3, 4);
    const builder = new WordSegmentBuilder(2, colorState);

    builder.appendForceWidthWord("X", 18);
    builder.appendTwoColorWord("Y", createColorState(1, 5), createColorState(2, 6), 0);

    await act(async () => {
      root.render(builder.build());
    });

    const padded = container.querySelector("span.wpadding");
    const twoColor = container.querySelector("span[data-text='Y']");

    expect(padded?.textContent).toBe("X");
    expect(padded?.getAttribute("style")).toContain("width: 18px");
    expect(twoColor?.className).toContain("w1");
    expect(twoColor?.className).toContain("q2");
    expect(twoColor?.className).toContain("o");
  });

  it("returns false for the null-object build and no force-width style for zero", () => {
    expect(WordSegmentBuilder.NullObject.build()).toBe(false);
    expect(WordSegmentBuilder.NullObject.isLastSegmentSameColor()).toBe(false);
    expect(forceWidthStyle(0)).toBeUndefined();
  });
});