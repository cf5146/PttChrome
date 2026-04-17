import { App } from './pttchrome';
import { setupI18n } from './i18n';
import { getQueryVariable } from './util';
import { readValuesWithDefault } from '../components/ContextMenu/PrefModal';

function showDeveloperModeAlert() {
  if (!process.env.DEVELOPER_MODE) {
    return;
  }

  import('../components/DeveloperModeAlert')
    .then(({ DeveloperModeAlert }) => {
      const container = document.getElementById('reactAlert');
      const onDismiss = () => {
        ReactDOM.unmountComponentAtNode(container);
      };

      ReactDOM.render(
        <DeveloperModeAlert onDismiss={onDismiss} />,
        container
      );
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
    process.env.ALLOW_SITE_IN_QUERY && getQueryVariable('site')
    || process.env.DEFAULT_SITE);
  console.log("load pref from storage");
  app.onValuesPrefChange(readValuesWithDefault());
  app.setInputAreaFocus();
  $('#BBSWindow').show();
  app.onWindowResize();
}

function loadTable(url) {
  return fetch(url).then(response => {
    if (!response.ok)
      throw new Error('loadTable failed: ' + response.statusText + ': ' + url);
    return response.arrayBuffer();
  });
}

function loadResources() {
  Promise.all([
    loadTable(require('../conv/b2u_table.bin')),
    loadTable(require('../conv/u2b_table.bin'))
  ]).then(function(binData) {
    globalThis.lib = globalThis.lib || {};
    globalThis.lib.b2uArray = new Uint8Array(binData[0]);
    globalThis.lib.u2bArray = new Uint8Array(binData[1]);
    $(document).ready(startApp);
  }, function(e) {
    console.log('loadResources failed: ' + e);
  });
}

loadResources();
