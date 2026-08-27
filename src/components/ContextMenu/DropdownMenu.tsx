import cx from 'classnames';
import React from 'react';
import { i18n } from '../../js/i18n';
import './DropdownMenu.css';

export interface DropdownMenuProps {
  open: boolean;
  pageX: number;
  pageY: number;
  urlEnabled: boolean;
  normalEnabled: boolean;
  selEnabled: boolean;
  mouseBrowsingEnabled: boolean;
  selectedText: string;
  onMenuSelect: (eventKey: string, event: React.SyntheticEvent) => void;
  onInputHelperClick: (event: React.MouseEvent) => void;
  onLiveArticleHelperClick: (event: React.MouseEvent) => void;
  onSettingsClick: (event: React.MouseEvent) => void;
  onQuickSearchSelect: (eventKey: string, event: React.SyntheticEvent) => void;
}

interface MenuItemProps {
  divider?: boolean;
  eventKey?: string;
  onSelect?: (eventKey: string, event: React.SyntheticEvent) => void;
  onClick?: (event: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
}

const top = (mouseHeight: number, menuHeight: number): number => {
  const pageHeight = window.innerHeight;

  // opening menu would pass the bottom of the page
  if (mouseHeight + menuHeight > pageHeight && menuHeight < mouseHeight) {
    return mouseHeight - menuHeight;
  }
  return mouseHeight;
};

const left = (mouseWidth: number, menuWidth: number): number => {
  const pageWidth = window.innerWidth;

  // opening menu would pass the side of the page
  if (mouseWidth + menuWidth > pageWidth && menuWidth < mouseWidth) {
    return mouseWidth - menuWidth;
  }
  return mouseWidth;
};

const normalizeSelectedText = (selectedText: string): string => {
  if (selectedText.length > 15) {
    return `${selectedText.substring(0, 15)} …`;
  }
  return selectedText;
};

const QUICK_SEARCH = {
  providers: [
    {
      name: 'goo.gl',
      url: 'https://goo.gl/%s'
    }
  ]
};

const MenuItem: React.FC<MenuItemProps> = ({
  divider,
  eventKey,
  onSelect,
  onClick,
  className,
  children
}) => {
  if (divider) {
    return (
      <li>
        <hr className="dropdown-divider" />
      </li>
    );
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onSelect && eventKey !== undefined) {
      onSelect(eventKey, event);
    }

    if (onClick) {
      onClick(event);
    }
  };

  return (
    <li className={className}>
      <button type="button" role="menuitem" tabIndex={-1} onClick={handleClick}>
        {children}
      </button>
    </li>
  );
};

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  open,
  pageX,
  pageY,
  urlEnabled,
  normalEnabled,
  selEnabled,
  mouseBrowsingEnabled,
  selectedText,
  onMenuSelect,
  onInputHelperClick,
  onLiveArticleHelperClick,
  onSettingsClick,
  onQuickSearchSelect
}) => {
  const dropdownMenuRef = React.useRef<HTMLUListElement>(null);

  React.useLayoutEffect(() => {
    const dropdownMenu = dropdownMenuRef.current;

    if (!dropdownMenu) {
      return;
    }

    dropdownMenu.style.top = `${top(pageY, dropdownMenu.clientHeight)}px`;
    dropdownMenu.style.left = `${left(pageX, dropdownMenu.clientWidth)}px`;
  }, [pageX, pageY]);

  const onContextMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };

  return (
    <ul
      className={cx('dropdown-menu', 'DropdownMenu--reset', {
        show: open
      })}
      ref={dropdownMenuRef}
      onContextMenu={onContextMenu}
      role="menu"
    >
      {selEnabled && (
        <React.Fragment>
          <MenuItem eventKey="copy" onSelect={onMenuSelect}>
            {i18n('cmenu_copy')}
            <span className="DropdownMenu__Item__HotKey">Ctrl+C</span>
          </MenuItem>
          <MenuItem eventKey="copyAnsi" onSelect={onMenuSelect}>
            {i18n('cmenu_copyAnsi')}
          </MenuItem>
        </React.Fragment>
      )}
      {normalEnabled && (
        <MenuItem eventKey="paste" onSelect={onMenuSelect}>
          {i18n('cmenu_paste')}
          <span className="DropdownMenu__Item__HotKey">Shift+Insert</span>
        </MenuItem>
      )}
      {selEnabled && (
        <MenuItem eventKey="searchGoogle" onSelect={onMenuSelect}>
          {i18n('cmenu_searchGoogle')}{' '}
          <span>'{normalizeSelectedText(selectedText)}'</span>
        </MenuItem>
      )}
      {urlEnabled && (
        <React.Fragment>
          <MenuItem eventKey="openUrlNewTab" onSelect={onMenuSelect}>
            {i18n('cmenu_openUrlNewTab')}
          </MenuItem>
          <MenuItem eventKey="copyLinkUrl" onSelect={onMenuSelect}>
            {i18n('cmenu_copyLinkUrl')}
          </MenuItem>
        </React.Fragment>
      )}
      <MenuItem divider />
      {selEnabled && (
        <React.Fragment>
          <MenuItem className="DropdownMenu__Item--quickSearch">
            {i18n('cmenu_quickSearch')}{' '}
            <span style={{ float: 'right' }}>&#9658;</span>
            <ul
              className={cx(
                'dropdown-menu',
                'DropdownMenu--reset',
                'QuickSearchMenu',
                {
                  'QuickSearchMenu--up': pageY > window.innerHeight / 2,
                  'QuickSearchMenu--left': pageX > window.innerWidth * 0.7
                }
              )}
            >
              {QUICK_SEARCH.providers.map(p => (
                <MenuItem
                  key={p.url}
                  eventKey={p.url}
                  onSelect={onQuickSearchSelect}
                >
                  {p.name}
                </MenuItem>
              ))}
            </ul>
          </MenuItem>
          <MenuItem divider />
        </React.Fragment>
      )}
      {normalEnabled && (
        <React.Fragment>
          <MenuItem eventKey="selectAll" onSelect={onMenuSelect}>
            {i18n('cmenu_selectAll')}
            <span className="DropdownMenu__Item__HotKey">Ctrl+A</span>
          </MenuItem>
          <MenuItem
            eventKey="mouseBrowsing"
            onSelect={onMenuSelect}
            className={cx({
              'DropdownMenu__Item--checked': mouseBrowsingEnabled
            })}
          >
            {i18n('cmenu_mouseBrowsing')}
          </MenuItem>
          <MenuItem onClick={onInputHelperClick}>
            {i18n('cmenu_showInputHelper')}
          </MenuItem>
          <MenuItem onClick={onLiveArticleHelperClick}>
            {i18n('cmenu_showLiveArticleHelper')}
          </MenuItem>
          <MenuItem divider />
        </React.Fragment>
      )}
      <MenuItem onClick={onSettingsClick}>{i18n('cmenu_settings')}</MenuItem>
    </ul>
  );
};

export default DropdownMenu;
