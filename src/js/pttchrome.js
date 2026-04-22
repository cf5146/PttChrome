// Main Program
import { AnsiParser } from './ansi_parser';
import { TermView } from './term_view';
import { TermBuf } from './term_buf';
import { TelnetConnection } from './telnet';
import { Websocket } from './websocket';
import { EasyReading } from './easy_reading';
import { TouchController } from './touch_controller';
import {
  isAppConnected,
  isAnyModalOpen,
  readConnectedUrl,
  readConnectionState,
  readLiveHelperState,
  readValuesWithDefault,
  subscribePreferenceValues,
  writeConnectionState,
  writeRuntimeAlert,
  writeLiveHelperState,
  writeRuntimeModalOpen
} from '../store';
import { unescapeStr, b2u, parseWaterball } from './string_util';
import { setTimer, openExternalUrl, createGoogleSearchUrl, escapeCssUrl } from './util';
import { renderReactElement } from './react_roots';
import ContextMenu from '../components/ContextMenu';

const ANTI_IDLE_STR = '\x1b\x1b';
const tabIconDefault = new URL('../icon/logo.png', import.meta.url).href;
const tabIconConnect = new URL('../icon/logo_connect.png', import.meta.url).href;
const tabIconDisconnect = new URL('../icon/logo_disconnect.png', import.meta.url).href;

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

  Object.defineProperty(this, 'modalShown', {
    configurable: true,
    enumerable: true,
    get: function() {
      return isAnyModalOpen();
    },
    set: function(isOpen) {
      writeRuntimeModalOpen(isOpen);
    }
  });

  Object.defineProperty(this, 'connectState', {
    configurable: true,
    enumerable: true,
    get: function() {
      return readConnectionState().connectState;
    },
    set: function(connectState) {
      writeConnectionState({ connectState });
    }
  });

  Object.defineProperty(this, 'connectedUrl', {
    configurable: true,
    enumerable: true,
    get: function() {
      return readConnectedUrl();
    },
    set: function(connectedUrl) {
      writeConnectionState({ connectedUrl });
    }
  });

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

  $(globalThis).on('mousedown', (e) => {
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
  globalThis.onresize = () => {
    this.onWindowResize();
  };

  globalThis.addEventListener('beforeunload', (e) => {
    if (this.conn?.isConnected && this.buf.pageState !== 0) {
      e.returnValue = 'You are currently connected. Are you sure?';
      return e.returnValue;
    }
  });

  this.dblclickTimer=null;
  this.mbTimer=null;
  this.timerEverySec=null;
  this.pushthreadAutoUpdateCount = 0;
  this.maxPushthreadAutoUpdateCount = -1;
  this.onWindowResize();
  this.setupContextMenus();
  this._unsubscribePreferenceValues = subscribePreferenceValues(values => {
    this.onValuesPrefChange(values);
  });

  // init touch only if chrome is higher than version 36
  if (this.chromeVersion && this.chromeVersion >= 37) {
    this.touch = new TouchController(this);
  }
};

App.prototype.isConnected = function() {
  return isAppConnected() && !!this.conn;
};

App.prototype.reconnect = function() {
  const { url } = readConnectedUrl();
  if (!url) {
    return;
  }

  this.connect(url);
};

App.prototype.connect = function(url) {
  console.log('connect: ' + url);

  const parsed = this._parseURLSimple(url);
  if (!parsed) {
    console.log('unable to parse connect url: ' + url);
    return;
  }

  const connectedUrl = {
    url: url,
    site: parsed.hostname,
    port: parsed.port,
    easyReadingSupported: true
  };
  let socketUrl = '';

  if (parsed.protocol == 'wsstelnet') {
    socketUrl = 'wss://' + parsed.hostname + parsed.path;
  } else if (parsed.protocol == 'wstelnet') {
    socketUrl = 'ws://' + parsed.hostname + parsed.path;
  } else {
    console.log('unsupport connect url protocol: ' + parsed.protocol);
    return;
  }

  writeConnectionState({
    connectState: 0,
    connectedUrl
  });
  this._setupWebsocketConn(socketUrl);

  this.onValuesPrefChange(readValuesWithDefault());
};

App.prototype._parseURLSimple = function(url) {
  const protocol = url.split(/:\/\//, 2);
  if (protocol.length != 2)
    return null;
  const hostname = protocol[1].split(/\//, 2);
  const hostport = hostname[0].split(/:/);
  if (hostport > 2)
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
  writeConnectionState({ connectState: 1 });
  if (readConnectionState().activeAlert === 'connection') {
    writeRuntimeAlert(null);
  }
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

  writeRuntimeModalOpen(false);
  writeConnectionState({
    connectState: 2,
    activeAlert: 'connection'
  });
  this.idleTime = 0;
  this.updateTabIcon('disconnect');
};

App.prototype.sendData = function(str) {
  if (this.connectState == 1)
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

App.prototype.onToggleLiveHelperModalState = function() {
  const liveHelperState = readLiveHelperState();
  if (!liveHelperState.enabled) {
    return;
  }

  this.setAutoPushthreadUpdate(-1);
  writeLiveHelperState({
    enabled: false,
    sec: liveHelperState.sec
  });
};

App.prototype.onDisableLiveHelperModalState = function() {
  const liveHelperState = readLiveHelperState();
  if (!liveHelperState.enabled) {
    return;
  }

  this.setAutoPushthreadUpdate(-1);
  writeLiveHelperState({
    enabled: false,
    sec: liveHelperState.sec
  });
};

App.prototype.switchToEasyReadingMode = function(doSwitch) {
  this.easyReading.leaveCurrentPost();
  const conn = this.view.conn;
  if (doSwitch) {
    this.onDisableLiveHelperModalState();
    // clear the deep cloned copy of lines
    this.buf.pageLines = [];
    if (this.buf.pageState == 3 && conn) conn.send('\x1b[D\x1b[C');
  } else {
    this.view.mainContainer.style.paddingBottom = '';
    this.view.lastRowIndex = 22;
    this.view.lastRowDiv.style.display = '';
    this.view.replyRowDiv.style.display = '';
    // clear the deep cloned copy of lines
    this.buf.pageLines = [];
  }
  // request the full screen
  if (conn) {
    conn.send(unescapeStr('^L'));
  }
};

App.prototype.doCopy = function(str) {
  if (str.indexOf('\x1b') < 0) {
    str = str.replace(/\r\n/g, '\r');
    str = str.replace(/\n/g, '\r');
    str = str.replace(/ +\r/g, '\r');
  }
  this.strToCopy = str;
  document.execCommand('copy');
};

App.prototype.doCopyAnsi = function() {
  if (!this.lastSelection)
    return;

  const selection = this.lastSelection;
  let pageLines = null;
  if (this.view.useEasyReadingMode && this.buf.pageState == 3) {
    pageLines = this.buf.pageLines;
  }

  let ansiText = '';
  if (selection.start.row == selection.end.row) {
    ansiText += this.buf.getText(selection.start.row, selection.start.col, selection.end.col, true, true, false, pageLines);
  } else {
    for (let i = selection.start.row; i <= selection.end.row; ++i) {
      let scol = 0;
      let ecol = this.buf.cols-1;
      if (i == selection.start.row) {
        scol = selection.start.col;
      } else if (i == selection.end.row) {
        ecol = selection.end.col;
      }
      ansiText += this.buf.getText(i, scol, ecol, true, true, false, pageLines);
      if (i != selection.end.row ) {
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
  writeRuntimeModalOpen(true);
  writeRuntimeAlert('pasteShortcut');
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
  const fontSrc = content ? 'src: url("' + escapeCssUrl(content.data) + '");' : '';
  const css = '@font-face { font-family: MingLiUNoGlyph; ' + fontSrc + ' }';
  const style = document.createElement('style');
  style.type = 'text/css';
  style.textContent = css;
  document.getElementsByTagName('head')[0].appendChild(style);
};

App.prototype.doSelectAll = function() {
  globalThis.getSelection()?.selectAllChildren(this.view.mainDisplay);
};

App.prototype.doSearchGoogle = function(searchTerm) {
  openExternalUrl(createGoogleSearchUrl(searchTerm));
};

App.prototype.doOpenUrlNewTab = function(a) {
  if (!a) {
    return;
  }

  openExternalUrl(a.getAttribute('href') || a.href);
};

App.prototype.incrementCountToUpdatePushthread = function(interval) {
  if (this.maxPushthreadAutoUpdateCount == -1) {
    this.pushthreadAutoUpdateCount = 0;
    return;
  }

  if (++this.pushthreadAutoUpdateCount >= this.maxPushthreadAutoUpdateCount) {
    this.pushthreadAutoUpdateCount = 0;
    if (this.buf.pageState == 3 || this.buf.pageState == 2) {
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
  if (this.buf.cols == cols && this.buf.rows == rows) {
    return;
  }

  this.buf.resize(cols, rows);
  if (this.conn) {
    this.conn.sendNaws(cols, rows);
  }
};

App.prototype.switchMouseBrowsing = function() {
  if (this.CmdHandler.getAttribute('useMouseBrowsing')=='1') {
    this.CmdHandler.setAttribute('useMouseBrowsing', '0');
    this.buf.useMouseBrowsing=false;
  } else {
    this.CmdHandler.setAttribute('useMouseBrowsing', '1');
    this.buf.useMouseBrowsing=true;
  }

  if (this.buf.useMouseBrowsing) {
    this.buf.resetMousePos();
    this.view.redraw(true);
    this.view.updateCursorPos();
    return;
  }

  this.buf.BBSWin.style.cursor = 'auto';
  this.buf.clearHighlight();
  this.buf.mouseCursor=0;
  this.buf.nowHighlight=-1;
  this.buf.tempMouseCol=0;
  this.buf.tempMouseRow=0;
};

App.prototype.antiIdle = function() {
  if (this.antiIdleTime && this.idleTime > this.antiIdleTime) {
    if (this.connectState == 1) {
      this.conn.send(ANTI_IDLE_STR);
      this.idleTime = 0;
    }
  } else if (this.connectState == 1) {
    this.idleTime += 1000;
  }
};

App.prototype.updateTabIcon = function(aStatus) {
  let icon = tabIconDefault;
  switch (aStatus) {
    case 'connect':
      icon = tabIconConnect;
      this.setInputAreaFocus();
      break;
    case 'disconnect':
      icon = tabIconDisconnect;
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
  if (this.view.scaleX != 1 || this.view.scaleY != 1) {
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
  else if (row >= this.buf.rows-1)
    row = this.buf.rows-1;

  if (col < 0)
    col = 0;
  else if (col >= this.buf.cols-1)
    col = this.buf.cols-1;

  return {col: col, row: row};
};

App.prototype._buildRowMoveCommand = function(targetRow) {
  let sendstr = '';
  if (this.buf.cur_y > targetRow) {
    const count = this.buf.cur_y - targetRow;
    for (let i = 0; i < count; ++i) {
      sendstr += '\x1b[A';
    }
  } else if (this.buf.cur_y < targetRow) {
    const count = targetRow - this.buf.cur_y;
    for (let i = 0; i < count; ++i) {
      sendstr += '\x1b[B';
    }
  }

  return sendstr + '\r';
};

App.prototype._isSelectionCollapsed = function() {
  return !!globalThis.getSelection()?.isCollapsed;
};

App.prototype._isAnchorTarget = function(target) {
  return $(target).is('a') || $(target).parent().is('a');
};

App.prototype._shouldSkipMouseCommand = function(target) {
  if (target.className && this.checkClass(target.className)) {
    return true;
  }

  return !!(target.tagName && target.tagName.indexOf('menuitem') >= 0);
};

App.prototype._handleMouseBrowsingClick = function(e, skipMouseClick) {
  let doMouseCommand = !this._shouldSkipMouseCommand(e.target);
  if (skipMouseClick) {
    doMouseCommand = false;
    const pos = this.clientToPos(e.clientX, e.clientY);
    this.buf.onMouse_move(pos.col, pos.row, true);
  }

  if (!doMouseCommand) {
    return;
  }

  this.onMouse_click(e);
  this.setDblclickTimer();
  e.preventDefault();
  this.setInputAreaFocus();
};

App.prototype._handleLeftButtonFunction = function(e) {
  if (this.view.leftButtonFunction == 1) {
    this.setBBSCmd('doEnter', this.CmdHandler);
    e.preventDefault();
    this.setInputAreaFocus();
  } else if (this.view.leftButtonFunction == 2) {
    this.setBBSCmd('doRight', this.CmdHandler);
    e.preventDefault();
    this.setInputAreaFocus();
  }
};

App.prototype._copySelectedText = function() {
  const selectionText = globalThis.getSelection()?.toString() || '';
  this.doCopy(selectionText.replace(/\u00a0/g, ' '));
};

App.prototype._queueInputAreaFocus = function() {
  this.inputAreaFocusTimer = setTimer(false, () => {
    clearTimeout(this.inputAreaFocusTimer);
    this.inputAreaFocusTimer = null;
    if (this._isSelectionCollapsed()) {
      this.setInputAreaFocus();
    }
  }, 10);
};

App.prototype.onMouse_click = function (e) {
  const cX = e.clientX;
  const cY = e.clientY;
  if (!this.conn?.isConnected)
    return;

  this.onDisableLiveHelperModalState();

  this.easyReading._onMouseClick(e);
  if (e.defaultPrevented)
    return;

  const cursorCommand = {
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
    14: '\x1b[D\x1b[4~[]\r'
  }[this.buf.mouseCursor];
  if (cursorCommand) {
    this.conn.send(cursorCommand);
    return;
  }

  if (this.buf.mouseCursor == 6 && this.buf.nowHighlight != -1) {
    this.conn.send(this._buildRowMoveCommand(this.buf.nowHighlight));
    return;
  }

  if (this.buf.mouseCursor == 7) {
    const pos = this.clientToPos(cX, cY);
    this.conn.send(this._buildRowMoveCommand(pos.row));
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
  for (const name in values) {
    this.onPrefChange(name, values[name]);
  }

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
        this.resizer();
        break;
      }
    }

    if (this.view.fontFitWindowWidth) {
      $('.main').addClass('trans-fix');
    } else {
      $('.main').removeClass('trans-fix');
    }
  } catch (e) {
    console.error(e);
  }
};

App.prototype.onPrefChange = function(name, value) {
  try {
    switch (name) {
    case 'useMouseBrowsing': {
      const useMouseBrowsing = value;
      this.CmdHandler.setAttribute('useMouseBrowsing', useMouseBrowsing?'1':'0');
      this.buf.useMouseBrowsing = useMouseBrowsing;

      if (this.buf.useMouseBrowsing) {
        this.buf.resetMousePos();
      } else {
        this.buf.BBSWin.style.cursor = 'auto';
        this.buf.clearHighlight();
        this.buf.mouseCursor = 0;
        this.buf.nowHighlight = -1;
        this.buf.tempMouseCol = 0;
        this.buf.tempMouseRow = 0;
        this.buf.resetMousePos();
      }
      this.view.redraw(true);
      this.view.updateCursorPos();
      break;
    }
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
      if (typeof(this.view.leftButtonFunction) == 'boolean') {
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
      this.conn.lineWrap = value;
      break;
    case 'fontFace': {
      let fontFace = value;
      if (!fontFace) 
        fontFace='monospace';
      this.view.setFontFace(fontFace);
      break;
    }
    case 'bbsMargin': {
      const margin = value;
      this.view.bbsViewMargin = margin;
      this.onWindowResize();
      break;
    }
    default:
      break;
    }
  } catch(e) {
    console.error(e);
    return;
  }
};

App.prototype.checkClass = function(cn) {
  return (  cn.indexOf("closeSI") >= 0  || cn.indexOf("EPbtn") >= 0 || 
      cn.indexOf("closePP") >= 0 || cn.indexOf("picturePreview") >= 0 || 
      cn.indexOf("drag") >= 0    || cn.indexOf("floatWindowClientArea") >= 0 || 
      cn.indexOf("WinBtn") >= 0  || cn.indexOf("sBtn") >= 0 || 
      cn.indexOf("nonspan") >= 0 || cn.indexOf("nomouse_command") >= 0);
};

App.prototype.mouse_click = function(e) {
  if (this.modalShown)
    return;
  const skipMouseClick = (this.CmdHandler.getAttribute('SkipMouseClick') == '1');
  this.CmdHandler.setAttribute('SkipMouseClick','0');

  if (e.button !== 0) {
    return;
  }

  if (this._isAnchorTarget(e.target)) {
    return;
  }

  if (!this._isSelectionCollapsed()) {
    return;
  }

  if (this.buf.useMouseBrowsing) {
    this._handleMouseBrowsingClick(e, skipMouseClick);
    return;
  }

  if (this.view.leftButtonFunction) {
    this._handleLeftButtonFunction(e);
  }
};

App.prototype.middleMouse_down = function(e) {
  // moved to here because middle click works better with jquery
  if (e.button == 1) {
    if ($(e.target).is('a') || $(e.target).parent().is('a')) {
      return;
    }
    if (this.view.middleButtonFunction == 1) {
      this.conn.send('\r');
      return false;
    } else if (this.view.middleButtonFunction == 2) {
      this.conn.send('\x1b[D');
      return false;
    } else if (this.view.middleButtonFunction == 3) {
      this.doPaste();
      return false;
    }
  }
};

App.prototype.mouse_down = function(e) {
  if (this.modalShown)
    return;
  //0=left button, 1=middle button, 2=right button
  if (e.button === 0) {
    if (this.buf.useMouseBrowsing) {
      if (this.dblclickTimer) { //skip
        e.preventDefault();
        e.stopPropagation();
        e.cancelBubble = true;
      }
      this.setDblclickTimer();
    }
    this.mouseLeftButtonDown = true;
    if (!globalThis.getSelection()?.isCollapsed)
      this.CmdHandler.setAttribute('SkipMouseClick','1');
  } else if(e.button == 2) {
    this.mouseRightButtonDown = true;
  }
};

App.prototype.mouse_up = function(e) {
  if (this.modalShown)
    return;
  //0=left button, 1=middle button, 2=right button
  if (e.button === 0) {
    this.setMbTimer();
    this.mouseLeftButtonDown = false;
  } else if (e.button == 2) {
    this.mouseRightButtonDown = false;
  }

  if (e.button !== 0 && e.button != 2) {
    this.setInputAreaFocus();
    e.preventDefault();
    this._queueInputAreaFocus();
    return;
  }

  if (this._isSelectionCollapsed()) {
    if (this.buf.useMouseBrowsing)
      this.onMouse_move(e.clientX, e.clientY);

    this.setInputAreaFocus();
    if (e.button === 0 && !this._shouldSkipMouseCommand(e.target)) {
      e.preventDefault();
    }
  } else if (this.copyOnSelect) {
    this._copySelectedText();
  }

  this._queueInputAreaFocus();
};

App.prototype.mouse_move = function(e) {
  if (this.buf.useMouseBrowsing) {
    if (globalThis.getSelection()?.isCollapsed) {
      if(!this.mouseLeftButtonDown)
        this.onMouse_move(e.clientX, e.clientY);
    } else
      this.resetMouseCursor();
  }

};

App.prototype.mouse_over = function(e) {
  if (this.modalShown)
    return;

  this.curX = e.clientX;
  this.curY = e.clientY;

  if(globalThis.getSelection()?.isCollapsed && !this.mouseLeftButtonDown)
    this.setInputAreaFocus();
};

App.prototype._getMouseWheelActionIndex = function() {
  if (this.mouseRightButtonDown) {
    return this.view.mouseWheelFunction2;
  }
  if (this.mouseLeftButtonDown) {
    return this.view.mouseWheelFunction3;
  }
  return this.view.mouseWheelFunction1;
};

App.prototype.mouse_scroll = function(e) {
  if (this.modalShown) 
    return;
  // if in easyreading, use it like webpage
  if (this.view.useEasyReadingMode && this.buf.pageState == 3) {
    return;
  }

  // scroll = up/down
  // hold right mouse key + scroll = page up/down
  // hold left mouse key + scroll = thread prev/next
  const mouseWheelActions = e.deltaY < 0 || e.wheelDelta > 0
    ? [ 'none', 'doArrowUp', 'doPageUp', 'previousThread' ]
    : [ 'none', 'doArrowDown', 'doPageDown', 'nextThread' ];
  this.setBBSCmd(mouseWheelActions[this._getMouseWheelActionIndex()]);
  

  e.stopPropagation();
  e.preventDefault();

  if (this.mouseRightButtonDown) //prevent context menu popup
    this.CmdHandler.setAttribute('doDOMMouseScroll','1');
  else if (this.mouseLeftButtonDown) {
    if (this.buf.useMouseBrowsing) {
      this.CmdHandler.setAttribute('SkipMouseClick','1');
    }
  }
};

App.prototype._isEasyReadingCommandMode = function() {
  return this.view.useEasyReadingMode && this.buf.startedEasyReading;
};

App.prototype._isEasyReadingAtBottom = function() {
  return this.view.mainDisplay.scrollTop >=
    this.view.mainContainer.clientHeight - this.view.chh * this.buf.rows;
};

App.prototype._handleArrowUpCommand = function() {
  if (!this._isEasyReadingCommandMode()) {
    this.conn.send('\x1b[A');
    return;
  }

  if (this.view.mainDisplay.scrollTop === 0) {
    this.easyReading.leaveCurrentPost();
    this.conn.send('\x1b[D\x1b[A\x1b[C');
    return;
  }

  this.view.mainDisplay.scrollTop -= this.view.chh;
};

App.prototype._handleArrowDownCommand = function() {
  if (!this._isEasyReadingCommandMode()) {
    this.conn.send('\x1b[B');
    return;
  }

  if (this._isEasyReadingAtBottom()) {
    this.easyReading.leaveCurrentPost();
    this.conn.send('\x1b[B');
    return;
  }

  this.view.mainDisplay.scrollTop += this.view.chh;
};

App.prototype._handlePageCommand = function(command, amount) {
  if (this._isEasyReadingCommandMode()) {
    this.view.mainDisplay.scrollTop += amount;
    return;
  }

  this.conn.send(command);
};

App.prototype._handleThreadCommand = function(command) {
  if (this._isEasyReadingCommandMode()) {
    this.easyReading.leaveCurrentPost();
    this.conn.send(command);
    return;
  }

  if (this.buf.pageState==2 || this.buf.pageState==3 || this.buf.pageState==4) {
    this.conn.send(command);
  }
};

App.prototype._handleEnterLikeCommand = function(command, amount) {
  if (!this._isEasyReadingCommandMode()) {
    this.conn.send(command);
    return;
  }

  if (this._isEasyReadingAtBottom()) {
    this.easyReading.leaveCurrentPost();
    this.conn.send(command);
    return;
  }

  this.view.mainDisplay.scrollTop += amount;
};

App.prototype.setBBSCmd = function setBBSCmd(cmd) {
  switch (cmd) {
    case "doArrowUp":
      this._handleArrowUpCommand();
      break;
    case "doArrowDown":
      this._handleArrowDownCommand();
      break;
    case "doPageUp":
      this._handlePageCommand('\x1b[5~', -this.view.chh * this.easyReading._turnPageLines);
      break;
    case "doPageDown":
      this._handlePageCommand('\x1b[6~', this.view.chh * this.easyReading._turnPageLines);
      break;
    case "previousThread":
      this._handleThreadCommand('[');
      break;
    case "nextThread":
      this._handleThreadCommand(']');
      break;
    case "doEnter":
      this._handleEnterLikeCommand('\r', this.view.chh);
      break;
    case "doRight":
      this._handleEnterLikeCommand('\x1b[C', this.view.chh * this.easyReading._turnPageLines);
      break;
    default:
      break;
  }
}

App.prototype.setupContextMenus = function() {
  renderReactElement(
    document.getElementById('cmenuReact'),
    <ContextMenu pttchrome={this} />
  );
};
