// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';

import {
  isAnyModalOpen,
  isAppConnected,
  readConnectedUrl,
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
        values: expect.objectContaining({
          lineWrap: 120,
          termSize: {
            cols: 100,
            rows: 24
          }
        })
      });
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
      connectState: 1,
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