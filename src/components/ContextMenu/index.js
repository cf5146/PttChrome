import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { openExternalUrl } from "../../js/util";
import { useContextMenuStore } from "../../store";
import DropdownMenu from "./DropdownMenu";
import InputHelperModal from "./InputHelperModal";
import LiveHelperModal from "./LiveHelperModal";
import PrefModal from "./PrefModal";

function noop() {}

const EVENT_KEY_BY_HOT_KEY = {
  ["C".codePointAt(0)]: "copy",
  ["E".codePointAt(0)]: "copyLinkUrl",
  ["P".codePointAt(0)]: "paste",
  ["S".codePointAt(0)]: "searchGoogle",
  ["T".codePointAt(0)]: "openUrlNewTab"
};

const menuHandlerByEventKey = {
  copy: (pttchrome, { selectedText }) => pttchrome.doCopy(selectedText),
  copyAnsi: pttchrome => pttchrome.doCopyAnsi(),
  paste: pttchrome => pttchrome.doPaste(),
  searchGoogle: (pttchrome, { selectedText }) =>
    pttchrome.doSearchGoogle(selectedText),
  openUrlNewTab: (pttchrome, { aElement }) =>
    pttchrome.doOpenUrlNewTab(aElement),
  copyLinkUrl: (pttchrome, { contextOnUrl }) => pttchrome.doCopy(contextOnUrl),
  selectAll: pttchrome => pttchrome.doSelectAll(),
  mouseBrowsing: pttchrome => pttchrome.switchMouseBrowsing()
};

const onPrefSaveImpl = (pttchrome, values) => {
  pttchrome.onValuesPrefChange(values);
  pttchrome.modalShown = false;
  pttchrome.setInputAreaFocus();
  pttchrome.switchToEasyReadingMode(pttchrome.view.useEasyReadingMode);
};

const getAnchorElement = eventTarget => {
  if (!(eventTarget instanceof Element)) {
    return null;
  }

  if (eventTarget.matches("a")) {
    return eventTarget;
  }

  return eventTarget.closest("a");
};

export const ContextMenu = ({ pttchrome }) => {
  const {
    open,
    pageX,
    pageY,
    urlEnabled,
    normalEnabled,
    selEnabled,
    selectedText,
    showsInputHelper,
    showsLiveArticleHelper,
    showsSettings,
    liveHelperEnabled,
    liveHelperSec,
    openMenu,
    closeMenu,
    showInputHelper,
    hideInputHelper,
    showLiveArticleHelper,
    hideLiveArticleHelper,
    showSettings,
    hideSettings,
    setLiveHelperState
  } = useContextMenuStore();

  const onHide = React.useCallback(() => {
    if (!useContextMenuStore.getState().open) {
      return;
    }

    pttchrome.contextMenuShown = false;
    closeMenu();
  }, [closeMenu, pttchrome]);

  const onMenuSelect = React.useCallback(
    (eventKey, event) => {
      menuHandlerByEventKey[eventKey](
        pttchrome,
        useContextMenuStore.getState()
      );
      event.stopPropagation();
      pttchrome.contextMenuShown = false;
      closeMenu();
    },
    [closeMenu, pttchrome]
  );

  const onContextMenu = React.useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();

      const { CmdHandler } = pttchrome;
      const doDOMMouseScroll =
        CmdHandler.getAttribute("doDOMMouseScroll") === "1";

      if (doDOMMouseScroll) {
        CmdHandler.setAttribute("doDOMMouseScroll", "0");
        return;
      }

      pttchrome.contextMenuShown = true;

      const selection = globalThis.getSelection();
      if (!selection || selection.isCollapsed) {
        pttchrome.lastSelection = null;
      } else {
        pttchrome.lastSelection = pttchrome.view.getSelectionColRow();
      }

      const anchorElement = getAnchorElement(event.target);
      const contextOnUrl = anchorElement?.getAttribute("href") || "";
      const nextSelectedText = selection
        ? selection.toString().replaceAll("\u00a0", " ")
        : "";
      const nextUrlEnabled = !!contextOnUrl;
      const nextNormalEnabled =
        !nextUrlEnabled && (!!selection?.isCollapsed || !selection);

      openMenu({
        pageX: event.pageX,
        pageY: event.pageY,
        contextOnUrl,
        aElement: anchorElement,
        selectedText: nextSelectedText,
        urlEnabled: nextUrlEnabled,
        normalEnabled: nextNormalEnabled,
        selEnabled: !nextNormalEnabled
      });
    },
    [openMenu, pttchrome]
  );

  const onInputHelperClick = React.useCallback(
    event => {
      event.stopPropagation();
      pttchrome.contextMenuShown = false;
      showInputHelper();
    },
    [pttchrome, showInputHelper]
  );

  const onLiveArticleHelperClick = React.useCallback(
    event => {
      event.stopPropagation();
      pttchrome.contextMenuShown = false;
      showLiveArticleHelper();
    },
    [pttchrome, showLiveArticleHelper]
  );

  const onSettingsClick = React.useCallback(
    event => {
      event.stopPropagation();
      pttchrome.contextMenuShown = false;
      pttchrome.onDisableLiveHelperModalState();
      pttchrome.modalShown = true;
      showSettings();
    },
    [pttchrome, showSettings]
  );

  const onQuickSearchSelect = React.useCallback(
    (eventKey, event) => {
      const url = eventKey
        .split("%s")
        .join(encodeURIComponent(useContextMenuStore.getState().selectedText));
      openExternalUrl(url);
      event.stopPropagation();
      pttchrome.contextMenuShown = false;
      closeMenu();
    },
    [closeMenu, pttchrome]
  );

  const onInputHelperReset = React.useCallback(() => {
    pttchrome.conn.send("\x15[m");
  }, [pttchrome]);

  const onInputHelperCmdSend = React.useCallback(
    cmd => {
      const selection = globalThis.getSelection();

      if (selection && !selection.isCollapsed && pttchrome.buf.pageState == 6) {
        const sel = pttchrome.view.getSelectionColRow();
        let row = pttchrome.buf.cur_y;
        let selCmd = "";

        selCmd += "\x1b[H";
        if (row > sel.end.row) {
          selCmd += "\x1b[A".repeat(row - sel.end.row);
        } else if (row < sel.end.row) {
          selCmd += "\x1b[B".repeat(sel.end.row - row);
        }

        let repeats = pttchrome.buf.getRowText(sel.end.row, 0, sel.end.col)
          .length;
        selCmd += "\x1b[C".repeat(repeats) + "\x15[m";

        row = sel.end.row;
        selCmd += "\x1b[H";
        if (row > sel.start.row) {
          selCmd += "\x1b[A".repeat(row - sel.start.row);
        } else if (row < sel.start.row) {
          selCmd += "\x1b[B".repeat(sel.start.row - row);
        }

        repeats = pttchrome.buf.getRowText(sel.start.row, 0, sel.start.col)
          .length;
        selCmd += "\x1b[C".repeat(repeats);
        cmd = selCmd + cmd;
      }

      pttchrome.conn.send(cmd);
    },
    [pttchrome]
  );

  const onInputHelperConvSend = React.useCallback(
    value => {
      pttchrome.conn.convSend(value);
    },
    [pttchrome]
  );

  const onLiveHelperHide = React.useCallback(() => {
    pttchrome.setAutoPushthreadUpdate(-1);
    hideLiveArticleHelper();
  }, [hideLiveArticleHelper, pttchrome]);

  const onLiveHelperChange = React.useCallback(
    nextState => {
      if (nextState.enabled) {
        pttchrome.view.useEasyReadingMode = false;
        pttchrome.switchToEasyReadingMode();
        pttchrome.setAutoPushthreadUpdate(nextState.sec);
      } else {
        pttchrome.setAutoPushthreadUpdate(-1);
      }

      setLiveHelperState(nextState);
    },
    [pttchrome, setLiveHelperState]
  );

  const onPrefSave = React.useCallback(
    values => {
      onPrefSaveImpl(pttchrome, values);
      hideSettings();
    },
    [hideSettings, pttchrome]
  );

  const onPrefReset = React.useCallback(
    values => {
      pttchrome.view.redraw(true);
      onPrefSaveImpl(pttchrome, values);
      hideSettings();
    },
    [hideSettings, pttchrome]
  );

  React.useEffect(() => {
    const bbsWindow = document.getElementById("BBSWindow");
    if (!bbsWindow) {
      return undefined;
    }

    const clickHandler = () => {
      onHide();
    };

    const touchStartHandler = event => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.getAttribute("role") === "menuitem") {
        return;
      }

      onHide();
    };

    const hotKeyUpHandler = event => {
      if (!useContextMenuStore.getState().open) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (event.altKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const eventKey = EVENT_KEY_BY_HOT_KEY[event.keyCode];
      if (eventKey) {
        onMenuSelect(eventKey, event);
      }
    };

    bbsWindow.addEventListener("contextmenu", onContextMenu, true);
    globalThis.addEventListener("click", clickHandler, false);
    globalThis.addEventListener("touchstart", touchStartHandler, false);
    globalThis.addEventListener("keyup", hotKeyUpHandler, false);

    return () => {
      globalThis.removeEventListener("keyup", hotKeyUpHandler, false);
      globalThis.removeEventListener("touchstart", touchStartHandler, false);
      globalThis.removeEventListener("click", clickHandler, false);
      bbsWindow.removeEventListener("contextmenu", onContextMenu, true);
    };
  }, [onContextMenu, onHide, onMenuSelect]);

  React.useEffect(() => {
    if (liveHelperEnabled) {
      pttchrome.onToggleLiveHelperModalState = () => {
        const {
          liveHelperEnabled: enabled,
          liveHelperSec: sec
        } = useContextMenuStore.getState();

        onLiveHelperChange({
          enabled: !enabled,
          sec
        });
      };
      pttchrome.onDisableLiveHelperModalState = () => {
        onLiveHelperChange({
          enabled: false,
          sec: useContextMenuStore.getState().liveHelperSec
        });
      };
    } else {
      pttchrome.onToggleLiveHelperModalState = noop;
      pttchrome.onDisableLiveHelperModalState = noop;
    }

    return () => {
      pttchrome.onToggleLiveHelperModalState = noop;
      pttchrome.onDisableLiveHelperModalState = noop;
    };
  }, [liveHelperEnabled, onLiveHelperChange, pttchrome]);

  return (
    <React.Fragment>
      <div
        className={cx({
          open
        })}
      >
        <DropdownMenu
          open={open}
          pageX={pageX}
          pageY={pageY}
          urlEnabled={urlEnabled}
          normalEnabled={normalEnabled}
          selEnabled={selEnabled}
          mouseBrowsingEnabled={pttchrome.buf.useMouseBrowsing}
          selectedText={selectedText}
          onMenuSelect={onMenuSelect}
          onInputHelperClick={onInputHelperClick}
          onLiveArticleHelperClick={onLiveArticleHelperClick}
          onSettingsClick={onSettingsClick}
          onQuickSearchSelect={onQuickSearchSelect}
        />
      </div>
      <InputHelperModal
        show={showsInputHelper}
        onHide={hideInputHelper}
        onReset={onInputHelperReset}
        onCmdSend={onInputHelperCmdSend}
        onConvSend={onInputHelperConvSend}
      />
      <LiveHelperModal
        show={showsLiveArticleHelper}
        onHide={onLiveHelperHide}
        enabled={liveHelperEnabled}
        sec={liveHelperSec}
        onChange={onLiveHelperChange}
      />
      <PrefModal
        show={showsSettings}
        onSave={onPrefSave}
        onReset={onPrefReset}
      />
    </React.Fragment>
  );
};

ContextMenu.propTypes = {
  pttchrome: PropTypes.object.isRequired
};

export default ContextMenu;
