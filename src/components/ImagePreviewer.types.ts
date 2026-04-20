import type { ComponentType } from "react";

export type PreviewValue = {
  src: string;
  height?: number;
};

export type HoverPreviewValue = PreviewValue & {
  height: number;
};

export type PreviewRequest<TValue extends PreviewValue = PreviewValue> =
  Promise<TValue>;

export type PreviewRenderState<TValue extends PreviewValue = PreviewValue> = {
  value: TValue | undefined;
  error: unknown | undefined;
};

export type PreviewResolver = {
  test: (src: string) => boolean;
  request: (src: string) => PreviewRequest<PreviewValue>;
};

export type HoverImagePreviewContentProps =
  PreviewRenderState<HoverPreviewValue> & {
    left?: number;
    top?: number;
  };

export type InlineImagePreviewContentProps = PreviewRenderState<PreviewValue>;

export type HoverImagePreviewProps = {
  request: PreviewRequest<HoverPreviewValue>;
  left?: number;
  top?: number;
};

export type InlineImagePreviewProps = {
  request: PreviewRequest<PreviewValue>;
};

export type LegacyImagePreviewProps<TValue extends PreviewValue = PreviewValue> =
  {
    component: ComponentType<any>;
    request: PreviewRequest<TValue>;
  } & Record<string, unknown>;