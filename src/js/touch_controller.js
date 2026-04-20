export function TouchController(app) {
  this.app = app;
  this.highlightCopy = false;
  this.touchStarted = false;
  this.touchMoved = false;
  this.touchedCenter = { x: 0, y: 0 };
  this.touchIdentifier = null;
  this.touchTarget = null;
  this.setupHandlers();
};

TouchController.prototype.setupHandlers = function() {
  const app = this.app;

  document.body.addEventListener('touchmove', e => {
    if (this.touchStarted && e.touches.length == 1) {
      e.preventDefault();
    }
  }, { passive: false });

  app.BBSWin.addEventListener('touchstart', e => {
    this.onTouchStart(e);
  }, { passive: false });

  app.BBSWin.addEventListener('touchmove', e => {
    this.onTouchMove(e);
  }, { passive: false });

  app.BBSWin.addEventListener('touchend', e => {
    this.onTouchEnd(e);
  }, { passive: false });

  app.BBSWin.addEventListener('touchcancel', () => {
    this.resetTouchState();
  }, { passive: false });
};

TouchController.prototype.findTouch = function(touchList) {
  if (!touchList || touchList.length === 0) {
    return null;
  }

  if (this.touchIdentifier === null || this.touchIdentifier === undefined) {
    return touchList[0];
  }

  for (const touch of touchList) {
    if (touch.identifier === this.touchIdentifier) {
      return touch;
    }
  }

  return null;
};

TouchController.prototype.createMouseEvent = function(clientX, clientY) {
  const target = this.touchTarget || this.app.BBSWin;

  return {
    button: 0,
    clientX: clientX,
    clientY: clientY,
    defaultPrevented: false,
    target: target,
    preventDefault: function() {
      this.defaultPrevented = true;
    },
    stopPropagation: function() {}
  };
};

TouchController.prototype.resetTouchState = function() {
  const app = this.app;

  app.buf.nowHighlight = -1;
  app.buf.highlightCursor = this.highlightCopy;
  app.BBSWin.style.cursor = 'auto';

  this.touchStarted = false;
  this.touchMoved = false;
  this.touchIdentifier = null;
  this.touchTarget = null;

  app.inputArea.focus();
};

TouchController.prototype.onTouchStart = function(e) {
  if (e.touches.length != 1) {
    return;
  }

  const touch = this.findTouch(e.changedTouches) || this.findTouch(e.touches);
  if (!touch) {
    return;
  }

  this.touchStarted = true;
  this.touchMoved = false;
  this.touchIdentifier = touch.identifier;
  this.touchTarget = e.target;
  this.highlightCopy = this.app.buf.highlightCursor;
  this.touchedCenter.x = touch.clientX;
  this.touchedCenter.y = touch.clientY;
  this.app.inputArea.blur();
};

TouchController.prototype.onTouchMove = function(e) {
  const app = this.app;
  const touch = this.findTouch(e.touches);

  if (!this.touchStarted || !touch) {
    return;
  }

  this.touchedCenter.x = touch.clientX;
  this.touchedCenter.y = touch.clientY;
  this.touchTarget = e.target;

  if (app.buf.pageState != 2) {
    return;
  }

  e.preventDefault();
  this.touchMoved = true;
  app.buf.highlightCursor = true;
  app.onMouse_move(touch.clientX, touch.clientY);
};

TouchController.prototype.onTouchEnd = function(e) {
  const app = this.app;
  const touch = this.findTouch(e.changedTouches);
  const clientX = touch ? touch.clientX : this.touchedCenter.x;
  const clientY = touch ? touch.clientY : this.touchedCenter.y;
  const mouseEvent = this.createMouseEvent(clientX, clientY);

  if (!this.touchStarted) {
    return;
  }

  e.preventDefault();

  if (this.touchMoved) {
    if (app.buf.pageState == 2 && app.buf.highlightCursor &&
        app.buf.nowHighlight != -1) {
      app.onMouse_click(mouseEvent);
    }
  } else {
    app.buf.highlightCursor = false;
    app.onMouse_move(clientX, clientY);
    app.onMouse_click(mouseEvent);
  }

  this.resetTouchState();
};
