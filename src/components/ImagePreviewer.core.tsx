import React from "react";
import { createPortal } from "react-dom";

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

type HoverPreviewSize = {
  width: number;
  height: number;
};

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

const getEstimatedPreviewSize = ({
  width,
  height,
}: HoverPreviewValue): HoverPreviewSize => {
  const viewport = getViewportSize();
  const maxWidth = viewport.width * HOVER_PREVIEW_MAX_WIDTH_RATIO;
  const maxHeight = viewport.height * HOVER_PREVIEW_MAX_HEIGHT_RATIO;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);

  return {
    width: width * scale,
    height: height * scale,
  };
};

const getHorizontalPreviewPosition = ({
  left,
  previewWidth,
  viewportWidth,
}: {
  left: number;
  previewWidth: number;
  viewportWidth: number;
}) => {
  const maxLeft = viewportWidth - PREVIEW_EDGE_PADDING - previewWidth;
  const preferredRight = left + PREVIEW_CURSOR_OFFSET;
  const preferredLeft = left - PREVIEW_CURSOR_OFFSET - previewWidth;
  const clampedRight = clamp(preferredRight, PREVIEW_EDGE_PADDING, maxLeft);
  const clampedLeft = clamp(preferredLeft, PREVIEW_EDGE_PADDING, maxLeft);
  const rightClearance = clampedRight - left;
  const leftClearance = left - (clampedLeft + previewWidth);

  return rightClearance >= leftClearance ? clampedRight : clampedLeft;
};

const getHoverPreviewPosition = ({
  left = 0,
  top = 0,
  preview,
}: {
  left?: number;
  top?: number;
  preview: HoverPreviewSize;
}) => {
  const viewport = getViewportSize();
  const maxTop = viewport.height - PREVIEW_EDGE_PADDING - preview.height;

  return {
    left: getHorizontalPreviewPosition({
      left,
      previewWidth: preview.width,
      viewportWidth: viewport.width,
    }),
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
  const renderInBody = (content: React.ReactNode) => {
    if (typeof document === "undefined" || !document.body) {
      return content;
    }

    return createPortal(content, document.body);
  };

  if (error) {
    return null;
  }

  if (value) {
    const previewSize = getEstimatedPreviewSize(value);
    const position = getHoverPreviewPosition({
      left: safeLeft,
      top: safeTop,
      preview: previewSize,
    });

    return renderInBody(
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
          padding: 0,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    );
  }

  return renderInBody(
    <i
      className="glyphicon glyphicon-refresh glyphicon-refresh-animate"
      style={{
        position: "fixed",
        left: safeLeft + PREVIEW_CURSOR_OFFSET,
        top: safeTop,
        pointerEvents: "none",
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