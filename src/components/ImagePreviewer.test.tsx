// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  HoverImagePreview,
  HoverImagePreviewContent,
  InlineImagePreview,
  createHoverImagePreviewRequest,
  createInlineImagePreviewRequest,
  resolveSrcToImageUrl
} from './ImagePreviewer';

const createDeferred = <TValue,>() => {
  let resolve;
  let reject;

  const promise = new Promise<TValue>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return {
    promise,
    resolve,
    reject
  };
};

const installSuccessfulImageStub = (width = 640, height = 480) => {
  class FakeImage {
    naturalWidth = width;

    naturalHeight = height;

    width = width;

    height = height;

    onload = null;

    onerror = null;

    set src(_value) {
      if (this.onload) {
        this.onload();
      }
    }
  }

  vi.stubGlobal('Image', FakeImage);
};

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

describe('ImagePreviewer helpers', () => {
  let container;
  let root;
  let previousActEnvironment;

  beforeEach(() => {
    previousActEnvironment = reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
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
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('passes through direct image URLs from other hosts', async () => {
    await expect(
      createInlineImagePreviewRequest('https://i.mopix.cc/cX4JLB.jpg')
    ).resolves.toEqual({
      src: 'https://i.mopix.cc/cX4JLB.jpg'
    });
  });

  it('matches direct image URLs with query strings', async () => {
    await expect(
      createInlineImagePreviewRequest(
        'https://cdn.example.com/path/to/image.webp?width=800'
      )
    ).resolves.toEqual({
      src: 'https://cdn.example.com/path/to/image.webp?width=800'
    });
  });

  it('rewrites imgur page URLs to direct image URLs', async () => {
    await expect(
      createInlineImagePreviewRequest('https://imgur.com/abc123')
    ).resolves.toEqual({
      src: 'https://i.imgur.com/abc123.jpg'
    });
  });

  it('rewrites imgur gallery URLs to direct image URLs', async () => {
    await expect(
      createInlineImagePreviewRequest('https://imgur.com/gallery/abc123')
    ).resolves.toEqual({
      src: 'https://i.imgur.com/abc123.jpg'
    });
  });

  it('rewrites imgur topic URLs to direct image URLs', async () => {
    await expect(
      createInlineImagePreviewRequest('https://imgur.com/t/memes/abc123')
    ).resolves.toEqual({
      src: 'https://i.imgur.com/abc123.jpg'
    });
  });

  it('preserves explicit imgur file extensions', async () => {
    await expect(
      createInlineImagePreviewRequest('https://imgur.com/abc123.png')
    ).resolves.toEqual({
      src: 'https://i.imgur.com/abc123.png'
    });
  });

  it('resolves hover previews with measured image dimensions', async () => {
    installSuccessfulImageStub();

    await expect(
      createHoverImagePreviewRequest('https://imgur.com/hover-id')
    ).resolves.toEqual({
      src: 'https://i.imgur.com/hover-id.jpg',
      width: 640,
      height: 480
    });
  });

  it('rejects URLs without a matching resolver', async () => {
    await expect(
      resolveSrcToImageUrl({ src: 'https://example.com/not-supported' })
    ).rejects.toThrow('Unimplemented');
  });

  it('renders inline previews after the request resolves', async () => {
    await act(async () => {
      root.render(
        <InlineImagePreview
          request={createInlineImagePreviewRequest('https://i.mopix.cc/cX4JLB.jpg')}
        />
      );
    });

    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://i.mopix.cc/cX4JLB.jpg'
    );
  });

  it('renders a loading spinner while inline previews are pending', async () => {
    const deferred = createDeferred<{ src: string }>();

    await act(async () => {
      root.render(<InlineImagePreview request={deferred.promise} />);
    });

    expect(container.querySelector('i.glyphicon-refresh')).not.toBeNull();

    await act(async () => {
      deferred.resolve({ src: 'https://i.mopix.cc/cX4JLB.jpg' });
      await deferred.promise;
    });

    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://i.mopix.cc/cX4JLB.jpg'
    );
  });

  it('renders hover previews with resolved image positioning', async () => {
    installSuccessfulImageStub();

    await act(async () => {
      root.render(
        <HoverImagePreview
          request={createHoverImagePreviewRequest('https://imgur.com/hover-id')}
          left={10}
          top={20}
        />
      );
    });

    const image = container.querySelector('img');

    expect(image?.getAttribute('src')).toBe('https://i.imgur.com/hover-id.jpg');
    expect(image?.style.left).toBe('30px');
    expect(image?.style.top).toBe('20px');
  });

  it('keeps tall hover previews fully visible near the bottom edge', async () => {
    vi.stubGlobal('innerWidth', 1200);
    vi.stubGlobal('innerHeight', 1000);

    await act(async () => {
      root.render(
        <HoverImagePreviewContent
          left={100}
          top={900}
          value={{
            src: 'https://i.mopix.cc/cX4JLB.jpg',
            width: 1200,
            height: 1600
          }}
          error={undefined}
        />
      );
    });

    const image = container.querySelector('img');

    expect(image?.style.left).toBe('120px');
    expect(image?.style.top).toBe('180px');
  });

  it('moves hover previews left when there is no space on the right', async () => {
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 900);

    await act(async () => {
      root.render(
        <HoverImagePreviewContent
          left={950}
          top={300}
          value={{
            src: 'https://i.mopix.cc/cX4JLB.jpg',
            width: 500,
            height: 300
          }}
          error={undefined}
        />
      );
    });

    const image = container.querySelector('img');

    expect(image?.style.left).toBe('430px');
    expect(image?.style.top).toBe('150px');
  });

  it('ignores late request resolution after unmount', async () => {
    const deferred = createDeferred<{ src: string }>();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      root.render(<InlineImagePreview request={deferred.promise} />);
    });

    act(() => {
      root.unmount();
    });

    await act(async () => {
      deferred.resolve({ src: 'https://i.mopix.cc/cX4JLB.jpg' });
      await deferred.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
  });
});