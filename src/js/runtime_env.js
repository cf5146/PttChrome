export const PTTCHROME_PAGE_TITLE = import.meta.env.PTTCHROME_PAGE_TITLE || 'PttChrome';
export const DEVELOPER_MODE = import.meta.env.MODE !== 'production';
export const ALLOW_SITE_IN_QUERY = import.meta.env.ALLOW_SITE_IN_QUERY === 'yes';
export const DEFAULT_SITE = DEVELOPER_MODE
  ? 'wstelnet://localhost:8080/bbs'
  : 'wsstelnet://ws.ptt.cc/bbs';