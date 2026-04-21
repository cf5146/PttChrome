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

export function getSafeExternalUrl(url, allowedProtocols) {
	if (typeof url !== 'string') {
		return null;
	}

	const trimmedUrl = url.trim();
	if (!trimmedUrl || !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmedUrl)) {
		return null;
	}

	if (!URL.canParse(trimmedUrl)) {
		return null;
	}

	const parsed = new URL(trimmedUrl);
	const protocols = allowedProtocols || SAFE_EXTERNAL_PROTOCOLS;
	if (protocols.indexOf(parsed.protocol) < 0) {
		return null;
	}
	return parsed.toString();
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
