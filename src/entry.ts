import 'bootstrap/dist/css/bootstrap.min.css';
import './css/main.css';
import './css/color.css';
import Hammer from 'hammerjs';
import $ from 'jquery';
import React from 'react';
import { PTTCHROME_PAGE_TITLE } from './js/runtime_env';

const legacyGlobals = globalThis as typeof globalThis & {
	$: JQueryStatic;
	jQuery: JQueryStatic;
	Hammer: typeof Hammer;
	React: typeof React;
};

legacyGlobals.$ = $;
legacyGlobals.jQuery = $;
legacyGlobals.Hammer = Hammer;
legacyGlobals.React = React;

document.title = PTTCHROME_PAGE_TITLE;

import('./js/main').catch(error => {
	console.error('bootstrap failed:', error);
});