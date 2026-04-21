import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';

export type PreferenceValues = {
  enablePicPreview: boolean;
  enableNotifications: boolean;
  enableEasyReading: boolean;
  endTurnsOnLiveUpdate: boolean;
  copyOnSelect: boolean;
  antiIdleTime: number;
  lineWrap: number;
  useMouseBrowsing: boolean;
  mouseBrowsingHighlight: boolean;
  mouseBrowsingHighlightColor: number;
  mouseLeftFunction: number;
  mouseMiddleFunction: number;
  mouseWheelFunction1: number;
  mouseWheelFunction2: number;
  mouseWheelFunction3: number;
  fontFitWindowWidth: boolean;
  fontFace: string;
  fontSize: number;
  termSize: {
    cols: number;
    rows: number;
  };
  termSizeMode: string;
  bbsMargin: number;
};

type StoredPreferenceValues = Partial<Omit<PreferenceValues, 'termSize'>> & {
  termSize?: Partial<PreferenceValues['termSize']>;
};

type PreferencesState = {
  values: PreferenceValues;
  setValues: (values: StoredPreferenceValues | PreferenceValues) => void;
  resetValues: () => void;
};

type PreferencesPersistedState = Pick<PreferencesState, 'values'>;

const PREF_STORAGE_KEY = 'pttchrome.pref.v1';

export const DEFAULT_PREFS: PreferenceValues = {
  enablePicPreview: true,
  enableNotifications: true,
  enableEasyReading: false,
  endTurnsOnLiveUpdate: false,
  copyOnSelect: false,
  antiIdleTime: 0,
  lineWrap: 78,
  useMouseBrowsing: false,
  mouseBrowsingHighlight: true,
  mouseBrowsingHighlightColor: 2,
  mouseLeftFunction: 0,
  mouseMiddleFunction: 0,
  mouseWheelFunction1: 1,
  mouseWheelFunction2: 2,
  mouseWheelFunction3: 3,
  fontFitWindowWidth: false,
  fontFace: 'MingLiu,SymMingLiu,monospace',
  fontSize: 20,
  termSize: { cols: 80, rows: 24 },
  termSizeMode: 'fixed-term-size',
  bbsMargin: 0
};

const createDefaultPreferenceValues = (): PreferenceValues => ({
  ...DEFAULT_PREFS,
  termSize: {
    ...DEFAULT_PREFS.termSize
  }
});

const normalizePreferenceValues = (
  values?: StoredPreferenceValues | PreferenceValues | null
): PreferenceValues => {
  const nextValues = values ?? undefined;
  const nextTermSize = nextValues?.termSize;

  return {
    ...createDefaultPreferenceValues(),
    ...nextValues,
    termSize: {
      ...DEFAULT_PREFS.termSize,
      ...nextTermSize
    }
  };
};

const preferencesStorage: PersistStorage<PreferencesPersistedState> = {
  getItem: name => {
    try {
      const rawValue = globalThis.localStorage.getItem(name);
      if (!rawValue) {
        return null;
      }

      const parsed = JSON.parse(rawValue);
      return {
        state: {
          values: normalizePreferenceValues(parsed?.values)
        },
        version: 0
      };
    } catch (error) {
      console.warn('readPreferenceValues failed:', error);
      return null;
    }
  },

  setItem: (name, value) => {
    try {
      globalThis.localStorage.setItem(
        name,
        JSON.stringify({
          values: normalizePreferenceValues(value.state.values)
        })
      );
    } catch (error) {
      console.warn('writePreferenceValues failed:', error);
    }
  },

  removeItem: name => {
    try {
      globalThis.localStorage.removeItem(name);
    } catch (error) {
      console.warn('removePreferenceValues failed:', error);
    }
  }
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    set => ({
      values: createDefaultPreferenceValues(),

      setValues: values => {
        set(() => ({
          values: normalizePreferenceValues(values)
        }));
      },

      resetValues: () => {
        set(() => ({
          values: createDefaultPreferenceValues()
        }));
      }
    }),
    {
      name: PREF_STORAGE_KEY,
      storage: preferencesStorage,
      partialize: state => ({
        values: state.values
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        values: normalizePreferenceValues(
          (persistedState as PreferencesPersistedState | undefined)?.values
        )
      })
    }
  )
);

export const readValuesWithDefault = (): PreferenceValues =>
  normalizePreferenceValues(usePreferencesStore.getState().values);

export const subscribePreferenceValues = (
  listener: (
    values: PreferenceValues,
    previousValues: PreferenceValues
  ) => void
) =>
  usePreferencesStore.subscribe((state, previousState) => {
    listener(
      normalizePreferenceValues(state.values),
      normalizePreferenceValues(previousState.values)
    );
  });

export const writeValues = (
  values: StoredPreferenceValues | PreferenceValues
): PreferenceValues => {
  const nextValues = normalizePreferenceValues(values);
  usePreferencesStore.getState().setValues(nextValues);
  return nextValues;
};

export const resetValues = (): PreferenceValues => {
  const nextValues = createDefaultPreferenceValues();
  usePreferencesStore.getState().resetValues();
  return nextValues;
};

export type ConnectedUrl = {
  url: string;
  site: string;
  port: number;
  easyReadingSupported: boolean;
};

export type RuntimeAlertKind =
  | 'connection'
  | 'developerMode'
  | 'pasteShortcut'
  | null;

type AppRuntimeState = {
  connectState: number;
  connectedUrl: ConnectedUrl;
  activeAlert: RuntimeAlertKind;
  setRuntimeState: (nextState: {
    connectState?: number;
    connectedUrl?: Partial<ConnectedUrl> | ConnectedUrl | null;
    activeAlert?: RuntimeAlertKind;
  }) => void;
  setActiveAlert: (activeAlert: RuntimeAlertKind) => void;
};

const hasOwnProperty = (value: object, key: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const createDefaultConnectedUrl = (): ConnectedUrl => ({
  url: '',
  site: '',
  port: 0,
  easyReadingSupported: true
});

const normalizeConnectedUrl = (
  connectedUrl?: Partial<ConnectedUrl> | ConnectedUrl | null
): ConnectedUrl => {
  const nextConnectedUrl = connectedUrl || undefined;

  return {
    ...createDefaultConnectedUrl(),
    ...nextConnectedUrl
  };
};

export const useAppRuntimeStore = create<AppRuntimeState>()(set => ({
  connectState: 2,
  connectedUrl: createDefaultConnectedUrl(),
  activeAlert: null,

  setRuntimeState: nextState =>
    set(state => ({
      connectState: hasOwnProperty(nextState, 'connectState')
        ? nextState.connectState
        : state.connectState,
      connectedUrl: hasOwnProperty(nextState, 'connectedUrl')
        ? normalizeConnectedUrl(nextState.connectedUrl)
        : state.connectedUrl,
      activeAlert: hasOwnProperty(nextState, 'activeAlert')
        ? nextState.activeAlert
        : state.activeAlert
    })),

  setActiveAlert: activeAlert =>
    set(() => ({
      activeAlert
    }))
}));

export const readConnectionState = () => {
  const { connectState, connectedUrl, activeAlert } =
    useAppRuntimeStore.getState();

  return {
    connectState,
    connectedUrl: normalizeConnectedUrl(connectedUrl),
    activeAlert
  };
};

export const readConnectedUrl = (): ConnectedUrl =>
  normalizeConnectedUrl(useAppRuntimeStore.getState().connectedUrl);

export const writeConnectionState = (nextState: {
  connectState?: number;
  connectedUrl?: Partial<ConnectedUrl> | ConnectedUrl | null;
  activeAlert?: RuntimeAlertKind;
}) => {
  useAppRuntimeStore.getState().setRuntimeState(nextState);
  return readConnectionState();
};

export const isAppConnected = (): boolean =>
  useAppRuntimeStore.getState().connectState === 1;

export const writeRuntimeAlert = (
  activeAlert: RuntimeAlertKind
): RuntimeAlertKind => {
  useAppRuntimeStore.getState().setActiveAlert(activeAlert);
  return activeAlert;
};

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
  runtimeModalOpen: boolean;
};

type LiveHelperState = {
  liveHelperEnabled: boolean;
  liveHelperSec: number;
};

export type LiveHelperValues = {
  enabled: boolean;
  sec: number;
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
    setRuntimeModalOpen: (isOpen: boolean) => void;
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
  showsSettings: false,
  runtimeModalOpen: false
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

  setRuntimeModalOpen: isOpen =>
    set(() => ({
      runtimeModalOpen: isOpen
    })),

  setLiveHelperState: nextState =>
    set(() => ({
      liveHelperEnabled: nextState.enabled,
      liveHelperSec: nextState.sec
    })),

  resetContextMenuState: () => set(() => createInitialState())
}));

export const readLiveHelperState = (): LiveHelperValues => {
  const { liveHelperEnabled, liveHelperSec } = useContextMenuStore.getState();

  return {
    enabled: liveHelperEnabled,
    sec: liveHelperSec
  };
};

export const writeLiveHelperState = (
  nextState: LiveHelperValues
): LiveHelperValues => {
  useContextMenuStore.getState().setLiveHelperState(nextState);
  return nextState;
};

export const isContextMenuOpen = (): boolean =>
  useContextMenuStore.getState().open;

export const isAnyModalOpen = (): boolean => {
  const {
    showsInputHelper,
    showsLiveArticleHelper,
    showsSettings,
    runtimeModalOpen
  } = useContextMenuStore.getState();

  return (
    showsInputHelper ||
    showsLiveArticleHelper ||
    showsSettings ||
    runtimeModalOpen
  );
};

export const writeRuntimeModalOpen = (isOpen: boolean): boolean => {
  useContextMenuStore.getState().setRuntimeModalOpen(isOpen);
  return isOpen;
};