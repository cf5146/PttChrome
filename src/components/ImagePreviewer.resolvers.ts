import { getSafeImageUrl } from "../js/util";
import { RESOURCE_LIMITS } from "../js/resource_limits";

import type {
  HoverPreviewValue,
  PreviewRequest,
  PreviewResolver,
  PreviewValue,
} from "./ImagePreviewer.types";

const DIRECT_IMAGE_URL_REGEX =
  /^https?:\/\/.+\.(?:avif|bmp|gif|jpe?g|png|webp)(?:[?#].*)?$/i;
const IMAGE_LOAD_TIMEOUT_MS = 10000;
let pendingPreviewRequests = 0;

const withPreviewSlot = <TValue extends PreviewValue>(
  request: PreviewRequest<TValue>
): PreviewRequest<TValue> => {
  if (pendingPreviewRequests >= RESOURCE_LIMITS.maxPreviewRequests) {
    return Promise.reject(new Error("Too many image previews"));
  }

  pendingPreviewRequests += 1;
  return request.finally(() => {
    pendingPreviewRequests -= 1;
  });
};

const resolveImgurImageUrl = (photoId: string, extension = "jpg") => ({
  src: `https://i.imgur.com/${photoId}.${extension}`,
});

const imageUrlResolvers: PreviewResolver[] = [
  {
    test() {
      return true;
    },
    request() {
      return Promise.reject(new Error("Unimplemented"));
    },
  },
];

const registerImageUrlResolver = (resolver: PreviewResolver) => {
  imageUrlResolvers.unshift(resolver);
};

registerImageUrlResolver({
  test(src) {
    return DIRECT_IMAGE_URL_REGEX.test(src);
  },
  request(src) {
    return Promise.resolve({ src });
  },
});

registerImageUrlResolver({
  regex:
    /^https?:\/\/(?:m\.)?imgur\.com\/(?:gallery|t\/[^/]+)\/([^/?#.]+)(?:\.(\w+))?(?:[?#].*)?$/,
  test(src) {
    return this.regex.test(src);
  },
  request(src) {
    const match = this.regex.exec(src);
    const photoId = match?.[1] || "";
    const extension = match?.[2] || "jpg";

    return Promise.resolve(resolveImgurImageUrl(photoId, extension));
  },
} as PreviewResolver & { regex: RegExp });

registerImageUrlResolver({
  regex:
    /^https?:\/\/(?:i\.|m\.)?imgur\.com\/([^.?#/]+)(?:\.(\w+))?(?:[?#].*)?$/,
  test(src) {
    return this.regex.test(src);
  },
  request(src) {
    const match = this.regex.exec(src);
    const photoId = match?.[1] || "";
    const extension = match?.[2] || "jpg";

    return Promise.resolve(resolveImgurImageUrl(photoId, extension));
  },
} as PreviewResolver & { regex: RegExp });

export const of = (src: string): PreviewRequest<PreviewValue> => {
  const safeSrc = getSafeImageUrl(src);

  return safeSrc
    ? Promise.resolve({ src: safeSrc })
    : Promise.reject(new Error("Unsafe image URL"));
};

export const resolveSrcToImageUrl = ({
  src,
}: {
  src: string;
}): PreviewRequest<PreviewValue> => {
  const safeSrc = getSafeImageUrl(src);
  if (!safeSrc) {
    return Promise.reject(new Error("Unsafe image URL"));
  }

  const resolver = imageUrlResolvers.find((entry) => entry.test(safeSrc));

  return resolver
    ? resolver.request(safeSrc).then((value) => {
        const safeResolvedSrc = getSafeImageUrl(value.src);
        if (!safeResolvedSrc) {
          throw new Error("Unsafe resolved image URL");
        }

        return {
          ...value,
          src: safeResolvedSrc,
        };
      })
    : Promise.reject(new Error("Unimplemented"));
};

export const createInlineImagePreviewRequest = (
  src: string
): PreviewRequest<PreviewValue> =>
  withPreviewSlot(of(src).then(resolveSrcToImageUrl));

export const resolveWithImageDOM = ({
  src,
}: PreviewValue): PreviewRequest<HoverPreviewValue> =>
  new Promise((resolve, reject) => {
    const safeSrc = getSafeImageUrl(src);
    if (!safeSrc) {
      reject(new Error("Unsafe image URL"));
      return;
    }

    const img = new Image();
    const timeoutId = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error("Image load timed out"));
    }, IMAGE_LOAD_TIMEOUT_MS);

    img.onload = () => {
      clearTimeout(timeoutId);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      resolve({
        src: safeSrc,
        width,
        height,
      });
    };
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error("Image failed to load"));
    };
    img.referrerPolicy = "no-referrer";
    img.src = safeSrc;
  });

export const createHoverImagePreviewRequest = (
  src: string
): PreviewRequest<HoverPreviewValue> =>
  withPreviewSlot(of(src).then(resolveSrcToImageUrl).then(resolveWithImageDOM));