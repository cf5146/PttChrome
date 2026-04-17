import PropTypes from "prop-types";
import React from "react";
import { decode } from "base58";

const stringifyQuery = query => new URLSearchParams(query).toString();

export const of = src => Promise.resolve({ src });

export const resolveSrcToImageUrl = ({ src }) =>
  imageUrlResolvers.find(r => r.test(src)).request(src);

export const createInlineImagePreviewRequest = src =>
  of(src).then(resolveSrcToImageUrl);

export const resolveWithImageDOM = ({ src }) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        src,
        height: img.height
      });
    img.onerror = reject;
    img.src = src;
  });

export const createHoverImagePreviewRequest = src =>
  createInlineImagePreviewRequest(src).then(resolveWithImageDOM);

export const ImagePreviewer = ({ component: Component, request, ...props }) => {
  const [result, setResult] = React.useState({
    value: undefined,
    error: undefined
  });

  React.useEffect(() => {
    let isActive = true;

    setResult({
      value: undefined,
      error: undefined
    });

    request.then(
      value => {
        if (!isActive) {
          return;
        }

        setResult({
          value,
          error: undefined
        });
      },
      error => {
        if (!isActive) {
          return;
        }

        setResult({
          value: undefined,
          error
        });
      }
    );

    return () => {
      isActive = false;
    };
  }, [request]);

  return <Component {...props} value={result.value} error={result.error} />;
};

const promisePropType = (props, propName, componentName) => {
  const value = props[propName];

  if (!value || typeof value.then !== "function") {
    return new Error(
      `${componentName} expected ${propName} to be a Promise-like value.`
    );
  }

  return null;
};

ImagePreviewer.propTypes = {
  component: PropTypes.elementType.isRequired,
  request: promisePropType
};

const getTop = (top, height) => {
  const pageHeight =
    globalThis.innerHeight || document.documentElement.clientHeight;

  // opening image would pass the bottom of the page
  if (top + height / 2 > pageHeight - 20) {
    if (height / 2 < top) {
      return pageHeight - 20 - height;
    }
  } else if (top - 20 > height / 2) {
    return top - height / 2;
  }
  return 20;
};

const previewValuePropType = PropTypes.shape({
  src: PropTypes.string.isRequired,
  height: PropTypes.number
});

ImagePreviewer.OnHover = ({ left, top, value, error }) => {
  if (error) {
    return null;
  } else if (value) {
    return (
      <img
        alt=""
        src={value.src}
        style={{
          display: "block",
          position: "absolute",
          left: left + 20,
          top: getTop(top, value.height),
          maxHeight: "80%",
          maxWidth: "90%",
          zIndex: 2
        }}
      />
    );
  } else {
    return (
      <i
        className="glyphicon glyphicon-refresh glyphicon-refresh-animate"
        style={{
          position: "absolute",
          left: left + 20,
          top: top,
          zIndex: 2
        }}
      />
    );
  }
};

ImagePreviewer.OnHover.propTypes = {
  left: PropTypes.number,
  top: PropTypes.number,
  value: previewValuePropType,
  error: PropTypes.any
};

ImagePreviewer.Inline = ({ value, error }) => {
  if (error) {
    return null;
  } else if (value) {
    return (
      <img alt="" className="easyReadingImg hyperLinkPreview" src={value.src} />
    );
  } else {
    return (
      <i className="glyphicon glyphicon-refresh glyphicon-refresh-animate" />
    );
  }
};

ImagePreviewer.Inline.propTypes = {
  value: previewValuePropType,
  error: PropTypes.any
};

const imageUrlResolvers = [
  {
    /*
     * Default
     */
    test() {
      return true;
    },
    request() {
      return Promise.reject(new Error("Unimplemented"));
    }
  }
];

const registerImageUrlResolver = imageUrlResolvers.unshift.bind(
  imageUrlResolvers
);

registerImageUrlResolver({
  /*
   * Flic.kr
   */
  regex: /flic\.kr\/p\/(\w+)|flickr\.com\/photos\/[\w@]+\/(\d+)/,
  test(src) {
    return this.regex.test(src);
  },
  request(src) {
    const match = src.match(this.regex);
    const flickrBase58Id = match[1];
    const flickrPhotoId = match[2];
    const photoId = flickrBase58Id ? decode(flickrBase58Id) : flickrPhotoId;

    const apiURL = `https://api.flickr.com/services/rest/?${stringifyQuery({
      method: "flickr.photos.getInfo",
      api_key: "c8c95356e465b8d7398ff2847152740e",
      photo_id: photoId,
      format: "json",
      nojsoncallback: 1
    })}`;
    return fetch(apiURL, {
      mode: "cors"
    })
      .then(r => r.json())
      .then(data => {
        if (!data.photo) {
          throw new Error("Not found");
        }
        const { farm, server: svr, id, secret } = data.photo;
        return {
          src: `https://farm${farm}.staticflickr.com/${svr}/${id}_${secret}.jpg`
        };
      });
  }
});

registerImageUrlResolver({
  /*
   * imgur.com
   */
  regex: /^https?:\/\/(?:i\.)?imgur\.com\/([^.]+)(?:\.(.*))?/,
  test(src) {
    return this.regex.test(src);
  },
  request(src) {
    const match = this.regex.exec(src);
    const photoId = match[1];
    const extension = match[2] || "jpg";
    return Promise.resolve({
      src: `https://i.imgur.com/${photoId}.${extension}`
    });
  }
});

export default ImagePreviewer;
