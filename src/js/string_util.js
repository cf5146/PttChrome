

/**
 * Only support caret notations (^C, ^H, ^U, ^[, ^?, ...)
 * If you want to show \ and ^, use \\ and \^ respectively
 */ 
export function unescapeStr(it) {
  let result = '';

  for (let i = 0; i < it.length; ++i) {
    let curChar = it.charAt(i);
    let nextChar = it.charAt(i+1);
    
    if (i == it.length - 1) {
      result += curChar;
      break;
    }

    if (curChar == '\\' && (nextChar == '\\' || nextChar == '^')) {
      result += nextChar;
    } else if (curChar == '^') {
      if ('@' <= nextChar && nextChar <= '_') {
        let code = it.codePointAt(i+1) - 64;
        result += String.fromCodePoint(code);
        i++;
      } else if (nextChar == '?') {
        result += '\x7f';
        i++;
      } else {
        result += '^';
      }
    } else {
      result += curChar;
    }
  }
  return result;
};

// Wrap text within maxLen without hyphenating English words,
// where the maxLen is generally the screen width.
export function wrapText(it, maxLen, enterChar) {
  // Divide string into non-hyphenated groups
  // classified as \r, \n, single full-width character, an English word,
  // and space characters in the beginning of original line. (indent)
  // Spaces next to a word group are merged into that group
  // to ensure the start of each wrapped line is a word.
  // FIXME: full-width punctuation marks aren't recognized
  let pattern = /\r|\n|([^\x00-\x7f][,.?!:;]?[\t ]*)|([\x00-\x08\x0b\x0c\x0e-\x1f\x21-\x7f]+[\t ]*)|[\t ]+/g;
  let splited = it.match(pattern);

  let result = '';
  let len = 0;
  for (const element of splited) {
    // Convert special characters to spaces with the same width
    // and then we can get the width by the length of the converted string
    let grouplen = element.replace(/[^\x00-\x7f]/g,"  ")
                             .replace(/\t/,"    ")
                             .replace(/\r|\n/,"")
                             .length;

    if (element == '\r' || element == '\n')
      len = 0;
    if (len + grouplen > maxLen) {
      result += enterChar;
      len = 0;
    }
    result += element;
    len += grouplen;
  }
  return result;
};

export function u2b(it) {
  let data = '';
  for (let i = 0; i < it.length; ++i) {
    if (it.charAt(i) < '\x80') {
      data += it.charAt(i);
      continue;
    }
    let pos = it.codePointAt(i);
    let hi = lib.u2bArray[2*pos], lo = lib.u2bArray[2*pos+1];
    if (hi || lo)
      data += String.fromCodePoint(hi) + String.fromCodePoint(lo);
    else // Not a big5 char
      data += '\xFF\xFD';
  }
  return data;
};

export function b2u(it) {
  let str = '';
  for (let i = 0; i < it.length; ++i) {
    if (it.charAt(i) < '\x80' || i == it.length-1) {
      str += it.charAt(i);
      continue;
    }

    let pos = it.codePointAt(i) << 8 | it.codePointAt(i+1);
    let code = lib.b2uArray[2*pos] << 8 | lib.b2uArray[2*pos+1];
    if (code) {
      str += String.fromCodePoint(code);
      ++i;
    } else { // Not a big5 char
      str += it.charAt(i);
    }
  }
  return str;
};

export function isDBCSLead(ch) {
  let code = ch.codePointAt(0);
  return code >= 0x81 && code <= 0xfe;
};

export function parseReplyText(it) {
  return (it.indexOf('▲ 回應至 (F)看板 (M)作者信箱 (B)二者皆是 (Q)取消？[F] ') === 0 ||
      it.indexOf('▲ 無法回應至看板。 改回應至 (M)作者信箱 (Q)取消？[Q]') === 0 ||
      it.indexOf('把這篇文章收入到暫存檔？[y/N]') === 0 ||
      it.indexOf('請選擇暫存檔 (0-9)[0]:') === 0);
};

export function parsePushInitText(it) {
  return (it.indexOf('您覺得這篇文章 ') === 0 || 
      it.search(/→ \w+ *: +/) === 0 ||
      it.indexOf('很抱歉, 本板不開放回覆文章，要改回信給作者嗎？ [y/N]:') === 0);
};

export function parseReqNotMetText(it) {
  return (it.indexOf(' ◆ 未達看板發文限制:') === 0);
};

export function parseStatusRow(str) {
  let regex = new RegExp(/  瀏覽 第 (\d{1,3})(?:\/(\d{1,3}))? 頁 *\( *(\d{1,3})%\)  目前顯示: 第 0*(\d+)~0*(\d+) 行 *(?:\(y\)回應)?(?:\(X\/?%\)推文)?(?:\(h\)說明)? *\(←\/?q?\)離開 /g);
  let result = regex.exec(str);

  if (result && result.length === 6) {
    return {
      pageIndex:     Number.parseInt(result[1]),
      pageTotal:     Number.parseInt(result[2]),
      pagePercent:   Number.parseInt(result[3]),
      rowIndexStart: Number.parseInt(result[4]),
      rowIndexEnd:   Number.parseInt(result[5])
    };
  }

  return null;
};

export function parseListRow(str) {
  let regex = new RegExp(/\[\d{1,2}\/\d{1,2} +星期. +\d{1,2}:\d{1,2}\] .+ 線上\d+人, 我是\w+ +\[呼叫器\](?:關閉|打開) /g);
  return regex.test(str);
};

export function parseWaterball(str) {
  let regex = new RegExp(/\x1b\[1;33;46m\u2605(\w+)\x1b\[0;1;37;45m (.+) \x1b\[m\x1b\[K/g);
  let result = regex.exec(str);
  if (result?.length == 3) {
    return { userId: result[1], message: result[2] };
  } else {
    regex = new RegExp(/\x1b\[24;\d{2}H\x1b\[1;37;45m([^\x1b]+)(?:\x1b\[24;18H)?\x1b\[m/g);
    result = regex.exec(str);
    if (result?.length == 2) {
      return { message: result[1] };
    }
  }

  return null;
};

export function ansiHalfColorConv(it) {
  let str = '';
  let regex = new RegExp('\x15\\[(([0-9]+)?;)+50m', 'g');
  let result = null;
  let indices = [];
  while ((result = regex.exec(it))) {
    indices.push(result.index + result[0].length - 4);
  }

  if (indices.length === 0) {
    return it;
  }

  let curInd = 0;
  for (const element of indices) {
    let ind = element;
    let preEscInd = it.substring(curInd, ind).lastIndexOf('\x15') + curInd;
    str += it.substring(curInd, preEscInd) + '\x00' + it.substring(ind+4, ind+5) + it.substring(preEscInd, ind) + 'm';
    curInd = ind+5;
  }
  str += it.substring(curInd);
  return str;
};
