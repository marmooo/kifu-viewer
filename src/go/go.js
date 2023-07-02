const viewerNode = document.getElementById("viewer");

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.dataset.theme = "dark";
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.dataset.theme = "dark";
  }
}

function updateViewer(text) {
  viewer.removeKeybinds();
  viewer = new KifuViewer(viewerNode, { keybinds: window });
  viewer.loadString(text, function () {
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
let viewer = new KifuViewer(viewerNode, {
  keybinds: window,
  start: 11,
});
viewer.loadString(document.getElementById("kif").textContent);

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("clipboard").onclick = loadClipboardKif;
document.getElementById("selectKif").onclick = function () {
  document.getElementById("inputKif").click();
};
document.getElementById("inputKif").onchange = function (event) {
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
