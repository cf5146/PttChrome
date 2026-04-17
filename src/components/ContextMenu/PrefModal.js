import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";
import {
  Modal,
  Tab,
  Nav,
  NavItem,
  Button,
  Checkbox,
  FormGroup,
  ControlLabel,
  FormControl,
  OverlayTrigger,
  Popover
} from "../bootstrap-compat";
import { i18n } from "../../js/i18n";
import { getSafeExternalUrl } from "../../js/util";
import "./PrefModal.css";

const DEFAULT_PREFS = {
  // general
  //dbcsDetect    : false,
  enablePicPreview: true,
  enableNotifications: true,
  enableEasyReading: false,
  endTurnsOnLiveUpdate: false,
  copyOnSelect: false,
  antiIdleTime: 0,
  lineWrap: 78,

  // mouse browsing
  useMouseBrowsing: false,
  mouseBrowsingHighlight: true,
  mouseBrowsingHighlightColor: 2,
  mouseLeftFunction: 0,
  mouseMiddleFunction: 0,
  mouseWheelFunction1: 1,
  mouseWheelFunction2: 2,
  mouseWheelFunction3: 3,

  // displays
  fontFitWindowWidth: false,
  fontFace: "MingLiu,SymMingLiu,monospace",
  fontSize: 20,
  termSize: { cols: 80, rows: 24 },
  termSizeMode: "fixed-term-size",
  bbsMargin: 0
};

const MOUSE_BROWSING_HIGHLIGHT_COLORS = Array.from(
  { length: 15 },
  (_, index) => index + 1
);

const PREF_STORAGE_KEY = "pttchrome.pref.v1";

const createDefaultPrefs = () => ({
  ...DEFAULT_PREFS,
  termSize: {
    ...DEFAULT_PREFS.termSize
  }
});

const createReplacements = () => ({
  link_github_iamchucky: link("Chuck Yang", "https://github.com/iamchucky"),
  link_github_robertabcd: link("robertabcd", "https://github.com/robertabcd"),
  link_robertabcd_PttChrome: link(
    "robertabcd/PttChrome",
    "https://github.com/robertabcd/PttChrome"
  ),
  link_iamchucky_PttChrome: link(
    "iamchucky/PttChrome",
    "https://github.com/iamchucky/PttChrome"
  ),
  link_GPL20: link(
    "General Public License v2.0",
    "https://www.gnu.org/licenses/old-licenses/gpl-2.0.html"
  )
});

const readStoredValues = () => {
  try {
    const rawValue = globalThis.localStorage.getItem(PREF_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue)?.values || null;
  } catch (error) {
    console.warn("readValuesWithDefault failed:", error);
    return null;
  }
};

export const readValuesWithDefault = () => {
  return {
    ...createDefaultPrefs(),
    ...(readStoredValues() || {})
  };
};

const writeValues = values => {
  try {
    globalThis.localStorage.setItem(
      PREF_STORAGE_KEY,
      JSON.stringify({
        values
      })
    );
  } catch (error) {
    console.warn("writeValues failed:", error);
  }

  return values;
};

const replaceI18n = (id, replacements) => {
  return i18n(id)
    .split(/#(\S+)#/gi)
    .map((it, index) => {
      if (index % 2 === 1 && it in replacements) {
        const replacement = replacements[it];
        if (React.isValidElement(replacement)) {
          return React.cloneElement(replacement, {
            key: `${id}-${it}-${index}`
          });
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

const link = (text, url) => {
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

const changeNestedValue = (obj, key, newValue) => {
  let i = key.indexOf(".");
  if (i > 0) {
    let parentKey = key.substring(0, i);
    let subKey = key.substring(i + 1);
    return {
      ...obj,
      [parentKey]: changeNestedValue(obj[parentKey], subKey, newValue)
    };
  }
  return {
    ...obj,
    [key]: newValue
  };
};
export const PrefModal = ({ show, onSave, onReset }) => {
  const [navActiveKey, setNavActiveKey] = React.useState("general");
  const [values, setValues] = React.useState(() => readValuesWithDefault());
  const [replacements] = React.useState(createReplacements);

  React.useEffect(() => {
    if (show) {
      setValues(readValuesWithDefault());
    }
  }, [show]);

  const onCloseClick = () => {
    onSave(writeValues(values));
  };

  const onResetClick = () => {
    const nextValues = writeValues(createDefaultPrefs());
    setValues(nextValues);
    onReset(nextValues);
  };

  const onNavSelect = activeKey => {
    setNavActiveKey(activeKey);
  };

  const onCheckboxChange = ({ target: { name, checked } }) => {
    setValues(currentValues =>
      changeNestedValue(currentValues, name, !!checked)
    );
  };

  const onNumberInputChange = ({ target: { name, value } }) => {
    setValues(currentValues =>
      changeNestedValue(currentValues, name, Number.parseInt(value, 10))
    );
  };

  const onTextInputChange = ({ target: { name, value } }) => {
    setValues(currentValues => changeNestedValue(currentValues, name, value));
  };

  return (
    <Modal show={show} onHide={onCloseClick} className="PrefModal">
      <Modal.Body>
        <Tab.Container activeKey={navActiveKey} onSelect={onNavSelect}>
          <div className="PrefModal__Grid">
            <div className="PrefModal__Grid__Col--left">
              <h3>{i18n("menu_settings")}</h3>
              <Nav bsStyle="pills" stacked>
                <NavItem eventKey="general">{i18n("options_general")}</NavItem>
                <NavItem eventKey="about">{i18n("options_about")}</NavItem>
              </Nav>
              <Button
                className="PrefModal__Grid__Col--left__Reset"
                onClick={onResetClick}
              >
                {i18n("options_reset")}
              </Button>
            </div>
            <div className="PrefModal__Grid__Col--right">
              <Tab.Content>
                <Tab.Pane eventKey="general">
                  <fieldset className="PrefModal__Grid__Col--right__Fieldset">
                    <legend>
                      {i18n("options_general")}
                      <button
                        type="button"
                        className="close"
                        onClick={onCloseClick}
                      >
                        &times;
                      </button>
                    </legend>
                    <Checkbox
                      name="enablePicPreview"
                      checked={values.enablePicPreview}
                      onChange={onCheckboxChange}
                    >
                      {i18n("options_enablePicPreview")}
                    </Checkbox>
                    <Checkbox
                      name="enableNotifications"
                      checked={values.enableNotifications}
                      onChange={onCheckboxChange}
                    >
                      {i18n("options_enableNotifications")}
                    </Checkbox>
                    <Checkbox
                      name="enableEasyReading"
                      checked={values.enableEasyReading}
                      onChange={onCheckboxChange}
                    >
                      {i18n("options_enableEasyReading")}
                    </Checkbox>
                    <Checkbox
                      name="endTurnsOnLiveUpdate"
                      checked={values.endTurnsOnLiveUpdate}
                      onChange={onCheckboxChange}
                    >
                      {i18n("options_endTurnsOnLiveUpdate")}
                    </Checkbox>
                    <Checkbox
                      name="copyOnSelect"
                      checked={values.copyOnSelect}
                      onChange={onCheckboxChange}
                    >
                      {i18n("options_copyOnSelect")}
                    </Checkbox>
                    <FormGroup controlId="antiIdleTime">
                      <ControlLabel>
                        {i18n("options_antiIdleTime")}
                      </ControlLabel>
                      <OverlayTrigger
                        trigger="focus"
                        placement="right"
                        overlay={
                          <Popover id="tooltip_antiIdleTime">
                            {i18n("tooltip_antiIdleTime")}
                          </Popover>
                        }
                      >
                        <FormControl
                          name="antiIdleTime"
                          type="number"
                          value={values.antiIdleTime}
                          onChange={onNumberInputChange}
                        />
                      </OverlayTrigger>
                    </FormGroup>
                    <FormGroup controlId="lineWrap">
                      <ControlLabel>{i18n("options_lineWrap")}</ControlLabel>
                      <FormControl
                        name="lineWrap"
                        type="number"
                        value={values.lineWrap}
                        onChange={onNumberInputChange}
                      />
                    </FormGroup>
                  </fieldset>
                  <fieldset className="PrefModal__Grid__Col--right__Fieldset">
                    <legend>{i18n("options_appearance")}</legend>
                    <FormGroup controlId="fontFace">
                      <ControlLabel>{i18n("options_fontFace")}</ControlLabel>
                      <OverlayTrigger
                        trigger="focus"
                        placement="right"
                        overlay={
                          <Popover id="tooltip_fontFace">
                            {i18n("tooltip_fontFace")}
                          </Popover>
                        }
                      >
                        <FormControl
                          name="fontFace"
                          type="text"
                          value={values.fontFace}
                          onChange={onTextInputChange}
                        />
                      </OverlayTrigger>
                    </FormGroup>
                    <FormGroup controlId="bbsMargin">
                      <ControlLabel>{i18n("options_bbsMargin")}</ControlLabel>
                      <FormControl
                        name="bbsMargin"
                        type="number"
                        value={values.bbsMargin}
                        onChange={onNumberInputChange}
                      />
                    </FormGroup>
                    <FormGroup controlId="termSizeMode">
                      <ControlLabel>{i18n("options_termSize")}</ControlLabel>
                      <FormControl
                        componentClass="select"
                        name="termSizeMode"
                        value={values.termSizeMode}
                        onChange={onTextInputChange}
                      >
                        <option
                          key={"options_fixedTermSize"}
                          value={"fixed-term-size"}
                        >
                          {i18n("options_fixedTermSize")}
                        </option>
                        <option
                          key={"options_fixedFontSize"}
                          value={"fixed-font-size"}
                        >
                          {i18n("options_fixedFontSize")}
                        </option>
                      </FormControl>
                    </FormGroup>
                    {(() => {
                      switch (values.termSizeMode) {
                        case "fixed-term-size":
                          return (
                            <div>
                              <FormGroup controlId="termSize_cols">
                                <ControlLabel>
                                  {i18n("options_cols")}
                                </ControlLabel>
                                <FormControl
                                  name="termSize.cols"
                                  type="number"
                                  value={values.termSize.cols}
                                  onChange={onNumberInputChange}
                                />
                              </FormGroup>
                              <FormGroup controlId="termSize_rows">
                                <ControlLabel>
                                  {i18n("options_rows")}
                                </ControlLabel>
                                <FormControl
                                  name="termSize.rows"
                                  type="number"
                                  value={values.termSize.rows}
                                  onChange={onNumberInputChange}
                                />
                              </FormGroup>
                              <Checkbox
                                name="fontFitWindowWidth"
                                checked={values.fontFitWindowWidth}
                                onChange={onCheckboxChange}
                              >
                                {i18n("options_fontFitWindowWidth")}
                              </Checkbox>
                            </div>
                          );
                        case "fixed-font-size":
                          return (
                            <FormGroup controlId="fontSize">
                              <ControlLabel>
                                {i18n("options_fontSize")}
                              </ControlLabel>
                              <FormControl
                                name="fontSize"
                                type="number"
                                value={values.fontSize}
                                onChange={onNumberInputChange}
                              />
                            </FormGroup>
                          );
                        default:
                          return null;
                      }
                    })()}
                  </fieldset>
                  <fieldset className="PrefModal__Grid__Col--right__Fieldset">
                    <legend>{i18n("options_mouseBrowsing")}</legend>
                    <Checkbox
                      name="useMouseBrowsing"
                      checked={values.useMouseBrowsing}
                      onChange={onCheckboxChange}
                    >
                      {i18n("options_useMouseBrowsing")}
                    </Checkbox>
                    <Checkbox
                      name="mouseBrowsingHighlight"
                      checked={values.mouseBrowsingHighlight}
                      onChange={onCheckboxChange}
                    >
                      {i18n("options_mouseBrowsingHighlight")}
                    </Checkbox>
                    <div className="PrefModal__Grid__Col--right__MouseBrowsingHighlightColor">
                      {i18n("options_highlightColor")}
                      <FormControl
                        componentClass="select"
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
                      </FormControl>
                    </div>
                    <FormGroup controlId="mouseLeftFunction">
                      <ControlLabel>
                        {i18n("options_mouseLeftFunction")}
                      </ControlLabel>
                      <FormControl
                        componentClass="select"
                        name="mouseLeftFunction"
                        value={values.mouseLeftFunction}
                        onChange={onNumberInputChange}
                      >
                        {[
                          "options_none",
                          "options_enterKey",
                          "options_rightKey"
                        ].map((key, index) => (
                          <option key={key} value={index}>
                            {i18n(key)}
                          </option>
                        ))}
                      </FormControl>
                    </FormGroup>
                    <FormGroup controlId="mouseMiddleFunction">
                      <ControlLabel>
                        {i18n("options_mouseMiddleFunction")}
                      </ControlLabel>
                      <FormControl
                        componentClass="select"
                        name="mouseMiddleFunction"
                        value={values.mouseMiddleFunction}
                        onChange={onNumberInputChange}
                      >
                        {[
                          "options_none",
                          "options_enterKey",
                          "options_leftKey",
                          "options_doPaste"
                        ].map((key, index) => (
                          <option key={key} value={index}>
                            {i18n(key)}
                          </option>
                        ))}
                      </FormControl>
                    </FormGroup>
                    <FormGroup controlId="mouseWheelFunction1">
                      <ControlLabel>
                        {i18n("options_mouseWheelFunction1")}
                      </ControlLabel>
                      <FormControl
                        componentClass="select"
                        name="mouseWheelFunction1"
                        value={values.mouseWheelFunction1}
                        onChange={onNumberInputChange}
                      >
                        {[
                          "options_none",
                          "options_upDown",
                          "options_pageUpDown",
                          "options_threadLastNext"
                        ].map((key, index) => (
                          <option key={key} value={index}>
                            {i18n(key)}
                          </option>
                        ))}
                      </FormControl>
                    </FormGroup>
                    <FormGroup controlId="mouseWheelFunction2">
                      <ControlLabel>
                        {i18n("options_mouseWheelFunction2")}
                      </ControlLabel>
                      <FormControl
                        componentClass="select"
                        name="mouseWheelFunction2"
                        value={values.mouseWheelFunction2}
                        onChange={onNumberInputChange}
                      >
                        {[
                          "options_none",
                          "options_upDown",
                          "options_pageUpDown",
                          "options_threadLastNext"
                        ].map((key, index) => (
                          <option key={key} value={index}>
                            {i18n(key)}
                          </option>
                        ))}
                      </FormControl>
                    </FormGroup>
                    <FormGroup controlId="mouseWheelFunction3">
                      <ControlLabel>
                        {i18n("options_mouseWheelFunction3")}
                      </ControlLabel>
                      <FormControl
                        componentClass="select"
                        name="mouseWheelFunction3"
                        value={values.mouseWheelFunction3}
                        onChange={onNumberInputChange}
                      >
                        {[
                          "options_none",
                          "options_upDown",
                          "options_pageUpDown",
                          "options_threadLastNext"
                        ].map((key, index) => (
                          <option key={key} value={index}>
                            {i18n(key)}
                          </option>
                        ))}
                      </FormControl>
                    </FormGroup>
                  </fieldset>
                </Tab.Pane>
                <Tab.Pane eventKey="about">
                  <div>
                    <legend>
                      PttChrome
                      <small> - {i18n("about_appName_subtitle")}</small>
                      <button
                        type="button"
                        className="close"
                        onClick={onCloseClick}
                      >
                        &times;
                      </button>
                    </legend>
                    <p>{replaceI18n("about_description", replacements)}</p>
                  </div>
                  <div>
                    <legend>{i18n("about_version_title")}</legend>
                    <ul>
                      <li>
                        {replaceI18n("about_version_current", replacements)}
                      </li>
                      <li>
                        {replaceI18n("about_version_original", replacements)}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <legend>{i18n("about_new_title")}</legend>
                    <ul>
                      {i18n("about_new_content").map(text => (
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

PrefModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired
};

export default PrefModal;
