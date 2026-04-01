// Main Program
import BaseModal from 'react-overlays/lib/Modal';
import { Fade, Modal } from "react-bootstrap";
import { AnsiParser } from './ansi_parser';
import { TermView } from './term_view';
import { TermBuf } from './term_buf';
import { TelnetConnection } from './telnet';
import { Websocket } from './websocket';
import { EasyReading } from './easy_reading';
import { TouchController } from './touch_controller';
import { unescapeStr, b2u, parseWaterball } from './string_util';
import { setTimer } from './util';
import PasteShortcutAlert from '../components/PasteShortcutAlert';
import ConnectionAlert from '../components/ConnectionAlert';
import ContextMenu from '../components/ContextMenu';

function noop() {}

const ANTI_IDLE_STR = '\x1b\x1b';
const MOUSE_CURSOR_COMMANDS = {
  0: '\x1b[D',
  1: '\x1b[D',
  2: '\x1b[5~',
  3: '\x1b[6~',
  4: '\x1b[1~',
  5: '\x1b[4~',
  8: '[',
  9: ']',
  10: '=',
  12: '\x1b[D\r\x1b[4~',
  13: '\x1b[D\r\x1b[4~[]',
  14: '\x1b[D\x1b[4~[]\r',
};
const MOUSE_WHEEL_ACTIONS = {
  up: ['none', 'doArrowUp', 'doPageUp', 'previousThread'],
  down: ['none', 'doArrowDown', 'doPageDown', 'nextThread'],
};

export const App = function() {

  this.CmdHandler = document.getElementById('cmdHandler');
  this.CmdHandler.setAttribute('useMouseBrowsing', '1');
  this.CmdHandler.setAttribute('doDOMMouseScroll','0');
  this.CmdHandler.setAttribute('SkipMouseClick','0');

  this.view = new TermView();
  this.buf = new TermBuf(80, 24);
  this.buf.setView(this.view);
  this.view.setBuf(this.buf);
  this.view.setCore(this);
  this.parser = new AnsiParser(this.buf);
  this.easyReading = new EasyReading(this, this.view, this.buf);

  //new pref - start
  this.antiIdleTime = 0;
  this.idleTime = 0;
  //new pref - end

  // for picPreview
  this.curX = 0;
  this.curY = 0;

  this.inputArea = document.getElementById('t');
  this.BBSWin = document.getElementById('BBSWindow');

  // horizontally center bbs window
  this.BBSWin.setAttribute("align", "center");
  this.view.mainDisplay.style.transformOrigin = 'center';

  this.mouseLeftButtonDown = false;
  this.mouseRightButtonDown = false;

  this.inputAreaFocusTimer = null;
  this.modalShown = false;

  this.lastSelection = null;

  this.waterball = { userId: '', message: '' };
  this.appFocused = true;

  this.endTurnsOnLiveUpdate = false;
  this.copyOnSelect = false;
  const version = globalThis.navigator.userAgent.match(/Chrom(e|ium)\/(\d+)\./);
  if (version && version.length > 2) {
    this.chromeVersion = Number.parseInt(version[2], 10);
  }

  globalThis.addEventListener('click', (e) => {
    this.mouse_click(e);
  }, false);

  globalThis.addEventListener('mousedown', (e) => {
    this.mouse_down(e);
  }, false);

  $(globalThis).mousedown((e) => {
    const ret = this.middleMouse_down(e);
    if (ret === false) {
      return false;
    }
  });

  globalThis.addEventListener('mouseup', (e) => {
    this.mouse_up(e);
  }, false);

  document.addEventListener('mousemove', (e) => {
    this.mouse_move(e);
  }, false);

  document.addEventListener('mouseover', (e) => {
    this.mouse_over(e);
  }, false);

  if ('onwheel' in globalThis) {
    globalThis.addEventListener('wheel', (e) => {
      this.mouse_scroll(e);
    }, true);
  } else {
    globalThis.addEventListener('mousewheel', (e) => {
      this.mouse_scroll(e);
    }, true);
  }

  globalThis.addEventListener('focus', () => {
    this.appFocused = true;
    if (this.view.titleTimer) {
      this.view.titleTimer.cancel();
      this.view.titleTimer = null;
      document.title = this.connectedUrl.site;
      this.view.notif.close();
    }
  }, false);

  globalThis.addEventListener('blur', () => {
    this.appFocused = false;
  }, false);

  this.strToCopy = null;
  document.addEventListener('copy', (e) => {
    this.onDOMCopy(e);
  });
  this.inputArea.addEventListener('paste', (e) => {
    this.onDOMPaste(e);
  });

  this.view.innerBounds = this.getWindowInnerBounds();
  this.view.firstGridOffset = this.getFirstGridOffsets();
  globalThis.addEventListener('resize', () => {
    this.onWindowResize();
  });

  globalThis.addEventListener('beforeunload', (e) => {
    if (this.conn?.isConnected && this.buf.pageState !== 0) {
      e.preventDefault();
    }
  });

  this.dblclickTimer = null;
  this.mbTimer = null;
  this.timerEverySec = null;
  this.pushthreadAutoUpdateCount = 0;
  this.maxPushthreadAutoUpdateCount = -1;
  this.onWindowResize();
  this.setupContextMenus();
  this.contextMenuShown = false;

  // init touch only if chrome is higher than version 36
  if (this.chromeVersion && this.chromeVersion >= 37) {
    this.touch = new TouchController(this);
  }
};

App.prototype.isConnected = function() {
  return this.connectState === 1 && !!this.conn;
};

App.prototype.connect = function(url) {
  this.connectState = 0;
  console.log('connect: ' + url);

  const parsed = this._parseURLSimple(url);
  if (!parsed) {
    console.log('invalid connect url: ' + url);
    return;
  }

  if (parsed.protocol === 'wsstelnet') {
    this._setupWebsocketConn('wss://' + parsed.hostname + parsed.path);
  } else if (parsed.protocol === 'wstelnet') {
    this._setupWebsocketConn('ws://' + parsed.hostname + parsed.path);
  } else {
    console.log('unsupport connect url protocol: ' + parsed.protocol);
    return;
  }

  this.connectedUrl = {
    url: url,
    site: parsed.hostname,
    port: parsed.port,
    easyReadingSupported: true
  };
};

App.prototype._parseURLSimple = function(url) {
  const protocol = url.split(/:\/\//, 2);
  if (protocol.length !== 2)
    return null;
  const hostname = protocol[1].split(/\//, 2);
  const hostport = hostname[0].split(/:/);
  if (hostport.length > 2)
    return null;
  const port = hostport.length > 1 ? Number.parseInt(hostport[1], 10) : {
    'wstelnet': 80,
    'wsstelnet': 443,
    'telnet': 23,
    'ssh': 22
  }[protocol[0]];
  return {
    protocol: protocol[0],
    hostname: hostname[0],
    host: hostport[0],
    port: port,
    path: '/' + (hostname.length > 1 ? hostname[1] : '')
  };
};

App.prototype._setupWebsocketConn = function(url) {
  const wsConn = new Websocket(url);
  this._attachConn(new TelnetConnection(wsConn));
};

App.prototype._attachConn = function(conn) {
  this.conn = conn;
  this.conn.addEventListener('open', this.onConnect.bind(this));
  this.conn.addEventListener('close', this.onClose.bind(this));
  this.conn.addEventListener('data', (e) => {
    this.onData(e.detail.data);
  });
  this.conn.addEventListener('doNaws', () => {
    conn.sendWillNaws();
    conn.sendNaws(this.buf.cols, this.buf.rows);
  });
};

App.prototype.onConnect = function() {
  this.conn.isConnected = true;
  this.view.setConn(this.conn);
  console.info("pttchrome onConnect");
  this.connectState = 1;
  this.updateTabIcon('connect');
  this.idleTime = 0;
  this.timerEverySec = setTimer(true, () => {
    this.antiIdle();
    this.view.onBlink();
    this.incrementCountToUpdatePushthread();
  }, 1000);
};

App.prototype.onData = function(data) {
  this.parser.feed(data);

  if (!this.appFocused && this.view.enableNotifications) {
    // parse received data for waterball
    const wb = parseWaterball(b2u(data));
    if (wb) {
      if ('userId' in wb) {
        this.waterball.userId = wb.userId;
      }
      if ('message' in wb) {
        this.waterball.message = wb.message;
      }
      this.view.showWaterballNotification();
    }
  }
};

App.prototype.onClose = function() {
  console.info("pttchrome onClose");
  if (this.timerEverySec) {
    this.timerEverySec.cancel();
  }
  this.conn.isConnected = false;

  this.cancelMbTimer();

  this.connectState = 2;
  this.idleTime = 0;

  const onDismiss = () => {
    ReactDOM.unmountComponentAtNode(container);
    this.connect(this.connectedUrl.url);
  }
  const container = document.getElementById('reactAlert');
  ReactDOM.render(
    <ConnectionAlert onDismiss={onDismiss} />,
    container
  );
  this.updateTabIcon('disconnect');
};

App.prototype.sendData = function(str) {
  if (this.connectState === 1)
    this.conn.convSend(str);
};

App.prototype.cancelMbTimer = function() {
  if (this.mbTimer) {
    this.mbTimer.cancel();
    this.mbTimer = null;
  }
};

App.prototype.setMbTimer = function() {
  this.cancelMbTimer();
  this.mbTimer = setTimer(false, () => {
    this.mbTimer.cancel();
    this.mbTimer = null;
    this.CmdHandler.setAttribute('SkipMouseClick', '0');
  }, 100);
};

App.prototype.cancelDblclickTimer = function() {
  if (this.dblclickTimer) {
    this.dblclickTimer.cancel();
    this.dblclickTimer = null;
  }
};

App.prototype.setDblclickTimer = function() {
  this.cancelDblclickTimer();
  this.dblclickTimer = setTimer(false, () => {
    this.dblclickTimer.cancel();
    this.dblclickTimer = null;
  }, 350);
};

App.prototype.setInputAreaFocus = function() {
  if (this.modalShown || this.touch?.touchStarted)
    return;
  this.inputArea.focus();
};

// These hooks are injected by the context menu enhancer when enabled.
App.prototype.onToggleLiveHelperModalState = noop;
// These hooks are injected by the context menu enhancer when enabled.
App.prototype.onDisableLiveHelperModalState = noop;

App.prototype.switchToEasyReadingMode = function(doSwitch) {
  this.easyReading.leaveCurrentPost();
  if (doSwitch) {
    this.onDisableLiveHelperModalState();
    // clear the deep cloned copy of lines
    this.buf.pageLines = [];
    if (this.buf.pageState === 3) {
      this.view.conn.send('\x1b[D\x1b[C');
    }
  } else {
    this.view.mainContainer.style.paddingBottom = '';
    this.view.lastRowIndex = 22;
    this.view.lastRowDiv.style.display = '';
    this.view.replyRowDiv.style.display = '';
    // clear the deep cloned copy of lines
    this.buf.pageLines = [];
  }
  // request the full screen
  this.view.conn.send(unescapeStr('^L'));
};

App.prototype.doCopy = function(str) {
  if (str.indexOf('\x1b') < 0) {
    str = str.replaceAll('\r\n', '\r');
    str = str.replaceAll('\n', '\r');
    str = str.replaceAll(/ +\r/g, '\r');
  }

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(str).catch(() => {
      console.warn('Clipboard write failed.');
    });
    return;
  }

  this.strToCopy = str;
};

App.prototype.doCopyAnsi = function() {
  if (!this.lastSelection)
    return;

  const selection = this.lastSelection;
  let pageLines = null;
  if (this.view.useEasyReadingMode && this.buf.pageState === 3) {
    pageLines = this.buf.pageLines;
  }

  let ansiText = '';
  if (selection.start.row === selection.end.row) {
    ansiText += this.buf.getText(selection.start.row, selection.start.col, selection.end.col, true, true, false, pageLines);
  } else {
    for (let i = selection.start.row; i <= selection.end.row; ++i) {
      let scol = 0;
      let ecol = this.buf.cols - 1;
      if (i === selection.start.row) {
        scol = selection.start.col;
      } else if (i === selection.end.row) {
        ecol = selection.end.col;
      }
      ansiText += this.buf.getText(i, scol, ecol, true, true, false, pageLines);
      if (i !== selection.end.row) {
        ansiText += '\r';
      }
    }
  }

  this.doCopy(ansiText);
};

App.prototype.onDOMCopy = function(e) {
  if (this.strToCopy) {
    e.clipboardData.setData('text', this.strToCopy);
    e.preventDefault();
    console.log('copied: ', this.strToCopy);
    this.strToCopy = null;
  }
};

App.prototype.doPaste = function() {
  if (navigator.clipboard?.readText) {
    navigator.clipboard.readText().then(
      (text) => this.onPasteDone(text),
      () => this.showPasteUnimplemented());
  } else {
    this.showPasteUnimplemented();
  }
};

App.prototype.showPasteUnimplemented = function() {
  const container = document.getElementById('reactAlert')
  const onDismiss = () => {
    ReactDOM.unmountComponentAtNode(container)
    this.modalShown = false;
  }
  ReactDOM.render(
    <BaseModal
      show
      onExited={onDismiss}
      backdropClassName="modal-backdrop"
      containerClassName="modal-open"
      transition={Fade}
      dialogTransitionTimeout={Modal.TRANSITION_DURATION}
      backdropTransitionTimeout={Modal.BACKDROP_TRANSITION_DURATION}
    >
      <PasteShortcutAlert onDismiss={onDismiss} />
    </BaseModal>,
    container
  )
  this.modalShown = true;
};

App.prototype.onPasteDone = function(content) {
  this.view.onTextInput(content, true);
};

App.prototype.onDOMPaste = function(e) {
  let str = e.clipboardData.getData('text');
  if (str) {
    e.preventDefault();
    this.onPasteDone(str);
  }
};

App.prototype.onSymFont = function(content) {
  console.log("using " + (content ? "extension" : "system") + " font");
  const fontSrc = content ? 'src: url(' + content.data + ');' : '';
  const css = '@font-face { font-family: MingLiUNoGlyph; ' + fontSrc + ' }';
  const style = document.createElement('style');
  style.innerHTML = css;
  document.getElementsByTagName('head')[0].appendChild(style);
};

App.prototype.doSelectAll = function() {
  globalThis.getSelection().selectAllChildren(this.view.mainDisplay);
};

App.prototype.doSearchGoogle = function(searchTerm) {
  globalThis.open('https://google.com/search?q=' + encodeURIComponent(searchTerm));
};

App.prototype.doOpenUrlNewTab = function(a) {
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: globalThis,
    ctrlKey: true,
  });
  a.dispatchEvent(clickEvent);
};

App.prototype.incrementCountToUpdatePushthread = function(interval) {
  if (this.maxPushthreadAutoUpdateCount === -1) {
    this.pushthreadAutoUpdateCount = 0;
    return;
  }

  if (++this.pushthreadAutoUpdateCount >= this.maxPushthreadAutoUpdateCount) {
    this.pushthreadAutoUpdateCount = 0;
    if (this.buf.pageState === 3 || this.buf.pageState === 2) {
      this.view.conn.send('\x1b[D\x1b[C\x1b[4~');
    }
  }
};
App.prototype.setAutoPushthreadUpdate = function(seconds) {
  this.maxPushthreadAutoUpdateCount = seconds;
};

App.prototype.onWindowResize = function() {
  this.view.innerBounds = this.getWindowInnerBounds();

  if (this.resizeTimeout) {
    clearTimeout(this.resizeTimeout);
  }
  if (this.resizer) {
    this.resizeTimeout = setTimeout(() => {
      this.resizeTimeout = null;
      if (this.resizer) {
        this.resizer();
      }
    }, 500);
  } else {
    this.view.fontResize();
  }
};

App.prototype.setTermSize = function(cols, rows) {
  if (this.buf.cols === cols && this.buf.rows === rows) {
    return;
  }

  this.buf.resize(cols, rows);
  if (this.conn) {
    this.conn.sendNaws(cols, rows);
  }
};

App.prototype.switchMouseBrowsing = function() {
  if (this.CmdHandler.getAttribute('useMouseBrowsing') == '1') {
    this.CmdHandler.setAttribute('useMouseBrowsing', '0');
    this.buf.useMouseBrowsing = false;
  } else {
    this.CmdHandler.setAttribute('useMouseBrowsing', '1');
    this.buf.useMouseBrowsing = true;
  }

  if (this.buf.useMouseBrowsing) {
    this.buf.resetMousePos();
    this.view.redraw(true);
    this.view.updateCursorPos();
    return;
  }

  this.buf.BBSWin.style.cursor = 'auto';
  this.buf.clearHighlight();
  this.buf.mouseCursor = 0;
  this.buf.nowHighlight = -1;
  this.buf.tempMouseCol = 0;
  this.buf.tempMouseRow = 0;
};

App.prototype.antiIdle = function() {
  if (this.antiIdleTime && this.idleTime > this.antiIdleTime) {
    if (this.connectState === 1) {
      this.conn.send(ANTI_IDLE_STR);
      this.idleTime = 0;
    }
    return;
  }

  if (this.connectState === 1) {
    this.idleTime += 1000;
  }
};

App.prototype.updateTabIcon = function(aStatus) {
  let icon = require('../icon/logo.png');
  switch (aStatus) {
    case 'connect':
      icon = require('../icon/logo_connect.png');
      this.setInputAreaFocus();
      break;
    case 'disconnect':
      icon = require('../icon/logo_disconnect.png');
      break;
    default:
      break;
  }

  let link = document.querySelector("link[rel~='icon']");
  if (link) {
    link.setAttribute("href", icon);
    return;
  }

  link = document.createElement("link");
  link.setAttribute("rel", "icon");
  link.setAttribute("href", icon);
  document.head.appendChild(link);
};

// use this method to get better window size in case of page zoom != 100%
App.prototype.getWindowInnerBounds = function() {
  const width = document.documentElement.clientWidth - this.view.bbsViewMargin * 2;
  const height = document.documentElement.clientHeight - this.view.bbsViewMargin * 2;
  const bounds = {
    width: width,
    height: height
  };
  return bounds;
};

App.prototype.getFirstGridOffsets = function() {
  const container = $(".main")[0];
  return {
    top: container.offsetTop,
    left: container.offsetLeft
  };
};

App.prototype.clientToPos = function(cX, cY) {
  let x;
  let y;
  const w = this.view.innerBounds.width;
  const h = this.view.innerBounds.height;
  if (this.view.scaleX !== 1 || this.view.scaleY !== 1) {
    x = cX - ((w - (this.view.chw * this.buf.cols) * this.view.scaleX) / 2);
    y = cY - ((h - (this.view.chh * this.buf.rows) * this.view.scaleY) / 2);
  } else {
    x = cX - Number.parseFloat(this.view.firstGridOffset.left);
    y = cY - Number.parseFloat(this.view.firstGridOffset.top);
  }
  let col = Math.floor(x / (this.view.chw * this.view.scaleX));
  let row = Math.floor(y / (this.view.chh * this.view.scaleY));

  if (row < 0)
    row = 0;
  else if (row >= this.buf.rows - 1)
    row = this.buf.rows - 1;

  if (col < 0)
    col = 0;
  else if (col >= this.buf.cols - 1)
    col = this.buf.cols - 1;

  return { col: col, row: row };
};

App.prototype._buildRowMoveCommand = function(targetRow) {
  const direction = this.buf.cur_y > targetRow ? '\x1b[A' : '\x1b[B';
  const count = Math.abs(this.buf.cur_y - targetRow);
  return direction.repeat(count) + '\r';
};

App.prototype._getMouseCursorCommand = function(cursor, cX, cY) {
  if (cursor === 6) {
    if (this.buf.nowHighlight === -1) {
      return '';
    }

    return this._buildRowMoveCommand(this.buf.nowHighlight);
  }

  if (cursor === 7) {
    const pos = this.clientToPos(cX, cY);
    return this._buildRowMoveCommand(pos.row);
  }

  return MOUSE_CURSOR_COMMANDS[cursor] || '';
};

App.prototype.onMouse_click = function(e) {
  const { clientX: cX, clientY: cY } = e;
  if (!this.conn?.isConnected)
    return;

  // disable auto update pushthread if any command is issued;
  this.onDisableLiveHelperModalState();

  this.easyReading._onMouseClick(e);
  if (e.defaultPrevented)
    return;

  const command = this._getMouseCursorCommand(this.buf.mouseCursor, cX, cY);
  if (command) {
    this.conn.send(command);
  }
};

App.prototype.onMouse_move = function(cX, cY) {
  const pos = this.clientToPos(cX, cY);
  this.buf.onMouse_move(pos.col, pos.row, false);
};

App.prototype.resetMouseCursor = function(cX, cY) {
  this.buf.BBSWin.style.cursor = 'auto';
  this.buf.mouseCursor = 11;
};

App.prototype.onValuesPrefChange = function(values) {
  Object.keys(values).forEach((name) => {
    this.onPrefChange(name, values[name]);
  });

  // These prefs have to be processed as a whole.
  try {
    this.resizer = null;

    switch (values.termSizeMode) {
      case 'fixed-term-size': {
        this.view.fontFitWindowWidth = values.fontFitWindowWidth;

        const size = values.termSize;
        this.setTermSize(size.cols, size.rows);
        this.view.fontResize();
        this.view.redraw(true);
        break;
      }

      case 'fixed-font-size': {
        this.view.fontFitWindowWidth = false;

        const fontSize = values.fontSize;
        this.resizer = () => {
          const size = this.view.calcTermSizeFromFont(fontSize);
          this.setTermSize(size.cols, size.rows);
          this.view.fixedResize(fontSize);
          this.view.redraw(true);
        };
        // Immediately recalc once.
        this.resizer();
        break;
      }
    }

    if (this.view.fontFitWindowWidth) {
      $('.main').addClass('trans-fix');
    } else {
      $('.main').removeClass('trans-fix');
    }
  } catch (error) {
    console.error('Failed to apply preference values.', error);
  }
};

App.prototype.onPrefChange = function(name, value) {
  try {
    switch (name) {
    case 'useMouseBrowsing':
      this.CmdHandler.setAttribute('useMouseBrowsing', value ? '1' : '0');
      this.buf.useMouseBrowsing = value;

      if (this.buf.useMouseBrowsing) {
        this.buf.resetMousePos();
        this.view.redraw(true);
        this.view.updateCursorPos();
        break;
      }

      this.buf.BBSWin.style.cursor = 'auto';
      this.buf.clearHighlight();
      this.buf.mouseCursor = 0;
      this.buf.nowHighlight = -1;
      this.buf.tempMouseCol = 0;
      this.buf.tempMouseRow = 0;
      this.buf.resetMousePos();
      this.view.redraw(true);
      this.view.updateCursorPos();
      break;
    case 'mouseBrowsingHighlight':
      this.buf.highlightCursor = value;
      this.view.redraw(true);
      this.view.updateCursorPos();
      break;
    case 'mouseBrowsingHighlightColor':
      this.view.highlightBG = value;
      this.view.redraw(true);
      this.view.updateCursorPos();
      break;
    case 'mouseLeftFunction':
      this.view.leftButtonFunction = value;
      if (typeof this.view.leftButtonFunction === 'boolean') {
        this.view.leftButtonFunction = this.view.leftButtonFunction ? 1:0;
      }
      break;
    case 'mouseMiddleFunction':
      this.view.middleButtonFunction = value;
      break;
    case 'mouseWheelFunction1':
      this.view.mouseWheelFunction1 = value;
      break;
    case 'mouseWheelFunction2':
      this.view.mouseWheelFunction2 = value;
      break;
    case 'mouseWheelFunction3':
      this.view.mouseWheelFunction3 = value;
      break;
    case 'copyOnSelect':
      this.copyOnSelect = value;
      break;
    case 'endTurnsOnLiveUpdate':
      this.endTurnsOnLiveUpdate = value;
      break;
    case 'enablePicPreview':
      this.view.enablePicPreview = value;
      break;
    case 'enableNotifications':
      this.view.enableNotifications = value;
      break;
    case 'enableEasyReading':
      break;
    case 'antiIdleTime':
      this.antiIdleTime = value * 1000;
      break;
    case 'dbcsDetect':
      this.view.dbcsDetect = value;
      break;
    case 'lineWrap':
      if (this.conn) {
        this.conn.lineWrap = value;
      }
      break;
    case 'fontFace': {
      const fontFace = value || 'monospace';
      this.view.setFontFace(fontFace);
      break;
    }
    case 'bbsMargin':
      this.view.bbsViewMargin = value;
      this.onWindowResize();
      break;
    default:
      break;
    }
  } catch (error) {
    console.error('Failed to apply preference change.', name, error);
  }
};

App.prototype.checkClass = function(cn) {
  return (  cn.indexOf("closeSI") >= 0  || cn.indexOf("EPbtn") >= 0 || 
      cn.indexOf("closePP") >= 0 || cn.indexOf("picturePreview") >= 0 || 
      cn.indexOf("drag") >= 0    || cn.indexOf("floatWindowClientArea") >= 0 || 
      cn.indexOf("WinBtn") >= 0  || cn.indexOf("sBtn") >= 0 || 
      cn.indexOf("nonspan") >= 0 || cn.indexOf("nomouse_command") >= 0);
};

App.prototype._hasCollapsedSelection = function() {
  return globalThis.getSelection().isCollapsed;
};

App.prototype._isIgnoredMouseTarget = function(target) {
  if (target.className && this.checkClass(target.className)) {
    return true;
  }

  return !!(target.tagName && target.tagName.indexOf('menuitem') >= 0);
};

App.prototype._handleConfiguredLeftClick = function(e) {
  const leftButtonFunction = Number(this.view.leftButtonFunction);
  if (leftButtonFunction === 1) {
    this.setBBSCmd('doEnter');
    e.preventDefault();
    this.setInputAreaFocus();
    return;
  }

  if (leftButtonFunction === 2) {
    this.setBBSCmd('doRight');
    e.preventDefault();
    this.setInputAreaFocus();
  }
};

App.prototype._handleMouseBrowsingClick = function(e, skipMouseClick) {
  let shouldSendMouseCommand = !this._isIgnoredMouseTarget(e.target);
  if (skipMouseClick) {
    shouldSendMouseCommand = false;
    const pos = this.clientToPos(e.clientX, e.clientY);
    this.buf.onMouse_move(pos.col, pos.row, true);
  }

  if (!shouldSendMouseCommand) {
    return;
  }

  this.onMouse_click(e);
  this.setDblclickTimer();
  e.preventDefault();
  this.setInputAreaFocus();
};

App.prototype.mouse_click = function(e) {
  if (this.modalShown)
    return;
  const skipMouseClick = this.CmdHandler.getAttribute('SkipMouseClick') === '1';
  this.CmdHandler.setAttribute('SkipMouseClick', '0');

  if (e.button !== 0) {
    return;
  }

  if ($(e.target).is('a') || $(e.target).parent().is('a')) {
    return;
  }

  if (!this._hasCollapsedSelection()) {
    return;
  }

  if (this.buf.useMouseBrowsing) {
    this._handleMouseBrowsingClick(e, skipMouseClick);
    return;
  }

  if (this.view.leftButtonFunction) {
    this._handleConfiguredLeftClick(e);
  }
};

App.prototype.middleMouse_down = function(e) {
  // moved to here because middle click works better with jquery
  if (e.button !== 1) {
    return;
  }

  if ($(e.target).is('a') || $(e.target).parent().is('a')) {
    return;
  }

  if (this.view.middleButtonFunction === 1) {
    this.conn.send('\r');
    return false;
  }

  if (this.view.middleButtonFunction === 2) {
    this.conn.send('\x1b[D');
    return false;
  }

  if (this.view.middleButtonFunction === 3) {
    this.doPaste();
    return false;
  }
};

App.prototype._handleLeftMouseDown = function(e) {
  if (this.buf.useMouseBrowsing && this.dblclickTimer) {
    e.preventDefault();
    e.stopPropagation();
    e.cancelBubble = true;
  }

  if (this.buf.useMouseBrowsing) {
    this.setDblclickTimer();
  }

  this.mouseLeftButtonDown = true;
  if (!this._hasCollapsedSelection()) {
    this.CmdHandler.setAttribute('SkipMouseClick', '1');
  }
};

App.prototype.mouse_down = function(e) {
  if (this.modalShown)
    return;

  if (e.button === 0) {
    this._handleLeftMouseDown(e);
    return;
  }

  if (e.button === 2) {
    this.mouseRightButtonDown = true;
  }
};

App.prototype._getSelectionText = function() {
  return globalThis.getSelection().toString().replaceAll('\u00a0', ' ');
};

App.prototype._handlePointerButtonUp = function(e) {
  if (!this._hasCollapsedSelection()) {
    if (this.copyOnSelect) {
      this.doCopy(this._getSelectionText());
    }
    return;
  }

  if (this.buf.useMouseBrowsing) {
    this.onMouse_move(e.clientX, e.clientY);
  }

  this.setInputAreaFocus();
  if (e.button === 0 && !this._isIgnoredMouseTarget(e.target)) {
    e.preventDefault();
  }
};

App.prototype._scheduleInputAreaFocus = function() {
  this.inputAreaFocusTimer = setTimer(false, () => {
    clearTimeout(this.inputAreaFocusTimer);
    this.inputAreaFocusTimer = null;
    if (this._hasCollapsedSelection()) {
      this.setInputAreaFocus();
    }
  }, 10);
};

App.prototype.mouse_up = function(e) {
  if (this.modalShown)
    return;

  if (e.button === 0) {
    this.setMbTimer();
    this.mouseLeftButtonDown = false;
  } else if (e.button === 2) {
    this.mouseRightButtonDown = false;
  }

  if (e.button === 0 || e.button === 2) {
    this._handlePointerButtonUp(e);
  } else {
    this.setInputAreaFocus();
    e.preventDefault();
  }

  this._scheduleInputAreaFocus();
};

App.prototype.mouse_move = function(e) {
  if (!this.buf.useMouseBrowsing) {
    return;
  }

  if (!this._hasCollapsedSelection()) {
    this.resetMouseCursor();
    return;
  }

  if (!this.mouseLeftButtonDown) {
    this.onMouse_move(e.clientX, e.clientY);
  }
};

App.prototype.mouse_over = function(e) {
  if (this.modalShown)
    return;

  this.curX = e.clientX;
  this.curY = e.clientY;

  if (this._hasCollapsedSelection() && !this.mouseLeftButtonDown)
    this.setInputAreaFocus();
};

App.prototype._getMouseWheelAction = function(isScrollingUp) {
  const actions = isScrollingUp ? MOUSE_WHEEL_ACTIONS.up : MOUSE_WHEEL_ACTIONS.down;
  if (this.mouseRightButtonDown) {
    return actions[this.view.mouseWheelFunction2];
  }

  if (this.mouseLeftButtonDown) {
    return actions[this.view.mouseWheelFunction3];
  }

  return actions[this.view.mouseWheelFunction1];
};

App.prototype.mouse_scroll = function(e) {
  if (this.modalShown) 
    return;
  // if in easyreading, use it like webpage
  if (this.view.useEasyReadingMode && this.buf.pageState === 3) {
    return;
  }

  const isScrollingUp = e.deltaY < 0 || e.wheelDelta > 0;
  this.setBBSCmd(this._getMouseWheelAction(isScrollingUp));

  e.stopPropagation();
  e.preventDefault();

  if (this.mouseRightButtonDown) {
    this.CmdHandler.setAttribute('doDOMMouseScroll', '1');
  }

  if (this.mouseLeftButtonDown && this.buf.useMouseBrowsing) {
    this.CmdHandler.setAttribute('SkipMouseClick', '1');
  }
};

App.prototype._isEasyReadingActive = function() {
  return this.view.useEasyReadingMode && this.buf.startedEasyReading;
};

App.prototype._isEasyReadingAtBottom = function() {
  return this.view.mainDisplay.scrollTop >= this.view.mainContainer.clientHeight - this.view.chh * this.buf.rows;
};

App.prototype._scrollEasyReading = function(lines) {
  this.view.mainDisplay.scrollTop += this.view.chh * lines;
};

App.prototype._handleArrowUpCommand = function() {
  if (!this._isEasyReadingActive()) {
    this.conn.send('\x1b[A');
    return;
  }

  if (this.view.mainDisplay.scrollTop === 0) {
    this.easyReading.leaveCurrentPost();
    this.conn.send('\x1b[D\x1b[A\x1b[C');
    return;
  }

  this._scrollEasyReading(-1);
};

App.prototype._handleArrowDownCommand = function() {
  if (!this._isEasyReadingActive()) {
    this.conn.send('\x1b[B');
    return;
  }

  if (this._isEasyReadingAtBottom()) {
    this.easyReading.leaveCurrentPost();
    this.conn.send('\x1b[B');
    return;
  }

  this._scrollEasyReading(1);
};

App.prototype._handlePageCommand = function(command, lines) {
  if (this._isEasyReadingActive()) {
    this._scrollEasyReading(lines);
    return;
  }

  this.conn.send(command);
};

App.prototype._handleThreadCommand = function(command) {
  if (this._isEasyReadingActive()) {
    this.easyReading.leaveCurrentPost();
    this.conn.send(command);
    return;
  }

  if ([2, 3, 4].includes(this.buf.pageState)) {
    this.conn.send(command);
  }
};

App.prototype._handleEnterLikeCommand = function(command, lines) {
  if (!this._isEasyReadingActive()) {
    this.conn.send(command);
    return;
  }

  if (this._isEasyReadingAtBottom()) {
    this.easyReading.leaveCurrentPost();
    this.conn.send(command);
    return;
  }

  this._scrollEasyReading(lines);
};

App.prototype.setBBSCmd = function setBBSCmd(cmd) {
  const handlers = {
    doArrowUp: () => this._handleArrowUpCommand(),
    doArrowDown: () => this._handleArrowDownCommand(),
    doPageUp: () => this._handlePageCommand('\x1b[5~', -this.easyReading._turnPageLines),
    doPageDown: () => this._handlePageCommand('\x1b[6~', this.easyReading._turnPageLines),
    previousThread: () => this._handleThreadCommand('['),
    nextThread: () => this._handleThreadCommand(']'),
    doEnter: () => this._handleEnterLikeCommand('\r', 1),
    doRight: () => this._handleEnterLikeCommand('\x1b[C', this.easyReading._turnPageLines),
  };
  const handler = handlers[cmd];
  if (handler) {
    handler();
  }
};

App.prototype.setupContextMenus = function() {
  ReactDOM.render(
    <ContextMenu
      pttchrome={this}
    />,
    document.getElementById('cmenuReact')
  );
};
