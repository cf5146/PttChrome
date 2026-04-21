import React from "react";

import type {
  HoverImagePreviewContentProps,
  HoverImagePreviewProps,
  HoverPreviewValue,
  InlineImagePreviewContentProps,
  InlineImagePreviewProps,
  PreviewRenderState,
  PreviewRequest,
  PreviewValue,
} from "./ImagePreviewer.types";

const PREVIEW_EDGE_PADDING = 20;
const PREVIEW_CURSOR_OFFSET = 20;
const HOVER_PREVIEW_MAX_HEIGHT_RATIO = 0.8;
const HOVER_PREVIEW_MAX_WIDTH_RATIO = 0.9;

const clamp = (value: number, min: number, max: number) => {
  if (max <= min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
};

const getViewportSize = () => ({
  width: globalThis.innerWidth || document.documentElement.clientWidth,
  height: globalThis.innerHeight || document.documentElement.clientHeight,
});

const getRenderedPreviewSize = ({
  width,
  height,
}: HoverPreviewValue): Pick<HoverPreviewValue, "width" | "height"> => {
  const viewport = getViewportSize();
  const maxWidth = viewport.width * HOVER_PREVIEW_MAX_WIDTH_RATIO;
  const maxHeight = viewport.height * HOVER_PREVIEW_MAX_HEIGHT_RATIO;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);

  return {
    width: width * scale,
    height: height * scale,
  };
};

const getHoverPreviewPosition = ({
  left = 0,
  top = 0,
  value,
}: {
  left?: number;
  top?: number;
  value: HoverPreviewValue;
}) => {
  const viewport = getViewportSize();
  const preview = getRenderedPreviewSize(value);
  const maxLeft = viewport.width - PREVIEW_EDGE_PADDING - preview.width;
  const maxTop = viewport.height - PREVIEW_EDGE_PADDING - preview.height;
  const preferredRight = left + PREVIEW_CURSOR_OFFSET;
  const preferredLeft = left - PREVIEW_CURSOR_OFFSET - preview.width;
  const resolvedLeft =
    preferredRight + preview.width <= viewport.width - PREVIEW_EDGE_PADDING
      ? preferredRight
      : preferredLeft;

  return {
    left: clamp(resolvedLeft, PREVIEW_EDGE_PADDING, maxLeft),
    top: clamp(top - preview.height / 2, PREVIEW_EDGE_PADDING, maxTop),
  };
};

const usePreviewState = <TValue extends PreviewValue>(
  request: PreviewRequest<TValue>
): PreviewRenderState<TValue> => {
  const [result, setResult] = React.useState<PreviewRenderState<TValue>>({
    value: undefined,
    error: undefined,
  });

  React.useEffect(() => {
    let isActive = true;

    setResult({
      value: undefined,
      error: undefined,
    });

    request.then(
      (value) => {
        if (!isActive) {
          return;
        }

        setResult({
          value,
          error: undefined,
        });
      },
      (error) => {
        if (!isActive) {
          return;
        }

        setResult({
          value: undefined,
          error,
        });
      }
    );

    return () => {
      isActive = false;
    };
  }, [request]);

  return result;
};

export const HoverImagePreviewContent = ({
  left,
  top,
  value,
  error,
}: HoverImagePreviewContentProps) => {
  const safeLeft = left ?? 0;
  const safeTop = top ?? 0;

  if (error) {
    return null;
  }

  if (value) {
    const position = getHoverPreviewPosition({
      left: safeLeft,
      top: safeTop,
      value,
    });

    return (
      <img
        alt=""
        src={value.src}
        style={{
          display: "block",
          position: "fixed",
          left: position.left,
          top: position.top,
          maxHeight: "80vh",
          maxWidth: "90vw",
          zIndex: 2,
        }}
      />
    );
  }

  return (
    <i
      className="glyphicon glyphicon-refresh glyphicon-refresh-animate"
      style={{
        position: "fixed",
        left: safeLeft + PREVIEW_CURSOR_OFFSET,
        top: safeTop,
        zIndex: 2,
      }}
    />
  );
};

export const InlineImagePreviewContent = ({
  value,
  error,
}: InlineImagePreviewContentProps) => {
  if (error) {
    return null;
  }

  if (value) {
    return (
      <img alt="" className="easyReadingImg hyperLinkPreview" src={value.src} />
    );
  }

  return <i className="glyphicon glyphicon-refresh glyphicon-refresh-animate" />;
};

export const HoverImagePreview = ({
  request,
  left,
  top,
}: HoverImagePreviewProps) => {
  const result = usePreviewState(request);

  return (
    <HoverImagePreviewContent
      left={left}
      top={top}
      value={result.value}
      error={result.error}
    />
  );
};

export const InlineImagePreview = ({ request }: InlineImagePreviewProps) => {
  const result = usePreviewState(request);

  return (
    <InlineImagePreviewContent value={result.value} error={result.error} />
  );
};