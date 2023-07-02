const board = document.getElementById("board");

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function updateViewer(text) {
  viewer.removeKeybinds();
  viewer = new KifuViewer(board, { keybinds: window });
  viewer.loadString(text, () => {
    viewer.first();
    viewer.board.nextElementSibling.nextElementSibling.remove();
  });
}

function loadClipboardKif() {
  navigator.clipboard.readText().then((clipText) => {
    updateViewer(clipText);
  });
}

loadConfig();
let viewer = new KifuViewer(board, {
  keybinds: window,
  start: 11,
});
viewer.loadString(document.getElementById("kif").textContent);

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("clipboard").onclick = loadClipboardKif;
document.getElementById("selectKif").onclick = () => {
  document.getElementById("inputKif").click();
};
document.getElementById("inputKif").onchange = (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const codes = new Uint8Array(reader.result);
    const encoding = Encoding.detect(codes);
    const text = Encoding.convert(codes, {
      to: "unicode",
      from: encoding,
      type: "string",
    });
    updateViewer(text);
  };
  reader.readAsArrayBuffer(file);
};
