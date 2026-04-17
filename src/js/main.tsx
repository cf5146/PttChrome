import { App } from './pttchrome';
import { setupI18n } from './i18n';
import { renderReactElement, unmountReactElement } from './react_roots';
import { ALLOW_SITE_IN_QUERY, DEFAULT_SITE, DEVELOPER_MODE } from './runtime_env';
import { readValuesWithDefault } from '../store';
import { getQueryVariable } from './util';

const b2uTableUrl = new URL('../conv/b2u_table.bin', import.meta.url).href;
const u2bTableUrl = new URL('../conv/u2b_table.bin', import.meta.url).href;

function showDeveloperModeAlert() {
  if (!DEVELOPER_MODE) {
    return;
  }

  import('../components/DeveloperModeAlert')
    .then(({ DeveloperModeAlert }) => {
      const container = document.getElementById('reactAlert');
      if (!container) {
        return;
      }

      const onDismiss = () => {
        unmountReactElement(container);
      };

      renderReactElement(container, <DeveloperModeAlert onDismiss={onDismiss} />);
    })
    .catch(error => {
      console.error('showDeveloperModeAlert failed:', error);
    });
}

function startApp() {
  setupI18n();

  const app = new App();

  showDeveloperModeAlert();

  // connect.
  app.connect(
    ALLOW_SITE_IN_QUERY && getQueryVariable('site')
    || DEFAULT_SITE);
  console.log('load pref from storage');
  app.onValuesPrefChange(readValuesWithDefault());
  app.setInputAreaFocus();
  $('#BBSWindow').show();
  app.onWindowResize();
}

function loadTable(url: string) {
  return fetch(url).then(response => {
    if (!response.ok)
      throw new Error('loadTable failed: ' + response.statusText + ': ' + url);
    return response.arrayBuffer();
  });
}

function loadResources() {
  Promise.all([
    loadTable(b2uTableUrl),
    loadTable(u2bTableUrl)
  ]).then(binData => {
    const lib = globalThis.lib || (globalThis.lib = {});
    lib.b2uArray = new Uint8Array(binData[0]);
    lib.u2bArray = new Uint8Array(binData[1]);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startApp, { once: true });
      return;
    }

    startApp();
  }, function(e) {
    console.log('loadResources failed: ' + e);
  });
}

loadResources();