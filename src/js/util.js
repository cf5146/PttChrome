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
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
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

	var trimmedUrl = url.trim();
	if (!trimmedUrl || !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmedUrl)) {
		return null;
	}

	try {
		var parsed = new URL(trimmedUrl);
		var protocols = allowedProtocols || SAFE_EXTERNAL_PROTOCOLS;
		if (protocols.indexOf(parsed.protocol) < 0) {
			return null;
		}
		return parsed.toString();
	} catch (e) {
		return null;
	}
}

export function openExternalUrl(url, allowedProtocols) {
	var safeUrl = getSafeExternalUrl(url, allowedProtocols);
	if (!safeUrl) {
		return null;
	}

	var opened = window.open(safeUrl, '_blank', 'noopener,noreferrer');
	if (opened) {
		opened.opener = null;
	}
	return opened;
}

export function createGoogleSearchUrl(searchTerm) {
	var url = new URL('https://www.google.com/search');
	url.searchParams.set('q', searchTerm == null ? '' : String(searchTerm));
	return url.toString();
}

export function escapeCssUrl(url) {
	return String(url).replace(/[\\"\n\r\f]/g, '\\$&');
}
