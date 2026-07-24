import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import type {
  ConnectionLifecycle,
  ConnectionStatusCode
} from '../types/connection';

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

export type PersistedPreferences = {
  version: 1;
  preferences: PreferenceValues;
};

const PREF_STORAGE_KEY = 'pttchrome.pref.v1';
export const PREFERENCE_STORAGE_VERSION = 1;

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

const readNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  integer = false
) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  if (value < min || value > max || (integer && !Number.isInteger(value))) {
    return fallback;
  }

  return value;
};

const readString = (value: unknown, fallback: string, maxLength: number) =>
  typeof value === 'string' && value.length <= maxLength ? value : fallback;

export const normalizePreferenceValues = (
  values?: StoredPreferenceValues | PreferenceValues | null
): PreferenceValues => {
  const nextValues = isRecord(values) ? values : {};
  const nextTermSize = isRecord(nextValues.termSize)
    ? nextValues.termSize
    : {};

  return {
    enablePicPreview: readBoolean(
      nextValues.enablePicPreview,
      DEFAULT_PREFS.enablePicPreview
    ),
    enableNotifications: readBoolean(
      nextValues.enableNotifications,
      DEFAULT_PREFS.enableNotifications
    ),
    enableEasyReading: readBoolean(
      nextValues.enableEasyReading,
      DEFAULT_PREFS.enableEasyReading
    ),
    endTurnsOnLiveUpdate: readBoolean(
      nextValues.endTurnsOnLiveUpdate,
      DEFAULT_PREFS.endTurnsOnLiveUpdate
    ),
    copyOnSelect: readBoolean(nextValues.copyOnSelect, DEFAULT_PREFS.copyOnSelect),
    antiIdleTime: readNumber(
      nextValues.antiIdleTime,
      DEFAULT_PREFS.antiIdleTime,
      0,
      86400
    ),
    lineWrap: readNumber(nextValues.lineWrap, DEFAULT_PREFS.lineWrap, 1, 10000),
    useMouseBrowsing: readBoolean(
      nextValues.useMouseBrowsing,
      DEFAULT_PREFS.useMouseBrowsing
    ),
    mouseBrowsingHighlight: readBoolean(
      nextValues.mouseBrowsingHighlight,
      DEFAULT_PREFS.mouseBrowsingHighlight
    ),
    mouseBrowsingHighlightColor: readNumber(
      nextValues.mouseBrowsingHighlightColor,
      DEFAULT_PREFS.mouseBrowsingHighlightColor,
      1,
      15,
      true
    ),
    mouseLeftFunction: readNumber(
      nextValues.mouseLeftFunction,
      DEFAULT_PREFS.mouseLeftFunction,
      0,
      100,
      true
    ),
    mouseMiddleFunction: readNumber(
      nextValues.mouseMiddleFunction,
      DEFAULT_PREFS.mouseMiddleFunction,
      0,
      100,
      true
    ),
    mouseWheelFunction1: readNumber(
      nextValues.mouseWheelFunction1,
      DEFAULT_PREFS.mouseWheelFunction1,
      0,
      100,
      true
    ),
    mouseWheelFunction2: readNumber(
      nextValues.mouseWheelFunction2,
      DEFAULT_PREFS.mouseWheelFunction2,
      0,
      100,
      true
    ),
    mouseWheelFunction3: readNumber(
      nextValues.mouseWheelFunction3,
      DEFAULT_PREFS.mouseWheelFunction3,
      0,
      100,
      true
    ),
    fontFitWindowWidth: readBoolean(
      nextValues.fontFitWindowWidth,
      DEFAULT_PREFS.fontFitWindowWidth
    ),
    fontFace: readString(nextValues.fontFace, DEFAULT_PREFS.fontFace, 256),
    fontSize: readNumber(nextValues.fontSize, DEFAULT_PREFS.fontSize, 1, 200),
    termSize: {
      cols: readNumber(nextTermSize.cols, DEFAULT_PREFS.termSize.cols, 1, 1000, true),
      rows: readNumber(nextTermSize.rows, DEFAULT_PREFS.termSize.rows, 1, 1000, true)
    },
    termSizeMode:
      nextValues.termSizeMode === 'fixed-font-size' ||
      nextValues.termSizeMode === 'fixed-term-size'
        ? nextValues.termSizeMode
        : DEFAULT_PREFS.termSizeMode,
    bbsMargin: readNumber(nextValues.bbsMargin, DEFAULT_PREFS.bbsMargin, 0, 1000)
  };
};

export const parsePersistedPreferences = (
  value: unknown
): PreferenceValues | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (value.version === PREFERENCE_STORAGE_VERSION) {
    return isRecord(value.preferences)
      ? normalizePreferenceValues(value.preferences as StoredPreferenceValues)
      : null;
  }

  if (
    (value.version === undefined || value.version === 0) &&
    isRecord(value.values)
  ) {
    return normalizePreferenceValues(value.values as StoredPreferenceValues);
  }

  return null;
};

const preferencesStorage: PersistStorage<PreferencesPersistedState> = {
  getItem: name => {
    try {
      const rawValue = globalThis.localStorage.getItem(name);
      if (!rawValue) {
        return null;
      }

      const parsed = JSON.parse(rawValue);
      const values = parsePersistedPreferences(parsed);
      if (!values) {
        return null;
      }

      return {
        state: {
          values
        },
        version: PREFERENCE_STORAGE_VERSION
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
          version: PREFERENCE_STORAGE_VERSION,
          preferences: normalizePreferenceValues(value.state.values)
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
      version: PREFERENCE_STORAGE_VERSION,
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

type ConnectedUrlUpdate = Partial<ConnectedUrl> | ConnectedUrl | null;

export type RuntimeAlertKind =
  | 'connection'
  | 'developerMode'
  | 'pasteShortcut'
  | null;

type AppRuntimeState = {
  lifecycle: ConnectionLifecycle;
  connectState: number;
  sessionId: number;
  connectedUrl: ConnectedUrl;
  activeAlert: RuntimeAlertKind;
  setRuntimeState: (nextState: {
    lifecycle?: ConnectionLifecycle;
    connectState?: number;
    sessionId?: number;
    connectedUrl?: Partial<ConnectedUrl> | ConnectedUrl | null;
    activeAlert?: RuntimeAlertKind;
  }) => void;
  transitionConnection: (
    lifecycle: ConnectionLifecycle,
    nextState?: {
      sessionId?: number;
      connectedUrl?: ConnectedUrlUpdate;
      activeAlert?: RuntimeAlertKind;
    }
  ) => void;
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
  connectedUrl?: ConnectedUrlUpdate
): ConnectedUrl => {
  const nextConnectedUrl = connectedUrl || undefined;

  return {
    ...createDefaultConnectedUrl(),
    ...nextConnectedUrl
  };
};

const CONNECT_STATE_BY_LIFECYCLE: Record<ConnectionLifecycle, ConnectionStatusCode> = {
  idle: 2,
  connecting: 0,
  authenticating: 0,
  connected: 1,
  disconnecting: 0,
  disconnected: 2,
  failed: 2
};

const LIFECYCLE_BY_CONNECT_STATE: Record<
  ConnectionStatusCode,
  ConnectionLifecycle
> = {
  0: 'connecting',
  1: 'connected',
  2: 'disconnected'
};

type RuntimeStateUpdate = {
  lifecycle?: ConnectionLifecycle;
  connectState?: number;
  sessionId?: number;
  connectedUrl?: ConnectedUrlUpdate;
  activeAlert?: RuntimeAlertKind;
};

const normalizeConnectState = (connectState: number): ConnectionStatusCode =>
  connectState === 0 || connectState === 1 || connectState === 2
    ? connectState
    : 2;

const applyRuntimeState = (
  state: AppRuntimeState,
  nextState: RuntimeStateUpdate
) => {
  const lifecycle =
    nextState.lifecycle ||
    (hasOwnProperty(nextState, 'connectState')
      ? LIFECYCLE_BY_CONNECT_STATE[normalizeConnectState(nextState.connectState || 2)]
      : state.lifecycle);
  const nextSessionId = nextState.sessionId;

  return {
    lifecycle,
    connectState: CONNECT_STATE_BY_LIFECYCLE[lifecycle],
    sessionId:
      typeof nextSessionId === 'number' && Number.isInteger(nextSessionId) && nextSessionId >= 0
        ? nextSessionId
        : state.sessionId,
    connectedUrl: hasOwnProperty(nextState, 'connectedUrl')
      ? normalizeConnectedUrl(nextState.connectedUrl)
      : state.connectedUrl,
    activeAlert: hasOwnProperty(nextState, 'activeAlert')
      ? nextState.activeAlert
      : state.activeAlert
  };
};

export const useAppRuntimeStore = create<AppRuntimeState>()(set => ({
  lifecycle: 'disconnected',
  connectState: 2,
  sessionId: 0,
  connectedUrl: createDefaultConnectedUrl(),
  activeAlert: null,

  setRuntimeState: nextState =>
    set(state => applyRuntimeState(state, nextState)),

  transitionConnection: (lifecycle, nextState) =>
    set(state =>
      applyRuntimeState(state, {
        ...nextState,
        lifecycle
      })
    ),

  setActiveAlert: activeAlert =>
    set(() => ({
      activeAlert
    }))
}));

export const readConnectionState = () => {
  const { lifecycle, connectState, sessionId, connectedUrl, activeAlert } =
    useAppRuntimeStore.getState();

  return {
    lifecycle,
    connectState,
    sessionId,
    connectedUrl: normalizeConnectedUrl(connectedUrl),
    activeAlert
  };
};

export const readConnectedUrl = (): ConnectedUrl =>
  normalizeConnectedUrl(useAppRuntimeStore.getState().connectedUrl);

export const writeConnectionState = (nextState: {
  lifecycle?: ConnectionLifecycle;
  connectState?: number;
  sessionId?: number;
  connectedUrl?: Partial<ConnectedUrl> | ConnectedUrl | null;
  activeAlert?: RuntimeAlertKind;
}) => {
  useAppRuntimeStore.getState().setRuntimeState(nextState);
  return readConnectionState();
};

export const isAppConnected = (): boolean =>
  useAppRuntimeStore.getState().lifecycle === 'connected';

export const transitionConnection = (
  lifecycle: ConnectionLifecycle,
  nextState?: {
    sessionId?: number;
    connectedUrl?: Partial<ConnectedUrl> | ConnectedUrl | null;
    activeAlert?: RuntimeAlertKind;
  }
) => {
  useAppRuntimeStore.getState().transitionConnection(lifecycle, nextState);
  return readConnectionState();
};

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