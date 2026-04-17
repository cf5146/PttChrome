import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createHoverImagePreviewRequest,
  createInlineImagePreviewRequest,
  resolveSrcToImageUrl
} from './ImagePreviewer';

describe('ImagePreviewer helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rewrites imgur page URLs to direct image URLs', async () => {
    await expect(
      createInlineImagePreviewRequest('https://imgur.com/abc123')
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

  it('resolves hover previews with measured image height', async () => {
    class FakeImage {
      height = 480;

      onload = null;

      onerror = null;

      set src(_value) {
        if (this.onload) {
          this.onload();
        }
      }
    }

    vi.stubGlobal('Image', FakeImage);

    await expect(
      createHoverImagePreviewRequest('https://imgur.com/hover-id')
    ).resolves.toEqual({
      src: 'https://i.imgur.com/hover-id.jpg',
      height: 480
    });
  });

  it('rejects URLs without a matching resolver', async () => {
    await expect(
      resolveSrcToImageUrl({ src: 'https://example.com/not-supported' })
    ).rejects.toThrow('Unimplemented');
  });
});