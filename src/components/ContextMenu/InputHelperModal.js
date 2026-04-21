import PropTypes from "prop-types";
import React from "react";
import {
  Modal,
  Tab,
  Row,
  Col,
  Nav,
  NavItem,
  Dropdown,
  NavDropdown,
  Checkbox,
  SplitButton
} from "../bootstrap-compat";
import ColorSpan from "../Row/WordSegmentBuilder/ColorSpan";
import { i18n } from "../../js/i18n";
import "./InputHelperModal.css";

const SYMBOLS = {
  general: [
    "，",
    "、",
    "。",
    "．",
    "？",
    "！",
    "～",
    "＄",
    "％",
    "＠",
    "＆",
    "＃",
    "＊",
    "‧",
    "；",
    "︰",
    "…",
    "‥",
    "﹐",
    "﹒",
    "˙",
    "·",
    "﹔",
    "﹕",
    "‘",
    "’",
    "“",
    "”",
    "〝",
    "〞",
    "‵",
    "′",
    "〃"
  ],

  lineBorders: [
    "├",
    "─",
    "┼",
    "┴",
    "┬",
    "┤",
    "┌",
    "┐",
    "│",
    "▕",
    "└",
    "┘",
    "╭",
    "╮",
    "╰",
    "╯",
    "╔",
    "╦",
    "╗",
    "╠",
    "═",
    "╬",
    "╣",
    "╓",
    "╥",
    "╖",
    "╒",
    "╤",
    "╕",
    "║",
    "╚",
    "╩",
    "╝",
    "╟",
    "╫",
    "╢",
    "╙",
    "╨",
    "╜",
    "╞",
    "╪",
    "╡",
    "╘",
    "╧",
    "╛"
  ],

  blocks: [
    "＿",
    "ˍ",
    "▁",
    "▂",
    "▃",
    "▄",
    "▅",
    "▆",
    "▇",
    "█",
    "▏",
    "▎",
    "▍",
    "▌",
    "▋",
    "▊",
    "▉",
    "◢",
    "◣",
    "◥",
    "◤"
  ],

  lines: [
    "﹣",
    "﹦",
    "≡",
    "｜",
    "∣",
    "∥",
    "–",
    "︱",
    "—",
    "︳",
    "╴",
    "¯",
    "￣",
    "﹉",
    "﹊",
    "﹍",
    "﹎",
    "﹋",
    "﹌",
    "﹏",
    "︴",
    "∕",
    "﹨",
    "╱",
    "╲",
    "／",
    "＼"
  ],

  special: [
    "↑",
    "↓",
    "←",
    "→",
    "↖",
    "↗",
    "↙",
    "↘",
    "㊣",
    "◎",
    "○",
    "●",
    "⊕",
    "⊙",
    "△",
    "▲",
    "☆",
    "★",
    "◇",
    "Æ",
    "□",
    "■",
    "▽",
    "▼",
    "§",
    "￥",
    "〒",
    "￠",
    "￡",
    "※",
    "♀",
    "♂"
  ],

  brackets: [
    "〔",
    "〕",
    "【",
    "】",
    "《",
    "》",
    "（",
    "）",
    "｛",
    "｝",
    "﹙",
    "﹚",
    "『",
    "』",
    "﹛",
    "﹜",
    "﹝",
    "﹞",
    "＜",
    "＞",
    "﹤",
    "﹥",
    "「",
    "」",
    "︵",
    "︶",
    "︷",
    "︸",
    "︹",
    "︺",
    "︻",
    "︼",
    "︽",
    "︾",
    "〈",
    "〉",
    "︿",
    "﹀",
    "﹁",
    "﹂",
    "﹃",
    "﹄"
  ],

  greek: [
    "Α",
    "Β",
    "Γ",
    "Δ",
    "Ε",
    "Ζ",
    "Η",
    "Θ",
    "Ι",
    "Κ",
    "Λ",
    "Μ",
    "Ν",
    "Ξ",
    "Ο",
    "Π",
    "Ρ",
    "Σ",
    "Τ",
    "Υ",
    "Φ",
    "Χ",
    "Ψ",
    "Ω",
    "α",
    "β",
    "γ",
    "δ",
    "ε",
    "ζ",
    "η",
    "θ",
    "ι",
    "κ",
    "λ",
    "μ",
    "ν",
    "ξ",
    "ο",
    "π",
    "ρ",
    "σ",
    "τ",
    "υ",
    "φ",
    "χ",
    "ψ",
    "ω"
  ],

  phonetic: [
    "ㄅ",
    "ㄆ",
    "ㄇ",
    "ㄈ",
    "ㄉ",
    "ㄊ",
    "ㄋ",
    "ㄌ",
    "ㄍ",
    "ㄎ",
    "ㄏ",
    "ㄐ",
    "ㄑ",
    "ㄒ",
    "ㄓ",
    "ㄔ",
    "ㄕ",
    "ㄖ",
    "ㄗ",
    "ㄘ",
    "ㄙ",
    "ㄚ",
    "ㄛ",
    "ㄜ",
    "ㄝ",
    "ㄞ",
    "ㄟ",
    "ㄠ",
    "ㄡ",
    "ㄢ",
    "ㄣ",
    "ㄤ",
    "ㄥ",
    "ㄦ",
    "ㄧ",
    "ㄨ",
    "ㄩ",
    "˙",
    "ˊ",
    "ˇ",
    "ˋ"
  ],

  math: [
    "╳",
    "＋",
    "﹢",
    "－",
    "×",
    "÷",
    "＝",
    "≠",
    "≒",
    "∞",
    "ˇ",
    "±",
    "√",
    "⊥",
    "∠",
    "∟",
    "⊿",
    "㏒",
    "㏑",
    "∫",
    "∮",
    "∵",
    "∴",
    "≦",
    "≧",
    "∩",
    "∪"
  ],

  hiragana: [
    "あ",
    "い",
    "う",
    "え",
    "お",
    "か",
    "き",
    "く",
    "け",
    "こ",
    "さ",
    "し",
    "す",
    "せ",
    "そ",
    "た",
    "ち",
    "つ",
    "て",
    "と",
    "な",
    "に",
    "ぬ",
    "ね",
    "の",
    "は",
    "ひ",
    "ふ",
    "へ",
    "ほ",
    "ま",
    "み",
    "む",
    "め",
    "も",
    "ら",
    "り",
    "る",
    "れ",
    "ろ",
    "が",
    "ぎ",
    "ぐ",
    "げ",
    "ご",
    "ざ",
    "じ",
    "ず",
    "ぜ",
    "ぞ",
    "だ",
    "ぢ",
    "づ",
    "で",
    "ど",
    "ば",
    "び",
    "ぶ",
    "べ",
    "ぼ",
    "ぱ",
    "ぴ",
    "ぷ",
    "ぺ",
    "ぽ",
    "や",
    "ゆ",
    "よ",
    "わ",
    "ん",
    "を"
  ],

  katakana: [
    "ア",
    "イ",
    "ウ",
    "エ",
    "オ",
    "カ",
    "キ",
    "ク",
    "ケ",
    "コ",
    "サ",
    "シ",
    "ス",
    "セ",
    "ソ",
    "タ",
    "チ",
    "ツ",
    "テ",
    "ト",
    "ナ",
    "ニ",
    "ヌ",
    "ネ",
    "ノ",
    "ハ",
    "ヒ",
    "フ",
    "ヘ",
    "ホ",
    "マ",
    "ミ",
    "ム",
    "メ",
    "モ",
    "ラ",
    "リ",
    "ル",
    "レ",
    "ロ",
    "ガ",
    "ギ",
    "グ",
    "ゲ",
    "ゴ",
    "ザ",
    "ジ",
    "ズ",
    "ゼ",
    "ゾ",
    "ダ",
    "ジ",
    "ズ",
    "デ",
    "ド",
    "バ",
    "ビ",
    "ブ",
    "ベ",
    "ボ",
    "パ",
    "ピ",
    "プ",
    "ペ",
    "ポ",
    "ヤ",
    "ユ",
    "ヨ",
    "ワ",
    "ン",
    "ヲ"
  ]
};

const EMOTICONS = {
  angry: [
    "(ノ ゜Д゜)ノ ︵ ═╩════╩═",
    "╯-____-)╯~═╩════╩═~",
    String.raw`(╭∩╮\_/╭∩╮)`,
    "( ︶︿︶)_╭∩╮",
    "( ‵□′)───C＜─___-)|||",
    "(￣ε(#￣) #○=(一-一o)",
    "(o一-一)=○# (￣#)3￣)",
    "╰(‵皿′＊)╯",
    "○(#‵︿′ㄨ)○",
    "◢▆▅▄▃-崩╰(〒皿〒)╯潰-▃▄▅▆◣"
  ],

  meh: [
    "(σ′▽‵)′▽‵)σ 哈哈哈哈～你看看你",
    "( ￣ c￣)y▂ξ",
    "( ′-`)y-～",
    "′_>‵",
    "╮(′～‵〞)╭",
    '╮(﹀_﹀")╭',
    "︿(￣︶￣)︿",
    "..╮(﹋﹏﹌)╭..",
    "╮(╯_╰)╭",
    "╮(╯▽╰)/"
  ],

  sweat: [
    "(－^－)ｄ",
    "(￣￣；)",
    "(￣□￣|||)a",
    "(●；－_－)●",
    "￣▽￣||",
    "╭ ﹀◇﹀〣",
    "ˋ(′_‵||)ˊ",
    "●( ¯▽¯；●",
    "o(＞＜；)o o"
  ],

  happy: [
    "~(￣▽￣)~(＿△＿)~(￣▽￣)~(＿△＿)~(￣▽￣)~",
    "(~^O^~)",
    "(∩_∩)",
    "<(￣︶￣)>",
    "v(￣︶￣)y",
    "﹨(╯▽╰)∕",
    String.raw`\(@^0^@)/`,
    String.raw`\(^▽^)/`,
    String.raw`\⊙▽⊙/`
  ],

  other: [
    "(．＿．?)",
    "(？o？)",
    "(‧Q‧)",
    "〒△〒",
    "m川@.川m",
    "(¯(∞)¯)",
    "(⊙o⊙)",
    "(≧<>≦)",
    "(☆_☆)",
    'o(‧"‧)o'
  ]
};

const COLOR_OPTIONS = Array.from({ length: 16 }, (_, index) => ({
  fg: index,
  bg: index < 8 ? index : undefined
}));

function sendColorCommand({ fg, bg, isBlink }, onCmdSend, type) {
  let lightColor = "0;";
  if (fg > 7) {
    fg %= 8;
    lightColor = "1;";
  }
  fg += 30;
  bg += 40;
  let blink = "";
  if (isBlink) {
    blink = "5;";
  }
  let cmd = "\x15[";
  if (type == "foreground") {
    cmd += lightColor + blink + fg + "m";
  } else if (type == "background") {
    cmd += bg + "m";
  } else {
    cmd += lightColor + blink + fg + ";" + bg + "m";
  }
  onCmdSend(cmd);
}

export const InputHelperModal = ({
  show,
  onReset,
  onHide,
  onCmdSend,
  onConvSend
}) => {
  const [fg, setFg] = React.useState(7);
  const [bg, setBg] = React.useState(0);
  const [isBlink, setIsBlink] = React.useState(false);

  const onColorClick = ({
    currentTarget: {
      dataset: { fg: nextFg }
    }
  }) => {
    setFg(Number.parseInt(nextFg, 10));
  };

  const onColorContextMenu = event => {
    const {
      currentTarget: { dataset }
    } = event;

    event.preventDefault();
    event.stopPropagation();
    setBg("bg" in dataset ? Number.parseInt(dataset.bg, 10) : bg);
  };

  const onBlinkChange = ({ target: { checked } }) => {
    setIsBlink(checked);
  };

  const onSendClick = () => {
    sendColorCommand({ fg, bg, isBlink }, onCmdSend);
  };

  const onSendSelect = eventKey => {
    sendColorCommand({ fg, bg, isBlink }, onCmdSend, eventKey);
  };

  const onSymEmoClick = ({
    currentTarget: {
      dataset: { value }
    }
  }) => {
    onConvSend(value);
  };

  const onMouseDown = ({ currentTarget: { dataset }, clientX, clientY }) => {
    dataset.dragActive = true;
    dataset.dragLastX = clientX;
    dataset.dragLastY = clientY;
  };

  const onMouseMove = ({
    currentTarget: { dataset, style },
    clientX,
    clientY
  }) => {
    if (dataset.dragActive === "true") {
      const nextTop =
        (Number.parseFloat(style.top) || 0) +
        clientY -
        (Number.parseFloat(dataset.dragLastY || "0") || 0);
      const nextLeft =
        (Number.parseFloat(style.left) || 0) +
        clientX -
        (Number.parseFloat(dataset.dragLastX || "0") || 0);

      globalThis.getSelection().removeAllRanges();
      style.cssText += `
        top:${nextTop}px;
        left:${nextLeft}px;
      `;
      dataset.dragLastX = clientX;
      dataset.dragLastY = clientY;
    }
  };

  const onMouseUp = ({ currentTarget: { dataset } }) => {
    dataset.dragActive = false;
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      backdrop={false}
      className="InputHelperModal__Dialog"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <Modal.Header closeButton onHide={onHide}>
        <Modal.Title>{i18n("inputHelperTitle")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tab.Container defaultActiveKey="colors">
          <Row className="clearfix">
            <Col sm={12}>
              <Nav bsStyle="tabs">
                <NavItem eventKey="colors">{i18n("colorTitle")}</NavItem>
                <NavDropdown
                  id="input-helper-symbols-dropdown"
                  eventKey="symbols"
                  title={i18n("symTitle")}
                >
                  {Object.keys(SYMBOLS).map(group => (
                    <NavDropdown.Item key={group} eventKey={`symbols.${group}`}>
                      {i18n(`symTitle_${group}`)}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
                <NavDropdown
                  id="input-helper-emoticons-dropdown"
                  eventKey="emoticons"
                  title={i18n("emoTitle")}
                >
                  {Object.keys(EMOTICONS).map(group => (
                    <NavDropdown.Item
                      key={group}
                      eventKey={`emoticons.${group}`}
                    >
                      {i18n(`emoTitle_${group}`)}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              </Nav>
            </Col>
            <Col sm={12}>
              <Tab.Content animation>
                <Tab.Pane eventKey="colors">
                  <Row>
                    <Col xs={12} sm={7}>
                      <ul className="InputHelperModal__ColorList">
                        {COLOR_OPTIONS.map(color => (
                          <li key={color.fg}>
                            <button
                              type="button"
                              className={`InputHelperModal__ColorButton b${color.fg}`}
                              onClick={onColorClick}
                              onContextMenu={onColorContextMenu}
                              data-fg={color.fg}
                              data-bg={color.bg}
                              aria-label={`${i18n("colorTitle")} ${color.fg}`}
                            />
                          </li>
                        ))}
                      </ul>
                    </Col>
                    <Col xs={12} sm={5}>
                      {i18n("colorHelperTooltip1")}
                      <br />
                      {i18n("colorHelperTooltip2")}
                    </Col>
                  </Row>
                  <div className="InputHelperModal__Preview">
                    <ColorSpan
                      className="InputHelperModal__Preview__Content"
                      colorState={{
                        fg,
                        bg,
                        blink: isBlink
                      }}
                      inner={i18n("colorHelperPreview")}
                    />
                  </div>
                  <Row>
                    <Col xs={4}>
                      <Checkbox checked={isBlink} onChange={onBlinkChange}>
                        {i18n("colorHelperBlink")}
                      </Checkbox>
                    </Col>
                    <Col
                      xs={8}
                      className="InputHelperModal__SendButtonContainer"
                    >
                      <SplitButton
                        id="input-helper-send-button"
                        title={i18n("colorHelperSend")}
                        onClick={onSendClick}
                      >
                        <Dropdown.Item onClick={() => onSendSelect("foreground")}>
                          {i18n("colorHelperSendMenuFore")}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onSendSelect("background")}>
                          {i18n("colorHelperSendMenuBack")}
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={onReset}>
                          {i18n("colorHelperSendMenuReset")}
                        </Dropdown.Item>
                      </SplitButton>
                    </Col>
                  </Row>
                </Tab.Pane>
                {Object.keys(SYMBOLS).map(group => (
                  <Tab.Pane key={group} eventKey={`symbols.${group}`}>
                    <ul className="InputHelperModal__SymbolList">
                      {SYMBOLS[group].map(it => (
                        <li key={`${group}-${it}`}>
                          <button
                            type="button"
                            className="InputHelperModal__SymbolButton"
                            onClick={onSymEmoClick}
                            data-value={it}
                          >
                            {it}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Tab.Pane>
                ))}
                {Object.keys(EMOTICONS).map(group => (
                  <Tab.Pane key={group} eventKey={`emoticons.${group}`}>
                    <ul className="InputHelperModal__EmoticonList">
                      {EMOTICONS[group].map(it => (
                        <li key={`${group}-${it}`}>
                          <button
                            type="button"
                            className="InputHelperModal__EmoticonButton"
                            onClick={onSymEmoClick}
                            data-value={it}
                          >
                            {it}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Tab.Pane>
                ))}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Modal.Body>
    </Modal>
  );
};

InputHelperModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onReset: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
  onCmdSend: PropTypes.func.isRequired,
  onConvSend: PropTypes.func.isRequired
};

export default InputHelperModal;
