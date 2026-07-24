import { RESOURCE_LIMITS } from './resource_limits';

export function setTimer(repeat, func, timelimit) {
  if(repeat) {
	  return {
		  timer: setInterval(func, timelimit),
		  cancel: function() {
			  clearInterval(this.timer);
		  }
	  };
  } else {
	  return {
		  timer: setTimeout(func, timelimit),
		  cancel: function() {
			  clearTimeout(this.timer);
		  }
	  };
  }
}

export function getQueryVariable(variable) {
	const query = globalThis.location.search.substring(1);
	const vars = query.split("&");
	for (const entry of vars) {
		const pair = entry.split("=");
		if (pair[0] === variable) {
      return decodeURIComponent(pair[1]);
    }
  }
  return null;
}

const SAFE_EXTERNAL_PROTOCOLS = ['http:', 'https:', 'ftp:', 'telnet:'];
const SAFE_IMAGE_PROTOCOLS = ['https:'];

/**
 * @typedef {{valid: true, url: string, protocol: string} | {valid: false, reason: string}} ExternalUrlResult
 */

export function validateExternalUrl(url, allowedProtocols) {
	if (typeof url !== 'string') {
		return { valid: false, reason: 'not-a-string' };
	}

	const trimmedUrl = url.trim();
	if (!trimmedUrl) {
		return { valid: false, reason: 'empty' };
	}

	if (trimmedUrl.length > RESOURCE_LIMITS.maxExternalUrlLength) {
		return { valid: false, reason: 'too-long' };
	}

	if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmedUrl)) {
		return { valid: false, reason: 'missing-scheme' };
	}

	if (/[\u0000-\u001f\u007f]/.test(trimmedUrl) || /%00/i.test(trimmedUrl)) {
		return { valid: false, reason: 'control-character' };
	}

	if (!URL.canParse(trimmedUrl)) {
		return { valid: false, reason: 'malformed' };
	}

	const parsed = new URL(trimmedUrl);
	const protocols = allowedProtocols || SAFE_EXTERNAL_PROTOCOLS;
	if (protocols.indexOf(parsed.protocol) < 0) {
		return { valid: false, reason: 'unsupported-protocol' };
	}

	if (!parsed.hostname || parsed.username || parsed.password) {
		return { valid: false, reason: 'unsafe-authority' };
	}

	return {
		valid: true,
		url: parsed.toString(),
		protocol: parsed.protocol
	};
}

export function getSafeExternalUrl(url, allowedProtocols) {
	const result = validateExternalUrl(url, allowedProtocols);
	return result.valid ? result.url : null;
}

export function getSafeImageUrl(url) {
	return getSafeExternalUrl(url, SAFE_IMAGE_PROTOCOLS);
}

export function openExternalUrl(url, allowedProtocols) {
	const safeUrl = getSafeExternalUrl(url, allowedProtocols);
	if (!safeUrl) {
		return null;
	}

	const opened = window.open(safeUrl, '_blank', 'noopener,noreferrer');
	if (opened) {
		opened.opener = null;
	}
	return opened;
}

export function createGoogleSearchUrl(searchTerm) {
	const url = new URL('https://www.google.com/search');
	url.searchParams.set('q', searchTerm == null ? '' : String(searchTerm));
	return url.toString();
}

export function escapeCssUrl(url) {
	return String(url).replace(/[\\"\n\r\f]/g, String.raw`\$&`);
}
