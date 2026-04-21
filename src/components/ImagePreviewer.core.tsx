import React from "react";

import type {
  HoverImagePreviewContentProps,
  HoverImagePreviewProps,
  InlineImagePreviewContentProps,
  InlineImagePreviewProps,
  PreviewRenderState,
  PreviewRequest,
  PreviewValue,
} from "./ImagePreviewer.types";

const getTop = (top = 0, height = 0) => {
  const pageHeight =
    globalThis.innerHeight || document.documentElement.clientHeight;

  if (top + height / 2 > pageHeight - 20) {
    if (height / 2 < top) {
      return pageHeight - 20 - height;
    }
  } else if (top - 20 > height / 2) {
    return top - height / 2;
  }

  return 20;
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
    return (
      <img
        alt=""
        src={value.src}
        style={{
          display: "block",
          position: "absolute",
          left: safeLeft + 20,
          top: getTop(safeTop, value.height),
          maxHeight: "80%",
          maxWidth: "90%",
          zIndex: 2,
        }}
      />
    );
  }

  return (
    <i
      className="glyphicon glyphicon-refresh glyphicon-refresh-animate"
      style={{
        position: "absolute",
        left: safeLeft + 20,
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