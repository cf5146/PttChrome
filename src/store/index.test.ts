// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';

import {
  isAnyModalOpen,
  isAppConnected,
  parsePersistedPreferences,
  readConnectedUrl,
  readConnectionState,
  readValuesWithDefault,
  resetValues,
  useContextMenuStore,
  writeConnectionState,
  writeRuntimeModalOpen,
  writeValues
} from './index';

describe('store helpers', () => {
  beforeEach(() => {
    resetValues();
    writeConnectionState({
      connectState: 2,
      connectedUrl: null,
      activeAlert: null
    });
    useContextMenuStore.getState().resetContextMenuState();
    localStorage.clear();
  });

  it('normalizes partial preference writes and persists them', () => {
    const nextValues = writeValues({
      lineWrap: 120,
      termSize: {
        cols: 100
      }
    });

    expect(nextValues.lineWrap).toBe(120);
    expect(nextValues.termSize).toEqual({
      cols: 100,
      rows: 24
    });
    expect(readValuesWithDefault().termSize).toEqual({
      cols: 100,
      rows: 24
    });
    expect(JSON.parse(localStorage.getItem('pttchrome.pref.v1') || 'null'))
      .toEqual({
        version: 1,
        preferences: expect.objectContaining({
          lineWrap: 120,
          termSize: {
            cols: 100,
            rows: 24
          }
        })
      });
  });

  it('migrates legacy preferences and rejects unknown envelopes', () => {
    expect(
      parsePersistedPreferences({
        values: {
          lineWrap: 120,
          termSize: { cols: 100 }
        }
      })
    ).toEqual(expect.objectContaining({
      lineWrap: 120,
      termSize: { cols: 100, rows: 24 }
    }));

    expect(
      parsePersistedPreferences({
        version: 99,
        preferences: { lineWrap: 120 }
      })
    ).toBeNull();
  });

  it('defaults invalid persisted fields without merging their values', () => {
    const values = parsePersistedPreferences({
      version: 1,
      preferences: {
        fontSize: 'large',
        fontFace: { family: 'unsafe' },
        termSize: { cols: 0, rows: 40 },
        enablePicPreview: 'yes',
        lineWrap: 120
      }
    });

    expect(values).toEqual(expect.objectContaining({
      fontSize: 20,
      fontFace: 'MingLiu,SymMingLiu,monospace',
      enablePicPreview: true,
      lineWrap: 120,
      termSize: { cols: 80, rows: 40 }
    }));
  });

  it('normalizes connectedUrl updates and tracks connected state', () => {
    const nextState = writeConnectionState({
      connectState: 1,
      connectedUrl: {
        url: 'wstelnet://localhost:8080/bbs',
        site: 'localhost'
      },
      activeAlert: 'connection'
    });

    expect(nextState).toEqual({
      lifecycle: 'connected',
      connectState: 1,
      sessionId: 0,
      connectedUrl: {
        url: 'wstelnet://localhost:8080/bbs',
        site: 'localhost',
        port: 0,
        easyReadingSupported: true
      },
      activeAlert: 'connection'
    });
    expect(readConnectedUrl()).toEqual(nextState.connectedUrl);
    expect(isAppConnected()).toBe(true);
  });

  it('projects explicit lifecycle transitions to compatibility state codes', () => {
    writeConnectionState({
      lifecycle: 'connecting',
      sessionId: 7
    });

    expect(readConnectionState()).toEqual(expect.objectContaining({
      lifecycle: 'connecting',
      connectState: 0,
      sessionId: 7
    }));

    writeConnectionState({
      lifecycle: 'connected',
      sessionId: 7
    });

    expect(readConnectionState()).toEqual(expect.objectContaining({
      lifecycle: 'connected',
      connectState: 1,
      sessionId: 7
    }));
  });

  it('reports modal visibility for both settings and runtime modals', () => {
    expect(isAnyModalOpen()).toBe(false);

    useContextMenuStore.getState().showSettings();
    expect(isAnyModalOpen()).toBe(true);

    useContextMenuStore.getState().hideSettings();
    expect(isAnyModalOpen()).toBe(false);

    writeRuntimeModalOpen(true);
    expect(isAnyModalOpen()).toBe(true);

    writeRuntimeModalOpen(false);
    expect(isAnyModalOpen()).toBe(false);
  });
});