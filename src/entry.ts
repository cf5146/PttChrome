import 'bootstrap/dist/css/bootstrap.min.css';
import './css/main.css';
import './css/color.css';
import $ from 'jquery';
import React from 'react';
import { PTTCHROME_PAGE_TITLE } from './js/runtime_env';

const legacyGlobals = globalThis as typeof globalThis & {
	$: JQueryStatic;
	jQuery: JQueryStatic;
	React: typeof React;
};

legacyGlobals.$ = $;
legacyGlobals.jQuery = $;
legacyGlobals.React = React;

document.title = PTTCHROME_PAGE_TITLE;

import('./js/main').catch(error => {
	console.error('bootstrap failed:', error);
});