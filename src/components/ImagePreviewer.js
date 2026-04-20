import {
  HoverImagePreviewContent,
  InlineImagePreviewContent,
  LegacyImagePreviewer
} from "./ImagePreviewer.core";

const ImagePreviewer = LegacyImagePreviewer;

ImagePreviewer.OnHover = HoverImagePreviewContent;
ImagePreviewer.Inline = InlineImagePreviewContent;

export {
  HoverImagePreview,
  HoverImagePreviewContent,
  InlineImagePreview,
  InlineImagePreviewContent,
  LegacyImagePreviewer
} from "./ImagePreviewer.core";
export {
  createHoverImagePreviewRequest,
  createInlineImagePreviewRequest,
  of,
  resolveSrcToImageUrl,
  resolveWithImageDOM
} from "./ImagePreviewer.resolvers";

export default ImagePreviewer;
