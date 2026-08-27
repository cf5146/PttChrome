import cx from 'classnames';
import React from 'react';
import {
  Modal,
  Tab,
  Nav,
  Button,
  Form,
  OverlayTrigger,
  Popover
} from 'react-bootstrap';
import { i18n } from '../../js/i18n';
import { getSafeExternalUrl } from '../../js/util';
import { readValuesWithDefault, resetValues, writeValues } from '../../store';
import type { PreferenceValues } from '../../types/preferences';
import './PrefModal.css';

export interface PrefModalProps {
  show: boolean;
  onSave: (values: PreferenceValues) => void;
  onReset?: (values: PreferenceValues) => void;
  onHide?: () => void;
}

const MOUSE_BROWSING_HIGHLIGHT_COLORS = Array.from(
  { length: 15 },
  (_, index) => index + 1
);

const link = (text: string, url: string): React.ReactNode => {
  const safeUrl = getSafeExternalUrl(url);

  if (!safeUrl) {
    return text;
  }

  return (
    <a href={safeUrl} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  );
};

const createReplacements = (): Record<string, React.ReactNode> => ({
  link_github_iamchucky: link('Chuck Yang', 'https://github.com/iamchucky'),
  link_github_robertabcd: link('robertabcd', 'https://github.com/robertabcd'),
  link_robertabcd_PttChrome: link(
    'robertabcd/PttChrome',
    'https://github.com/robertabcd/PttChrome'
  ),
  link_iamchucky_PttChrome: link(
    'iamchucky/PttChrome',
    'https://github.com/iamchucky/PttChrome'
  ),
  link_GPL20: link(
    'General Public License v2.0',
    'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html'
  )
});

const replaceI18n = (
  id: string,
  replacements: Record<string, React.ReactNode>
): React.ReactNode => {
  const text = i18n(id);
  if (typeof text !== 'string') {
    return null;
  }

  return text
    .split(/#(\S+)#/gi)
    .map((it, index) => {
      if (index % 2 === 1 && it in replacements) {
        const replacement = replacements[it];
        if (React.isValidElement(replacement)) {
          return React.cloneElement(
            replacement as React.ReactElement<Record<string, unknown>>,
            {
              key: `${id}-${it}-${index}`
            }
          );
        }

        return (
          <React.Fragment key={`${id}-${it}-${index}`}>
            {replacement}
          </React.Fragment>
        );
      } else {
        return <React.Fragment key={`${id}-${index}`}>{it}</React.Fragment>;
      }
    });
};

function changeNestedValue<T extends object>(
  obj: T,
  key: string,
  newValue: unknown
): T {
  const i = key.indexOf('.');
  if (i > 0) {
    const parentKey = key.substring(0, i) as keyof T;
    const subKey = key.substring(i + 1);
    const parentObj = (
      obj[parentKey] && typeof obj[parentKey] === 'object'
        ? obj[parentKey]
        : {}
    ) as object;
    return {
      ...obj,
      [parentKey]: changeNestedValue(parentObj, subKey, newValue)
    };
  }
  return {
    ...obj,
    [key]: newValue
  };
}

export const PrefModal: React.FC<PrefModalProps> = ({
  show,
  onSave,
  onReset,
  onHide
}) => {
  const [navActiveKey, setNavActiveKey] = React.useState('general');
  const [values, setValues] = React.useState<PreferenceValues>(() =>
    readValuesWithDefault()
  );
  const [replacements] = React.useState(createReplacements);

  React.useEffect(() => {
    if (show) {
      setValues(readValuesWithDefault());
    }
  }, [show]);

  const onCloseClick = () => {
    const nextValues = writeValues(values);
    setValues(nextValues);
    onSave(nextValues);
    onHide?.();
  };

  const onResetClick = () => {
    const nextValues = resetValues();
    setValues(nextValues);
    onReset?.(nextValues);
  };

  const onNavSelect = (activeKey: string | null) => {
    if (activeKey) {
      setNavActiveKey(activeKey);
    }
  };

  const onCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setValues(currentValues =>
      changeNestedValue(currentValues, name, !!checked)
    );
  };

  const onNumberInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setValues(currentValues =>
      changeNestedValue(currentValues, name, Number.parseInt(value, 10))
    );
  };

  const onTextInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setValues(currentValues => changeNestedValue(currentValues, name, value));
  };

  const aboutNewContent = (i18n('about_new_content') as unknown as string[]) || [];

  return (
    <Modal show={show} onHide={onCloseClick} className="PrefModal">
      <Modal.Body>
        <Tab.Container activeKey={navActiveKey} onSelect={onNavSelect}>
          <div className="PrefModal__Grid">
            <div className="PrefModal__Grid__Col--left">
              <h3>{i18n('menu_settings')}</h3>
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link eventKey="general">
                    {i18n('options_general')}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="about">
                    {i18n('options_about')}
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              <Button
                className="PrefModal__Grid__Col--left__Reset"
                onClick={onResetClick}
              >
                {i18n('options_reset')}
              </Button>
            </div>
            <div className="PrefModal__Grid__Col--right">
              <Tab.Content>
                <Tab.Pane eventKey="general">
                  <fieldset className="PrefModal__Grid__Col--right__Fieldset">
                    <legend>
                      {i18n('options_general')}
                      <button
                        type="button"
                        className="close"
                        onClick={onCloseClick}
                        aria-label="Close"
                      >
                        &times;
                      </button>
                    </legend>
                    <Form.Check
                      id="enablePicPreview"
                      name="enablePicPreview"
                      type="checkbox"
                      label={i18n('options_enablePicPreview')}
                      checked={values.enablePicPreview}
                      onChange={onCheckboxChange}
                    />
                    <Form.Check
                      id="enableNotifications"
                      name="enableNotifications"
                      type="checkbox"
                      label={i18n('options_enableNotifications')}
                      checked={values.enableNotifications}
                      onChange={onCheckboxChange}
                    />
                    <Form.Check
                      id="enableEasyReading"
                      name="enableEasyReading"
                      type="checkbox"
                      label={i18n('options_enableEasyReading')}
                      checked={values.enableEasyReading}
                      onChange={onCheckboxChange}
                    />
                    <Form.Check
                      id="endTurnsOnLiveUpdate"
                      name="endTurnsOnLiveUpdate"
                      type="checkbox"
                      label={i18n('options_endTurnsOnLiveUpdate')}
                      checked={values.endTurnsOnLiveUpdate}
                      onChange={onCheckboxChange}
                    />
                    <Form.Check
                      id="copyOnSelect"
                      name="copyOnSelect"
                      type="checkbox"
                      label={i18n('options_copyOnSelect')}
                      checked={values.copyOnSelect}
                      onChange={onCheckboxChange}
                    />
                    <Form.Group controlId="antiIdleTime">
                      <Form.Label>{i18n('options_antiIdleTime')}</Form.Label>
                      <OverlayTrigger
                        trigger="focus"
                        placement="right"
                        overlay={
                          <Popover id="tooltip_antiIdleTime">
                            <Popover.Body>
                              {i18n('tooltip_antiIdleTime')}
                            </Popover.Body>
                          </Popover>
                        }
                      >
                        <Form.Control
                          name="antiIdleTime"
                          type="number"
                          value={values.antiIdleTime}
                          onChange={onNumberInputChange}
                        />
                      </OverlayTrigger>
                    </Form.Group>
                    <Form.Group controlId="lineWrap">
                      <Form.Label>{i18n('options_lineWrap')}</Form.Label>
                      <Form.Control
                        name="lineWrap"
                        type="number"
                        value={values.lineWrap}
                        onChange={onNumberInputChange}
                      />
                    </Form.Group>
                  </fieldset>
                  <fieldset className="PrefModal__Grid__Col--right__Fieldset">
                    <legend>{i18n('options_appearance')}</legend>
                    <Form.Group controlId="fontFace">
                      <Form.Label>{i18n('options_fontFace')}</Form.Label>
                      <OverlayTrigger
                        trigger="focus"
                        placement="right"
                        overlay={
                          <Popover id="tooltip_fontFace">
                            <Popover.Body>
                              {i18n('tooltip_fontFace')}
                            </Popover.Body>
                          </Popover>
                        }
                      >
                        <Form.Control
                          name="fontFace"
                          type="text"
                          value={values.fontFace}
                          onChange={onTextInputChange}
                        />
                      </OverlayTrigger>
                    </Form.Group>
                    <Form.Group controlId="bbsMargin">
                      <Form.Label>{i18n('options_bbsMargin')}</Form.Label>
                      <Form.Control
                        name="bbsMargin"
                        type="number"
                        value={values.bbsMargin}
                        onChange={onNumberInputChange}
                      />
                    </Form.Group>
                    <Form.Group controlId="termSizeMode">
                      <Form.Label>{i18n('options_termSize')}</Form.Label>
                      <Form.Select
                        name="termSizeMode"
                        value={values.termSizeMode}
                        onChange={onTextInputChange}
                      >
                        <option value="fixed-term-size">
                          {i18n('options_fixedTermSize')}
                        </option>
                        <option value="fixed-font-size">
                          {i18n('options_fixedFontSize')}
                        </option>
                      </Form.Select>
                    </Form.Group>
                    {(() => {
                      switch (values.termSizeMode) {
                        case 'fixed-term-size':
                          return (
                            <div>
                              <Form.Group controlId="termSize_cols">
                                <Form.Label>
                                  {i18n('options_cols')}
                                </Form.Label>
                                <Form.Control
                                  name="termSize.cols"
                                  type="number"
                                  value={values.termSize.cols}
                                  onChange={onNumberInputChange}
                                />
                              </Form.Group>
                              <Form.Group controlId="termSize_rows">
                                <Form.Label>
                                  {i18n('options_rows')}
                                </Form.Label>
                                <Form.Control
                                  name="termSize.rows"
                                  type="number"
                                  value={values.termSize.rows}
                                  onChange={onNumberInputChange}
                                />
                              </Form.Group>
                              <Form.Check
                                id="fontFitWindowWidth"
                                name="fontFitWindowWidth"
                                type="checkbox"
                                label={i18n('options_fontFitWindowWidth')}
                                checked={values.fontFitWindowWidth}
                                onChange={onCheckboxChange}
                              />
                            </div>
                          );
                        case 'fixed-font-size':
                          return (
                            <Form.Group controlId="fontSize">
                              <Form.Label>
                                {i18n('options_fontSize')}
                              </Form.Label>
                              <Form.Control
                                name="fontSize"
                                type="number"
                                value={values.fontSize}
                                onChange={onNumberInputChange}
                              />
                            </Form.Group>
                          );
                        default:
                          return null;
                      }
                    })()}
                  </fieldset>
                  <fieldset className="PrefModal__Grid__Col--right__Fieldset">
                    <legend>{i18n('options_mouseBrowsing')}</legend>
                    <Form.Check
                      id="useMouseBrowsing"
                      name="useMouseBrowsing"
                      type="checkbox"
                      label={i18n('options_useMouseBrowsing')}
                      checked={values.useMouseBrowsing}
                      onChange={onCheckboxChange}
                    />
                    <Form.Check
                      id="mouseBrowsingHighlight"
                      name="mouseBrowsingHighlight"
                      type="checkbox"
                      label={i18n('options_mouseBrowsingHighlight')}
                      checked={values.mouseBrowsingHighlight}
                      onChange={onCheckboxChange}
                    />
                    <div className="PrefModal__Grid__Col--right__MouseBrowsingHighlightColor">
                      {i18n('options_highlightColor')}
                      <Form.Select
                        className={cx(`b${values.mouseBrowsingHighlightColor}`)}
                        name="mouseBrowsingHighlightColor"
                        value={values.mouseBrowsingHighlightColor}
                        onChange={onNumberInputChange}
                      >
                        {MOUSE_BROWSING_HIGHLIGHT_COLORS.map(colorValue => (
                          <option
                            key={colorValue}
                            value={colorValue}
                            className={cx(`b${colorValue}`)}
                          />
                        ))}
                      </Form.Select>
                    </div>
                    <Form.Group controlId="mouseLeftFunction">
                      <Form.Label>
                        {i18n('options_mouseLeftFunction')}
                      </Form.Label>
                      <Form.Select
                        name="mouseLeftFunction"
                        value={values.mouseLeftFunction}
                        onChange={onNumberInputChange}
                      >
                        {[
                          'options_none',
                          'options_enterKey',
                          'options_rightKey'
                        ].map((key, index) => (
                          <option key={key} value={index}>
                            {i18n(key)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group controlId="mouseMiddleFunction">
                      <Form.Label>
                        {i18n('options_mouseMiddleFunction')}
                      </Form.Label>
                      <Form.Select
                        name="mouseMiddleFunction"
                        value={values.mouseMiddleFunction}
                        onChange={onNumberInputChange}
                      >
                        {[
                          'options_none',
                          'options_enterKey',
                          'options_leftKey',
                          'options_doPaste'
                        ].map((key, index) => (
                          <option key={key} value={index}>
                            {i18n(key)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group controlId="mouseWheelFunction1">
                      <Form.Label>
                        {i18n('options_mouseWheelFunction1')}
                      </Form.Label>
                      <Form.Select
                        name="mouseWheelFunction1"
                        value={values.mouseWheelFunction1}
                        onChange={onNumberInputChange}
                      >
                        {[
                          'options_none',
                          'options_upDown',
                          'options_pageUpDown',
                          'options_threadLastNext'
                        ].map((key, index) => (
                          <option key={key} value={index}>
                            {i18n(key)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group controlId="mouseWheelFunction2">
                      <Form.Label>
                        {i18n('options_mouseWheelFunction2')}
                      </Form.Label>
                      <Form.Select
                        name="mouseWheelFunction2"
                        value={values.mouseWheelFunction2}
                        onChange={onNumberInputChange}
                      >
                        {[
                          'options_none',
                          'options_upDown',
                          'options_pageUpDown',
                          'options_threadLastNext'
                        ].map((key, index) => (
                          <option key={key} value={index}>
                            {i18n(key)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group controlId="mouseWheelFunction3">
                      <Form.Label>
                        {i18n('options_mouseWheelFunction3')}
                      </Form.Label>
                      <Form.Select
                        name="mouseWheelFunction3"
                        value={values.mouseWheelFunction3}
                        onChange={onNumberInputChange}
                      >
                        {[
                          'options_none',
                          'options_upDown',
                          'options_pageUpDown',
                          'options_threadLastNext'
                        ].map((key, index) => (
                          <option key={key} value={index}>
                            {i18n(key)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </fieldset>
                </Tab.Pane>
                <Tab.Pane eventKey="about">
                  <div>
                    <legend>
                      PttChrome{' '}
                      <small> - {i18n('about_appName_subtitle')}</small>
                      <button
                        type="button"
                        className="close"
                        onClick={onCloseClick}
                        aria-label="Close"
                      >
                        &times;
                      </button>
                    </legend>
                    <p>{replaceI18n('about_description', replacements)}</p>
                  </div>
                  <div>
                    <legend>{i18n('about_version_title')}</legend>
                    <ul>
                      <li>
                        {replaceI18n('about_version_current', replacements)}
                      </li>
                      <li>
                        {replaceI18n('about_version_original', replacements)}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <legend>{i18n('about_new_title')}</legend>
                    <ul>
                      {Array.isArray(aboutNewContent) &&
                        aboutNewContent.map((text: string) => (
                          <li key={text}>{text}</li>
                        ))}
                    </ul>
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </div>
          </div>
        </Tab.Container>
      </Modal.Body>
    </Modal>
  );
};

export default PrefModal;
