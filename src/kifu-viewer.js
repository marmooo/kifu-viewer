class KifuViewer {
  constructor(board, options) {
    this.board = board;
    this.canvas = document.createElement("canvas").getContext("2d");
    this.canvas.font = "22px YuMincho, Hiragino Mincho ProN, MS Mincho, serif";
    this.options = options || {};
    if (!this.options.buttons) this.options.buttons = "default";
    if (!this.options.keybinds) this.options.keybinds = this.board.parentNode;
    if (!this.options.comment) this.options.comment = null;
    if (!this.options.start) this.options.start = 0;
    if (!this.options.reverse) this.options.reverse = false;
    if (!this.options.onMove) this.options.onMove = () => {};
  }

  defaultButtons() {
    return `
<div class='kifu-viewer-buttons mb-2' style='text-align:center;'>
<button class='kifu-viewer-first material-icons btn btn-lg btn-outline-secondary'>first_page</button>
<button class='kifu-viewer-prev material-icons btn btn-lg btn-outline-secondary'>chevron_left</button>
<button class='kifu-viewer-next material-icons btn btn-lg btn-outline-secondary'>chevron_right</button>
<button class='kifu-viewer-last material-icons btn btn-lg btn-outline-secondary'>last_page</button>
<button class='kifu-viewer-reverse material-icons btn btn-lg btn-outline-secondary'>autorenew</button>
</div>`;
  }

  defaultKeybinds(event) {
    switch (event.key) {
      case "ArrowUp":
        this.first();
        break;
      case "ArrowDown":
        this.last();
        break;
      case "ArrowLeft":
        this.prev();
        break;
      case "ArrowRight":
        this.next();
        break;
    }
  }

  loadKeybinds() {
    // https://allyjs.io/data-tables/focusable.html
    // <svg tabindex="-1"> は効かないケースがあるので親ノードに対して適用
    this.keybinds = (event) => { this.defaultKeybinds(event) };
    this.options.keybinds.addEventListener("keydown", this.keybinds);
  }

  removeKeybinds() {
    this.options.keybinds.removeEventListener("keydown", this.keybinds);
  }

  loadButtons() {
    if (this.options.buttons == "none") return;
    if (this.options.buttons == "default") {
      this.board.insertAdjacentHTML("afterend", this.defaultButtons());
      this.options.buttons = this.board.nextElementSibling;
    }
    [...this.options.buttons.getElementsByClassName("kifu-viewer-first")]
      .forEach((e) => {
        e.addEventListener("click", () => {
          this.first();
        });
      });
    [...this.options.buttons.getElementsByClassName("kifu-viewer-prev")]
      .forEach((e) => {
        e.addEventListener("click", () => {
          this.prev();
        });
      });
    [...this.options.buttons.getElementsByClassName("kifu-viewer-next")]
      .forEach((e) => {
        e.addEventListener("click", () => {
          this.next();
        });
      });
    [...this.options.buttons.getElementsByClassName("kifu-viewer-last")]
      .forEach((e) => {
        e.addEventListener("click", () => {
          this.last();
        });
      });
    [...this.options.buttons.getElementsByClassName("kifu-viewer-reverse")]
      .forEach((e) => {
        e.addEventListener("click", () => {
          this.reverse();
        });
      });
  }

  // fetch は IE 非対応かつ UTF-8 以外に非対応 (棋譜は Shift_JIS が多い)
  get(url, charset, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.timeout = 60000;
    xhr.onloadend = () => {
      callback(xhr.responseText);
    };
    xhr.overrideMimeType("text/plain; charset=" + charset);
    xhr.send();
  }

  load(url, charset, callback = () => {}) {
    charset = charset || "UTF-8"; // or Shift_JIS
    this.get(url, charset, (str) => {
      this.data = KifuViewer.KIF解析(str);
      this.data.手数 = KifuViewer.手数正規化(this.options.start, this.data.総手数);
      this.data.全局面 = KifuViewer.全局面構築(this.data.全指し手, this.data.初期局面);
      this.局面描画(this.data.手数, this.data.手数);
      callback(this.data);
    });
    this.loadButtons();
    this.loadKeybinds();
  }

  loadString(str, callback = () => {}) {
    this.data = KifuViewer.KIF解析(str);
    this.data.手数 = KifuViewer.手数正規化(this.options.start, this.data.総手数);
    this.data.全局面 = KifuViewer.全局面構築(this.data.全指し手, this.data.初期局面);
    this.局面描画(this.data.手数, this.data.手数);
    this.loadButtons();
    this.loadKeybinds();
    callback(this.data);
  }

  static 手数正規化(手数, 総手数) {
    if (!手数 || !総手数) {
      return 0;
    }
    if (手数 < 0) {
      手数 = 総手数 + 手数 + 1;
    }
    if (手数 > 総手数) {
      return 総手数;
    }
    return 手数;
  }

  static 全局面構築(指し手一覧, 初期局面) {
    const 全局面 = [];
    for (let i = 0; i < 指し手一覧.length; i++) {
      全局面[i] = [初期局面];
      for (let j = 1; j < 指し手一覧[i].length; j++) {
        全局面[i].push(KifuViewer.全局面構築.各局面(指し手一覧[i][j], 全局面[i][j - 1]));
      }
    }
    return 全局面;
  }

  static KIF解析(kif) {
    const 解析結果 = {};
    const 一次解析 = { 局面図: [], 解析: [] };

    kif = kif.split(/\r?\n/);

    for (let i = 0; i < kif.length; i++) {
      kif[i] = kif[i].trim();
      if (kif[i].indexOf("#") === 0) {
        continue;
      } else if (kif[i].indexOf("|") === 0) {
        一次解析.局面図.push(kif[i]);
      } else if (kif[i].indexOf("：") > -1) {
        const info = kif[i].split("："); //手抜き
        一次解析[info[0]] = info[1];
      } else if (kif[i].indexOf("**Engines") === 0) {
        一次解析.解析済み = true;
      } else if (kif[i] === "後手番" || kif[i] === "上手番") {
        一次解析.開始手番 = "後手";
      } else if (kif[i] === "先手番" || kif[i] === "下手番") {
        一次解析.開始手番 = "先手";
      } else if (kif[i].match(/手数＝\d/)) { // 局面図の最終手
        一次解析.最終手 = kif[i];
      } else if (kif[i].match(/^[1\*]/)) {
        一次解析.指し手 = kif.slice(i);
        break;
      }
    }

    解析結果.先手名 = 一次解析.先手 || 一次解析.下手 || "";
    解析結果.後手名 = 一次解析.後手 || 一次解析.上手 || "";
    解析結果.開始手番 = KifuViewer.KIF解析.開始手番(一次解析.開始手番, 一次解析.手合割);
    解析結果.最終手 = KifuViewer.KIF解析.最終手(一次解析.最終手);
    解析結果.手合割 = KifuViewer.KIF解析.手合割(一次解析.手合割);
    解析結果.評価値 = (一次解析.解析済み) ? KifuViewer.KIF解析.評価値(一次解析.指し手) : [];
    解析結果.読み筋 = (一次解析.解析済み) ? KifuViewer.KIF解析.読み筋(一次解析.指し手) : ["-"];
    解析結果.初期局面 = {
      "駒": KifuViewer.KIF解析.局面図(一次解析.局面図, 解析結果.手合割),
      "先手の持駒": KifuViewer.KIF解析.持駒(一次解析.先手の持駒 || 一次解析.下手の持駒),
      "後手の持駒": KifuViewer.KIF解析.持駒(一次解析.後手の持駒 || 一次解析.上手の持駒),
    };
    解析結果.全指し手 = KifuViewer.KIF解析.指し手(一次解析.指し手, 解析結果.開始手番);
    解析結果.総手数 = 解析結果.全指し手[0].length - 1;
    解析結果.変化 = 0;

    return 解析結果;
  }

  static オブジェクトコピー(from) {
    const to = Array.isArray(from) ? [] : {};
    for (const key in from) {
      to[key] = (from[key] instanceof Object)
        ? KifuViewer.オブジェクトコピー(from[key])
        : from[key];
    }
    return to;
  }

  static 局面停止状態(指し手) { // 初期局面/終局局面
    return (指し手.駒 == "終") ? true : false;
  }

  static svg(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  static svgText(x, y, fontSize, text, textAnchor) {
    const node = KifuViewer.svg("text");
    node.setAttribute("x", x);
    node.setAttribute("y", y);
    node.setAttribute("font-size", fontSize);
    node.setAttribute(
      "font-family",
      "YuMincho, Hiragino Mincho ProN, MS Mincho, serif",
    );
    node.setAttribute("text-anchor", textAnchor);
    node.textContent = text;
    return node;
  }

  static svgLine(x1, y1, x2, y2) {
    const node = KifuViewer.svg("line");
    node.setAttribute("x1", x1);
    node.setAttribute("x2", x2);
    node.setAttribute("y1", y1);
    node.setAttribute("y2", y2);
    node.setAttribute("stroke", "#000");
    node.setAttribute("stroke-width", 1);
    return node;
  }

  static svgRect(x, y, width, height) {
    const rect = KifuViewer.svg("rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    return rect;
  }

  指し手表示(redraw, 指し手) {
    let 指し手文言;
    if (指し手.手数 == 0) {
      指し手文言 = "開始局面";
    } else {
      const 手番 = 指し手.手番 === "▲" ? "☗" : "☖";
      指し手文言 = 指し手.手数 + "手目  " + 手番 + 指し手.手;
    }
    if (redraw) {
      this.board.childNodes[1].textContent = 指し手文言;
    } else {
      this.board.appendChild(KifuViewer.svgText(15, 530, 17, 指し手文言, "center"));
    }
  }

  持駒計算(手番ごとの持駒) {
    let 持駒 = "";
    for (const 駒 in 手番ごとの持駒) {
      if (手番ごとの持駒[駒] != 0) {
        if (持駒 != "") {
          持駒 += " ";
        }
        持駒 += 駒 + 手番ごとの持駒[駒];
      }
    }
    if (持駒 == "") {
      return "なし";
    } else {
      return 持駒;
    }
  }

  持駒表示(redraw, 局面, 反転) {
    const 先手持駒 = this.持駒計算(局面.先手の持駒);
    const 後手持駒 = this.持駒計算(局面.後手の持駒);
    const 上持駒 = 反転 ? 先手持駒 : 後手持駒;
    const 下持駒 = 反転 ? 後手持駒 : 先手持駒;

    if (redraw) {
      this.board.childNodes[2].firstChild.textContent = 上持駒;
      this.board.childNodes[3].firstChild.textContent = 下持駒;
    } else {
      const white = KifuViewer.svgText(0, 0, 21, 上持駒, "left");
      white.setAttribute("transform", "translate(15, 53)");
      const black = KifuViewer.svgText(0, 0, 21, 下持駒, "left");
      black.setAttribute("transform", "translate(15, 500)");
      this.board.appendChild(white);
      this.board.appendChild(black);
    }
  }

  局面描画(前手数, 手数) {
    this.data.手数 = 手数;
    const 局面 = this.data.全局面[this.data.変化][手数];
    const 指し手 = this.data.全指し手[this.data.変化][手数];
    const 前指し手 = this.data.全指し手[this.data.変化][前手数];
    const 反転 = this.options.reverse;

    if (this.board.childNodes.length > 0) { // キャッシュ描画
      this.指し手表示(true, 指し手);
      this.持駒表示(true, 局面, 反転);
      this.駒配置(true, 局面, 反転, 指し手, 前指し手);
      this.評価値表示(true, this.data.評価値[手数], 指し手);
    } else { // 初期描画
      this.将棋盤描画();
      this.指し手表示(false, 指し手);
      this.持駒表示(false, 局面, 反転);
      this.指し手強調(false, 0, 0);
      this.駒配置(false, 局面, 反転, 指し手, 前指し手);
      this.符号表示(false, 反転);
      this.上下名称表示(false, 反転);
      this.評価値表示(false, this.data.評価値[手数], 指し手);
      this.showAttribution();
    }
    this.コメント表示(指し手.コメント);
  }

  コメント表示(text) {
    if (this.options.comment) {
      this.options.comment.innerHTML = text;
    }
  }

  指し手初期化() {
    const rect = this.board.childNodes[4];
    rect.setAttribute("fill", "none");
  }

  指し手強調(redraw, x, y) {
    if (redraw) {
      const rect = this.board.childNodes[4];
      rect.setAttribute("transform", `translate(${x}, ${y})`);
    } else {
      const rect = KifuViewer.svgRect(x, y, 40, 40);
      rect.setAttribute("fill", "none");
      this.board.appendChild(rect);
    }
  }

  駒配置(redraw, 局面, 反転, 指し手, 前指し手) {
    let pieces;
    if (redraw) {
      pieces = this.board.childNodes[5];
    } else {
      pieces = KifuViewer.svg("g");
      this.board.appendChild(pieces);
    }
    if (前指し手 && Math.abs(指し手.手数 - 前指し手.手数) == 1) { // 差分描画 prev/next/first/last
      if (指し手.手数 < 前指し手.手数) { // prev/first
        if (KifuViewer.局面停止状態(前指し手)) return;
        if (前指し手.前X != 0) { // 駒台からの着手以外
          this.駒描画(
            redraw,
            pieces,
            局面.駒[前指し手.前Y][前指し手.前X],
            前指し手.前X,
            前指し手.前Y,
            false,
            反転,
          );
        }
        this.駒描画(
          redraw,
          pieces,
          局面.駒[前指し手.後Y][前指し手.後X],
          前指し手.後X,
          前指し手.後Y,
          false,
          反転,
        );
      } else { // next/last
        if (KifuViewer.局面停止状態(指し手)) return;
        if (前指し手.手数 >= 1) {
          this.駒描画(
            redraw,
            pieces,
            局面.駒[前指し手.後Y][前指し手.後X],
            前指し手.後X,
            前指し手.後Y,
            false,
            反転,
          );
        }
      }
      if (指し手.手数 == 0) {
        this.指し手初期化();
      } else {
        if (指し手.前X != 0) { // 駒台からの着手以外
          this.駒描画(
            redraw,
            pieces,
            局面.駒[指し手.前Y][指し手.前X],
            指し手.前X,
            指し手.前Y,
            false,
            反転,
          );
        }
        this.駒描画(
          redraw,
          pieces,
          局面.駒[指し手.後Y][指し手.後X],
          指し手.後X,
          指し手.後Y,
          true,
          反転,
        );
      }
    } else { // 再描画 reverse/first/last
      if (this.data.最終手) { // 局面図からの読込
        const 後X = this.data.最終手[0];
        const 後Y = this.data.最終手[1];
        for (const y in 局面.駒) {
          for (const x in 局面.駒[y]) {
            let 最終手 = false;
            if ((x == 後X) && (y == 後Y)) {
              最終手 = true;
            }
            this.駒描画(redraw, pieces, 局面.駒[y][x], x, y, 最終手, 反転);
          }
        }
      } else { // 通常の棋譜
        for (const y in 局面.駒) {
          for (const x in 局面.駒[y]) {
            let 最終手 = false;
            if ((x == 指し手.後X) && (y == 指し手.後Y)) {
              最終手 = true;
            }
            this.駒描画(redraw, pieces, 局面.駒[y][x], x, y, 最終手, 反転);
          }
        }
      }
    }
  }

  駒描画(redraw, pieces, 駒, x, y, 最終手, 反転) {
    //筋を反転
    x = 10 - x;
    if (!駒) {
      駒 = "";
    }
    if (反転) {
      x = 10 - x;
      y = 10 - y;
      駒 = (駒.match("_")) ? 駒.replace("_", "") : 駒 + "_";
    }

    let 文字 = 駒;
    if (駒.match("_")) {
      文字 = 駒.replace("_", "");
    }
    const 筋 = (40 * x) - 40 + 32;
    const 段 = (40 * y) - 40 + 94;

    if (最終手) {
      const rect = this.board.childNodes[4];
      rect.setAttribute("fill", "#111111");
      this.指し手強調(true, 筋 - 20, 段 - 16);
    }

    let piece;
    if (redraw) {
      const pos = 反転 ? 80 - 9 * y + x : 9 * y - x;
      piece = pieces.childNodes[pos];
      piece.textContent = 文字;
    } else {
      piece = KifuViewer.svgText(0, 0, 31, 文字, "middle");
      piece.setAttribute("dy", 16);
      pieces.appendChild(piece);
    }
    if (駒.match("_")) { //後手
      piece.setAttribute(
        "transform",
        `translate(${筋}, ${段 + 8}) scale(-1, -1)`,
      );
    } else { //先手
      piece.setAttribute("transform", `translate(${筋}, ${段})`);
    }
    if (最終手) {
      piece.setAttribute("fill", "#fff");
    } else {
      piece.setAttribute("fill", "#000");
    }
  }

  盤外表示() {
    const rect = KifuViewer.svgRect(0, 58, 395, 390);
    rect.setAttribute("touch-action", "manipulation");
    rect.setAttribute("fill", "#FFE084");
    return rect;
  }

  盤枠表示() {
    const rect = KifuViewer.svgRect(12, 77, 360, 360);
    rect.setAttribute("fill", "#FFE084");
    rect.setAttribute("stroke", "#000");
    rect.setAttribute("stroke-width", 2);
    rect.setAttribute("id", "ban");
    return rect;
  }

  showAttribution() {
    const link = KifuViewer.svg("a");
    link.setAttribute("href", "https://marmooo.github.io/kifu-viewer/");
    const text = KifuViewer.svgText(300, 500, 17, "KifuViewer", "left");
    text.setAttribute("text-decoration", "underline");
    link.appendChild(text);
    this.board.appendChild(link);
  }

  名称表示サイズ(text) {
    const width = this.canvas.measureText(text).width;
    const fontSize = (width < 395) ? 22 : width / text.length;
    return fontSize;
  }

  上下名称表示(redraw, 反転) {
    const 先手名 = (this.data.先手名 == "") ? "先手" : this.data.先手名;
    const 後手名 = (this.data.後手名 == "") ? "後手" : this.data.後手名;
    const 上名称 = 反転 ? "☗" + 先手名 : "☖" + 後手名;
    const 下名称 = 反転 ? "☖" + 後手名 : "☗" + 先手名;
    const 上サイズ = this.名称表示サイズ(上名称);
    const 下サイズ = this.名称表示サイズ(下名称);
    if (redraw) {
      const gChildNodes = this.board.childNodes[7].childNodes;
      gChildNodes[0].textContent = 上名称;
      gChildNodes[1].textContent = 下名称;
      gChildNodes[0].setAttribute("font-size", 上サイズ);
      gChildNodes[1].setAttribute("font-size", 下サイズ);
    } else {
      const g = KifuViewer.svg("g");
      this.board.appendChild(g);
      g.appendChild(KifuViewer.svgText(10, 23, 上サイズ, 上名称, "left"));
      g.appendChild(KifuViewer.svgText(10, 470, 下サイズ, 下名称, "left"));
    }
  }

  評価値表示(redraw, 評価値, 指し手) {
    let 評価値文言 = "評価値  -";
    if ((指し手 !== undefined) && (指し手 !== "投了") && (評価値 !== undefined)) {
      let 情勢 = "";
      if (評価値.match("詰")) {
        情勢 = "勝勢";
      } else {
        const 評価値数値 = 評価値.replace("-", "");
        if ((0 <= 評価値数値) && (評価値数値 <= 300)) {
          情勢 = "互角";
        } else if ((301 <= 評価値数値) && (評価値数値 <= 800)) {
          情勢 = "有利";
        } else if ((801 <= 評価値数値) && (評価値数値 <= 1500)) {
          情勢 = "優勢";
        } else if (1501 <= 評価値数値) {
          情勢 = "勝勢";
        } else {
          情勢 = "";
        }
      }

      let 先手後手;
      if (評価値.match("-")) {
        先手後手 = "☖後手";
      } else {
        先手後手 = "☗先手";
      }
      if (情勢 == "互角") {
        先手後手 = "";
      }
      評価値文言 = "評価値  " + 先手後手 + 情勢 + "(" + 評価値 + ")";
    }
    if (redraw) {
      this.board.childNodes[8].textContent = 評価値文言;
    } else {
      this.board.appendChild(KifuViewer.svgText(215, 530, 17, 評価値文言, "left"));
    }
  }

  枡目表示() {
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= 8; i++) {
      fragment.appendChild(
        KifuViewer.svgLine(12 + 40 * i, 77.5, 12 + 40 * i, 360 + 77.5),
      );
      fragment.appendChild(
        KifuViewer.svgLine(12, 77.5 + 40 * i, 370, 77.5 + 40 * i),
      );
    }
    return fragment;
  }

  符号表示(redraw, 反転) {
    let textN = ["１", "２", "３", "４", "５", "６", "７", "８", "９"];
    let textK = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
    if (反転) {
      textN = ["９", "８", "７", "６", "５", "４", "３", "２", "１"];
      textK = ["九", "八", "七", "六", "五", "四", "三", "二", "一"];
    }
    if (redraw) {
      const gChildNodes = this.board.childNodes[6].childNodes;
      for (let i = 0; i <= 8; i += 1) {
        gChildNodes[i * 2].textContent = textN[i];
        gChildNodes[i * 2 + 1].textContent = textK[i];
      }
    } else {
      const g = KifuViewer.svg("g");
      this.board.appendChild(g);
      for (let i = 0; i <= 8; i++) {
        g.appendChild(
          KifuViewer.svgText(355 - 40 * i, 73, 14, textN[i], "middle"),
        );
        g.appendChild(
          KifuViewer.svgText(386, 100 + 40 * i, 14, textK[i], "middle"),
        );
      }
    }
  }

  将棋盤描画() {
    const g = KifuViewer.svg("g");
    this.board.appendChild(g);
    g.appendChild(this.盤外表示());
    g.appendChild(this.盤枠表示());
    g.appendChild(this.枡目表示());
  }

  first() {
    this.指し手初期化();
    this.局面描画(this.data.手数, 0);
    this.options.onMove(this.data);
  }

  prev() {
    if (this.data.手数 > 0) {
      this.局面描画(this.data.手数, this.data.手数 - 1);
      this.options.onMove(this.data);
    }
  }

  next() {
    const 変化総手数 = this.data.全指し手[this.data.変化].length - 1;
    if (this.data.手数 < 変化総手数) {
      this.局面描画(this.data.手数, this.data.手数 + 1);
      this.options.onMove(this.data);
    }
  }

  last() {
    const 変化総手数 = this.data.全指し手[this.data.変化].length - 1;
    this.局面描画(this.data.手数, 変化総手数);
    this.options.onMove(this.data);
  }

  reverse() {
    this.options.reverse = !this.options.reverse;
    this.符号表示(true, this.options.reverse);
    this.上下名称表示(true, this.options.reverse);
    this.局面描画(this.data.手数, this.data.手数);
  }
}

KifuViewer.全局面構築.各局面 = function (指し手, 前局面) {
  // 指し手 = {'手数','手番','手','駒','前X','前Y','後X','後Y','成り'};

  const 局面 = KifuViewer.オブジェクトコピー(前局面);
  if (KifuViewer.局面停止状態(指し手)) return 局面;

  const 手番 = (指し手.手番 === "▲") ? "先手" : "後手";
  const 成変換 = { "歩": "と", "香": "杏", "桂": "圭", "銀": "全", "角": "馬", "飛": "龍" };
  const 逆変換 = { "と": "歩", "杏": "香", "圭": "桂", "全": "銀", "馬": "角", "龍": "飛" };
  let 駒 = 指し手.駒;

  if (指し手.前X !== 0) { //駒を移動する場合
    局面.駒[指し手.前Y][指し手.前X] = null;
    if (指し手.成り) {
      駒 = (駒 in 成変換) ? 成変換[駒] : 駒;
    }
    //駒を取る場合
    if (局面.駒[指し手.後Y][指し手.後X]) {
      let 取った駒 = 局面.駒[指し手.後Y][指し手.後X].replace("_", "");
      取った駒 = (取った駒 in 逆変換) ? 逆変換[取った駒] : 取った駒;
      局面[手番 + "の持駒"][取った駒]++;
    }
  } else { //駒を打つ場合
    局面[手番 + "の持駒"][駒]--;
  }
  if (手番 === "後手") {
    駒 += "_";
  }
  局面.駒[指し手.後Y][指し手.後X] = 駒;
  return 局面;
};

KifuViewer.KIF解析.開始手番 = function (kif開始手番, kif手合割) {
  if (kif開始手番) {
    return kif開始手番;
  }
  if (kif手合割 && kif手合割 !== "平手") {
    return "後手";
  }
  return "先手";
};

KifuViewer.KIF解析.最終手 = function (最終手) {
  if (!最終手) {
    return;
  }
  const 解析 = 最終手.match(/([１２３４５６７８９])(.)/);
  if (解析) {
    const 全数字 = {
      "１": "1",
      "２": "2",
      "３": "3",
      "４": "4",
      "５": "5",
      "６": "6",
      "７": "7",
      "８": "8",
      "９": "9",
    };
    const 漢数字 = {
      "一": "1",
      "二": "2",
      "三": "3",
      "四": "4",
      "五": "5",
      "六": "6",
      "七": "7",
      "八": "8",
      "九": "9",
    };
    return 全数字[解析[1]] + 漢数字[解析[2]];
  } else {
    return; // 着手のない局面図
  }
};

KifuViewer.KIF解析.手合割 = function (kif手合割) {
  const 手合割 = [
    "香落ち",
    "右香落ち",
    "角落ち",
    "飛車落ち",
    "飛香落ち",
    "二枚落ち",
    "三枚落ち",
    "四枚落ち",
    "五枚落ち",
    "左五枚落ち",
    "六枚落ち",
    "八枚落ち",
    "十枚落ち",
    "その他",
  ];
  return (手合割.indexOf(kif手合割) >= 0) ? kif手合割 : null; // "平手"はnullになる
};

KifuViewer.KIF解析.局面図 = function (kif局面図, 手合割) {
  if (kif局面図.length !== 9) {
    return (手合割) ? KifuViewer.KIF解析.局面図.手合割(手合割) : KifuViewer.KIF解析.局面図.平手();
  }

  const 局面 = KifuViewer.KIF解析.局面図.駒無し();
  let 先手 = true;
  let x = 10;
  const 変換 = { "王": "玉", "竜": "龍" };

  for (let y = 0; y < 9; y++) {
    x = 10;
    const str = kif局面図[y];
    for (let i = 1; i < str.length; i++) {
      if (str[i] === " ") {
        先手 = true;
        x -= 1;
        continue;
      } else if (str[i] === "v") {
        先手 = false;
        x -= 1;
        continue;
      } else if (str[i] === "|") {
        break;
      } else if (str[i] === "・") {
        continue;
      }
      let 駒 = str[i];
      駒 = (駒 in 変換) ? 変換[駒] : 駒;
      局面[y + 1][x] = (先手) ? 駒 : 駒 + "_";
    }
  }
  return 局面;
};

KifuViewer.KIF解析.局面図.平手 = function () {
  return {
    "1": {
      "9": "香_",
      "8": "桂_",
      "7": "銀_",
      "6": "金_",
      "5": "玉_",
      "4": "金_",
      "3": "銀_",
      "2": "桂_",
      "1": "香_",
    },
    "2": {
      "9": null,
      "8": "飛_",
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": "角_",
      "1": null,
    },
    "3": {
      "9": "歩_",
      "8": "歩_",
      "7": "歩_",
      "6": "歩_",
      "5": "歩_",
      "4": "歩_",
      "3": "歩_",
      "2": "歩_",
      "1": "歩_",
    },
    "4": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
    "5": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
    "6": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
    "7": {
      "9": "歩",
      "8": "歩",
      "7": "歩",
      "6": "歩",
      "5": "歩",
      "4": "歩",
      "3": "歩",
      "2": "歩",
      "1": "歩",
    },
    "8": {
      "9": null,
      "8": "角",
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": "飛",
      "1": null,
    },
    "9": {
      "9": "香",
      "8": "桂",
      "7": "銀",
      "6": "金",
      "5": "玉",
      "4": "金",
      "3": "銀",
      "2": "桂",
      "1": "香",
    },
  };
};

KifuViewer.KIF解析.局面図.駒無し = function () {
  return {
    "1": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
    "2": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
    "3": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
    "4": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
    "5": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
    "6": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
    "7": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
    "8": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
    "9": {
      "9": null,
      "8": null,
      "7": null,
      "6": null,
      "5": null,
      "4": null,
      "3": null,
      "2": null,
      "1": null,
    },
  };
};

KifuViewer.KIF解析.局面図.手合割 = function (手合割) {
  const 局面 = KifuViewer.KIF解析.局面図.平手();
  switch (手合割) {
    case "香落ち":
      局面[1][1] = null;
      return 局面;
    case "右香落ち":
      局面[1][9] = null;
      return 局面;
    case "角落ち":
      局面[2][2] = null;
      return 局面;
    case "飛車落ち":
      局面[2][8] = null;
      return 局面;
    case "飛車香落ち":
      局面[1][1] = null;
      局面[2][8] = null;
      return 局面;
    case "二枚落ち":
      局面[2][2] = null;
      局面[2][8] = null;
      return 局面;
    case "三枚落ち":
      局面[1][1] = null;
      局面[2][2] = null;
      局面[2][8] = null;
      return 局面;
    case "四枚落ち":
      局面[1][1] = null;
      局面[1][9] = null;
      局面[2][2] = null;
      局面[2][8] = null;
      return 局面;
    case "五枚落ち":
      局面[1][1] = null;
      局面[1][2] = null;
      局面[1][9] = null;
      局面[2][2] = null;
      局面[2][8] = null;
      return 局面;
    case "左五枚落ち":
      局面[1][1] = null;
      局面[1][8] = null;
      局面[1][9] = null;
      局面[2][2] = null;
      局面[2][8] = null;
      return 局面;
    case "六枚落ち":
      局面[1][1] = null;
      局面[1][2] = null;
      局面[1][8] = null;
      局面[1][9] = null;
      局面[2][2] = null;
      局面[2][8] = null;
      return 局面;
    case "八枚落ち":
      局面[1][1] = null;
      局面[1][2] = null;
      局面[1][3] = null;
      局面[1][7] = null;
      局面[1][8] = null;
      局面[1][9] = null;
      局面[2][2] = null;
      局面[2][8] = null;
      return 局面;
    case "十枚落ち":
      局面[1][1] = null;
      局面[1][2] = null;
      局面[1][3] = null;
      局面[1][4] = null;
      局面[1][6] = null;
      局面[1][7] = null;
      局面[1][8] = null;
      局面[1][9] = null;
      局面[2][2] = null;
      局面[2][8] = null;
      return 局面;
    default: // 平手
      return 局面;
  }
};

KifuViewer.KIF解析.持駒 = function (kif持駒) {
  const 持駒 = { "歩": 0, "香": 0, "桂": 0, "銀": 0, "金": 0, "飛": 0, "角": 0 };
  if (kif持駒 === undefined || kif持駒.match("なし")) {
    return 持駒;
  }
  const 漢数字 = {
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
    "十": 10,
    "十一": 11,
    "十二": 12,
    "十三": 13,
    "十四": 14,
    "十五": 15,
    "十六": 16,
    "十七": 17,
    "十八": 18,
  };

  const str = kif持駒.split(/\s/);
  for (let i = 0; i < str.length; i++) {
    const 駒 = str[i][0];
    const 数 = str[i][1];
    if (駒 in 持駒) {
      持駒[駒] = (数) ? 漢数字[数] : 1;
    }
  }
  return 持駒;
};

KifuViewer.KIF解析.指し手 = function (kif, 開始手番) {
  const 全指し手 = [[{ 手数: 0, コメント: "" }]];
  let 手数 = 0;
  let 変化 = 0;

  全指し手.変化手数 = [];
  if (!kif) {
    return 全指し手;
  }

  for (let i = 0; i < kif.length; i++) {
    kif[i] = kif[i].trim();

    if (kif[i].indexOf("*") === 0 && 全指し手[変化][手数]) { // 指し手コメント
      全指し手[変化][手数].コメント += kif[i].replace(/^\*/, "") + "\n";
    } else if (kif[i].match(/^\d/)) {
      手数++;
      KifuViewer.KIF解析.指し手.現在の手(全指し手[変化], kif[i], 手数, 開始手番);
    } else if (kif[i].indexOf("変化：") === 0) {
      手数 = Number(kif[i].match(/変化：(\d+)/)[1]);
      全指し手.push(全指し手[0].slice(0, 手数));
      全指し手.変化手数.push(手数);
      手数--;
      変化++;
    }
  }

  return 全指し手;
};

KifuViewer.KIF解析.指し手.手番解析 = function (開始手番, 手数) {
  if (開始手番 == "先手") {
    return (手数 % 2 == 1) ? "▲" : "△";
  } else {
    return (手数 % 2 == 1) ? "△" : "▲";
  }
};

KifuViewer.KIF解析.指し手.現在の手 = function (全指し手, kif, 手数, 開始手番) {
  const 全数字 = {
    "１": 1,
    "２": 2,
    "３": 3,
    "４": 4,
    "５": 5,
    "６": 6,
    "７": 7,
    "８": 8,
    "９": 9,
  };
  const 漢数字 = {
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
  };
  const 終局表記 = ["中断", "投了", "持将棋", "千日手", "詰み", "切れ負け", "反則勝ち", "反則負け", "入玉勝ち"];

  const 手番 = KifuViewer.KIF解析.指し手.手番解析(開始手番, 手数);
  const 現在の手 = kif.split(/ +/)[1] || "";
  const 解析 = 現在の手.match(/([１-９同])([一二三四五六七八九\u3000])([^\(]+)(\((\d)(\d)\))?/);

  if (解析) {
    全指し手.push({
      "手数": 手数,
      "手番": 手番,
      "手": 解析[0],
      "駒": 解析[3].replace(/[打成]$/, "").replace("成銀", "全").replace("成桂", "圭")
        .replace("成香", "杏").replace("王", "玉").replace("竜", "龍"),
      "前X": Number(解析[5] || 0),
      "前Y": Number(解析[6] || 0),
      "後X": (解析[1] === "同") ? 全指し手[手数 - 1].後X : 全数字[解析[1]],
      "後Y": (解析[1] === "同") ? 全指し手[手数 - 1].後Y : 漢数字[解析[2]],
      "成り": /成$/.test(解析[3]),
      "コメント": "",
    });
  } else if (0 <= 終局表記.indexOf(現在の手)) {
    const 前指し手 = 全指し手[全指し手.length - 1];
    全指し手.push({
      "手数": 手数,
      "手番": 手番,
      "手": 現在の手,
      "駒": "終",
      "前X": 0,
      "前Y": 0,
      "後X": 前指し手.後X,
      "後Y": 前指し手.後Y,
      "成り": false,
      "コメント": "",
    });
    全指し手.勝敗 = KifuViewer.KIF解析.指し手.勝敗(現在の手, 手番);
  }
};

KifuViewer.KIF解析.指し手.勝敗 = function (理由, 手番) {
  const 結果 = { "勝者": "", "敗者": "", "理由": 理由, "表記": "" };
  switch (理由) {
    case "投了":
    case "詰み":
    case "切れ負け":
    case "反則負け":
      結果.勝者 = (手番 === "▲") ? "△" : "▲";
      結果.敗者 = (手番 === "▲") ? "▲" : "△";
      結果.表記 = 結果.敗者 + 理由 + "で" + 結果.勝者 + "の勝ち";
      break;
    case "反則勝ち":
    case "入玉勝ち":
      結果.勝者 = (手番 === "▲") ? "▲" : "△";
      結果.敗者 = (手番 === "▲") ? "△" : "▲";
      結果.表記 = 結果.勝者 + 理由;
      break;
    case "時将棋":
    case "千日手":
      結果.勝者 = 結果.敗者 = "引き分け";
      結果.表記 = 理由 + "で引き分け";
      break;
    case "中断":
      結果.表記 = 理由;
  }
  return 結果;
};

KifuViewer.KIF解析.評価値 = function (kif指し手) {
  const 評価値 = [];
  for (let i = 0; i < kif指し手.length; i++) {
    if (kif指し手[i].indexOf("**解析 0 ") !== 0) {
      continue;
    }
    評価値.push(kif指し手[i].match(/評価値 (\S+)/)[1].replace(/↓|↑/, ""));
  }
  return 評価値;
};

KifuViewer.KIF解析.読み筋 = function (kif指し手) {
  const 全読み筋 = ["-"];
  for (let i = 0; i < kif指し手.length; i++) {
    if (kif指し手[i].indexOf("**解析 0 ") !== 0) {
      continue;
    }
  }
  return 全読み筋;
};
