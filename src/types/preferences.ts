import type {
  ConnectedUrl,
  ContextMenuStore,
  LiveHelperValues,
  PreferenceValues,
  RuntimeAlertKind
} from '../store';

export type {
  ConnectedUrl,
  ContextMenuStore,
  LiveHelperValues,
  PreferenceValues,
  RuntimeAlertKind
} from '../store';

export type TermSizeMode = 'fixed-term-size' | 'fixed-font-size';

export type TermSizePreference = {
  cols: number;
  rows: number;
};

export type GeneralPreferenceValues = Pick<
  PreferenceValues,
  | 'enablePicPreview'
  | 'enableNotifications'
  | 'enableEasyReading'
  | 'endTurnsOnLiveUpdate'
  | 'copyOnSelect'
  | 'antiIdleTime'
  | 'lineWrap'
>;

export type DisplayPreferenceValues = Pick<
  PreferenceValues,
  | 'fontFitWindowWidth'
  | 'fontFace'
  | 'fontSize'
  | 'termSize'
  | 'termSizeMode'
  | 'bbsMargin'
>;

export type MouseBrowsingPreferenceValues = Pick<
  PreferenceValues,
  | 'useMouseBrowsing'
  | 'mouseBrowsingHighlight'
  | 'mouseBrowsingHighlightColor'
  | 'mouseLeftFunction'
  | 'mouseMiddleFunction'
  | 'mouseWheelFunction1'
  | 'mouseWheelFunction2'
  | 'mouseWheelFunction3'
>;

export type PreferenceCategory = 'general' | 'display' | 'mouseBrowsing';

export type PreferenceValuesWithKnownModes = Omit<
  PreferenceValues,
  'termSize' | 'termSizeMode'
> & {
  termSize: TermSizePreference;
  termSizeMode: TermSizeMode;
};

export type StoredPreferenceValues = Partial<
  Omit<PreferenceValues, 'termSize'>
> & {
  termSize?: Partial<PreferenceValues['termSize']>;
};

export type AppRuntimePreferenceState = {
  connectedUrl: ConnectedUrl;
  activeAlert: RuntimeAlertKind;
  liveHelper: LiveHelperValues;
  contextMenu: ContextMenuStore;
};