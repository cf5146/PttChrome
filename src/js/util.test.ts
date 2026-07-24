import { describe, expect, it } from 'vitest';

import {
	getSafeExternalUrl,
	getSafeImageUrl,
	validateExternalUrl
} from './util';

describe('external URL policy', () => {
	it('returns a typed valid result for a safe URL', () => {
		expect(validateExternalUrl('https://example.com/path?x=1')).toEqual({
			valid: true,
			url: 'https://example.com/path?x=1',
			protocol: 'https:'
		});
	});

	it('preserves the compatibility string API for safe URLs', () => {
		expect(getSafeExternalUrl('https://example.com/path')).toBe(
			'https://example.com/path'
		);
	});

	it.each([
		'javascript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'file:///etc/passwd',
		'//evil.example/image.png',
		'https://safe.example@evil.example/image.jpg',
		'https://example.com/image.jpg%00.html',
		'https://example.com/has\ncontrol'
	])('rejects unsafe URL input: %s', url => {
		expect(validateExternalUrl(url).valid).toBe(false);
		expect(getSafeExternalUrl(url)).toBeNull();
	});

	it('requires HTTPS for image URLs', () => {
		expect(getSafeImageUrl('http://example.com/image.jpg')).toBeNull();
		expect(getSafeImageUrl('https://example.com/image.jpg')).toBe(
			'https://example.com/image.jpg'
		);
	});

	it('rejects URLs with credentials and overlong URLs', () => {
		expect(getSafeExternalUrl('https://user:pass@example.com/image.jpg')).toBeNull();
		expect(getSafeExternalUrl(`https://example.com/${'a'.repeat(4096)}`)).toBeNull();
	});
});