import { decode } from "base58";

import type {
  HoverPreviewValue,
  PreviewRequest,
  PreviewResolver,
  PreviewValue,
} from "./ImagePreviewer.types";

const stringifyQuery = (query: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(query).map(([key, value]) => [key, String(value)])
  ).toString();

const DIRECT_IMAGE_URL_REGEX =
  /^https?:\/\/.+\.(?:avif|bmp|gif|jpe?g|png|webp)(?:[?#].*)?$/i;

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
  regex: /flic\.kr\/p\/(\w+)|flickr\.com\/photos\/[\w@]+\/(\d+)/,
  test(src) {
    return this.regex.test(src);
  },
  request(src) {
    const match = src.match(this.regex);
    const flickrBase58Id = match?.[1];
    const flickrPhotoId = match?.[2];
    const photoId = flickrBase58Id ? decode(flickrBase58Id) : flickrPhotoId;

    const apiURL = `https://api.flickr.com/services/rest/?${stringifyQuery({
      method: "flickr.photos.getInfo",
      api_key: "c8c95356e465b8d7398ff2847152740e",
      photo_id: photoId || "",
      format: "json",
      nojsoncallback: 1,
    })}`;

    return fetch(apiURL, {
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.photo) {
          throw new Error("Not found");
        }

        const { farm, server: serverId, id, secret } = data.photo;
        return {
          src: `https://farm${farm}.staticflickr.com/${serverId}/${id}_${secret}.jpg`,
        };
      });
  },
} as PreviewResolver & { regex: RegExp });

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
    /^https?:\/\/(?:i\.|m\.)?imgur\.com\/([^./?#/]+)(?:\.(\w+))?(?:[?#].*)?$/,
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

export const of = (src: string): PreviewRequest<PreviewValue> =>
  Promise.resolve({ src });

export const resolveSrcToImageUrl = ({
  src,
}: {
  src: string;
}): PreviewRequest<PreviewValue> => {
  const resolver = imageUrlResolvers.find((entry) => entry.test(src));

  return resolver
    ? resolver.request(src)
    : Promise.reject(new Error("Unimplemented"));
};

export const createInlineImagePreviewRequest = (
  src: string
): PreviewRequest<PreviewValue> => of(src).then(resolveSrcToImageUrl);

export const resolveWithImageDOM = ({
  src,
}: PreviewValue): PreviewRequest<HoverPreviewValue> =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      resolve({
        src,
        width,
        height,
      });
    };
    img.onerror = reject;
    img.src = src;
  });

export const createHoverImagePreviewRequest = (
  src: string
): PreviewRequest<HoverPreviewValue> =>
  createInlineImagePreviewRequest(src).then(resolveWithImageDOM);