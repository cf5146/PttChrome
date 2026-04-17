import { create } from 'zustand';

type ContextMenuTarget = HTMLAnchorElement | null;

type MenuState = {
  open: boolean;
  pageX: number;
  pageY: number;
  contextOnUrl: string;
  aElement: ContextMenuTarget;
  selectedText: string;
  urlEnabled: boolean;
  normalEnabled: boolean;
  selEnabled: boolean;
};

type ModalState = {
  showsInputHelper: boolean;
  showsLiveArticleHelper: boolean;
  showsSettings: boolean;
};

type LiveHelperState = {
  liveHelperEnabled: boolean;
  liveHelperSec: number;
};

type OpenMenuState = Omit<MenuState, 'open'>;

export type ContextMenuStore = MenuState &
  ModalState &
  LiveHelperState & {
    openMenu: (nextState: OpenMenuState) => void;
    closeMenu: () => void;
    showInputHelper: () => void;
    hideInputHelper: () => void;
    showLiveArticleHelper: () => void;
    hideLiveArticleHelper: () => void;
    showSettings: () => void;
    hideSettings: () => void;
    setLiveHelperState: (nextState: {
      enabled: boolean;
      sec: number;
    }) => void;
    resetContextMenuState: () => void;
  };

const createMenuState = (): MenuState => ({
  open: false,
  pageX: 0,
  pageY: 0,
  contextOnUrl: '',
  aElement: null,
  selectedText: '',
  urlEnabled: false,
  normalEnabled: false,
  selEnabled: false
});

const createModalState = (): ModalState => ({
  showsInputHelper: false,
  showsLiveArticleHelper: false,
  showsSettings: false
});

const createLiveHelperState = (): LiveHelperState => ({
  liveHelperEnabled: false,
  liveHelperSec: 1
});

const createInitialState = () => ({
  ...createMenuState(),
  ...createModalState(),
  ...createLiveHelperState()
});

export const useContextMenuStore = create<ContextMenuStore>()(set => ({
  ...createInitialState(),

  openMenu: nextState =>
    set(() => ({
      open: true,
      ...nextState
    })),

  closeMenu: () =>
    set(() => ({
      ...createMenuState()
    })),

  showInputHelper: () =>
    set(state => ({
      ...createMenuState(),
      showsInputHelper: true,
      showsLiveArticleHelper: false,
      showsSettings: false,
      liveHelperEnabled: false,
      liveHelperSec: state.liveHelperSec
    })),

  hideInputHelper: () =>
    set(() => ({
      showsInputHelper: false
    })),

  showLiveArticleHelper: () =>
    set(state => ({
      ...createMenuState(),
      showsInputHelper: false,
      showsLiveArticleHelper: true,
      showsSettings: false,
      liveHelperEnabled: state.liveHelperEnabled,
      liveHelperSec: state.liveHelperSec
    })),

  hideLiveArticleHelper: () =>
    set(() => ({
      showsLiveArticleHelper: false,
      liveHelperEnabled: false
    })),

  showSettings: () =>
    set(state => ({
      ...createMenuState(),
      showsInputHelper: false,
      showsLiveArticleHelper: false,
      showsSettings: true,
      liveHelperEnabled: false,
      liveHelperSec: state.liveHelperSec
    })),

  hideSettings: () =>
    set(() => ({
      showsSettings: false
    })),

  setLiveHelperState: nextState =>
    set(() => ({
      liveHelperEnabled: nextState.enabled,
      liveHelperSec: nextState.sec
    })),

  resetContextMenuState: () => set(() => createInitialState())
}));