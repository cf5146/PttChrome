/// <reference types="vite/client" />

declare namespace PttChrome {
  interface LibTables {
    b2uArray?: Uint8Array;
    u2bArray?: Uint8Array;
  }
}

declare global {
  interface ImportMetaEnv {
    readonly PTTCHROME_PAGE_TITLE?: string;
    readonly ALLOW_SITE_IN_QUERY?: string;
  }

  interface GlobalThis {
    $: JQueryStatic;
    jQuery: JQueryStatic;
    Hammer: typeof import('hammerjs');
    React: typeof import('react');
    ReactDOM: typeof import('react-dom');
    lib: PttChrome.LibTables | undefined;
  }

  var $: JQueryStatic;
  var jQuery: JQueryStatic;
  var Hammer: typeof import('hammerjs');
  var React: typeof import('react');
  var ReactDOM: typeof import('react-dom');
  var lib: PttChrome.LibTables | undefined;
}

declare module '*.css' {
  const value: string;
  export default value;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.bin' {
  const value: string;
  export default value;
}

export {};