const board=document.getElementById("board");function loadConfig(){localStorage.getItem("darkMode")==1&&document.documentElement.setAttribute("data-bs-theme","dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),document.documentElement.setAttribute("data-bs-theme","light")):(localStorage.setItem("darkMode",1),document.documentElement.setAttribute("data-bs-theme","dark"))}function updateViewer(e){viewer.removeKeybinds(),viewer=new KifuViewer(board,{keybinds:window}),viewer.loadString(e,()=>{viewer.first(),viewer.board.nextElementSibling.nextElementSibling.remove()})}function loadClipboardKif(){navigator.clipboard.readText().then(e=>{updateViewer(e)})}loadConfig();let viewer=new KifuViewer(board,{keybinds:window,start:11});viewer.loadString(document.getElementById("kif").textContent),document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("clipboard").onclick=loadClipboardKif,document.getElementById("selectKif").onclick=()=>{document.getElementById("inputKif").click()},document.getElementById("inputKif").onchange=e=>{const n=e.target.files[0],t=new FileReader;t.onload=()=>{const e=new Uint8Array(t.result),n=Encoding.detect(e),s=Encoding.convert(e,{to:"unicode",from:n,type:"string"});updateViewer(s)},t.readAsArrayBuffer(n)}