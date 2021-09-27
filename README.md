# kifu-viewer

JavaScriptで動く将棋の棋譜再生ライブラリです。

## Demo

- [マニュアル](https://marmooo.github.io/kifu-viewer/)
- [将棋びぎなーず](https://marmooo.github.io/shogi-beginners/)

## Usage

from string

```
<head>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<div tabindex="-1"><!-- for keybinds -->
  <svg id="board" xmlns="http://www.w3.org/2000/svg" viewBox="0,0,400,540"></svg>
  <script id="kif" type="kif">
    // embed kif data
  </script>
</div>
<script src="kifu-viewer.min.js"></script>
<script>
  const viewer = KifuViewer(document.getElementById('board'));
  viewer.loadString(document.getElementById('kif').textContent);
</script>
```

from kif file

```
<head>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<div tabindex="-1"><!-- for keybinds -->
  <svg id="board" xmlns="http://www.w3.org/2000/svg" viewBox="0,0,400,540"></svg>
</div>
<script src="kifu-viewer.min.js"></script>
<script>
  const viewer = KifuViewer(document.getElementById('board'));
  viewer.load('test-utf8.kif');
  // viewer.load('test-utf8.kif', 'UTF-8');
  // viewer.load('test-sjis.kif', 'Shift_JIS');
</script>
```

custom options

```
const viewer = KifuViewer(
  document.getElementById('board'), {
  buttons:  document.getElementById('buttons'),   // 操作ボタン要素
  keybinds: document.getElementById('keybinds'),  // キーバインド適用要素
  comment:  document.getElementById('comment'),   // コメント表示要素
  start: 0,        // 開始手数
  reverse: false,  // 盤面反転
  onMove: function(data) { console.log(data); },  // 指し手イベント
  secure: false,  // コメント表示のセキュリティモード
});
```

## Build

```
npm install kifu-viewer
npm run build
```

## Attribution

- [kifPlayer](https://shogi-study.com/ブラウザ棋譜再生ツール「kifPlayer」/) (original)

## License

MIT
