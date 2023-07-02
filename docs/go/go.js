const viewerNode=document.getElementById("viewer");function loadConfig(){localStorage.getItem("darkMode")==1&&(document.documentElement.dataset.theme="dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),delete document.documentElement.dataset.theme):(localStorage.setItem("darkMode",1),document.documentElement.dataset.theme="dark")}function updateViewer(a){viewer.removeKeybinds(),viewer=new KifuViewer(viewerNode,{keybinds:window}),viewer.loadString(a,function(){viewer.first(),viewer.board.nextElementSibling.nextElementSibling.remove()})}function loadClipboardKif(){navigator.clipboard.readText().then(a=>{updateViewer(a)})}loadConfig();let viewer=new KifuViewer(viewerNode,{keybinds:window,start:11});viewer.loadString(document.getElementById("kif").textContent),document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("clipboard").onclick=loadClipboardKif,document.getElementById("selectKif").onclick=function(){document.getElementById("inputKif").click()},document.getElementById("inputKif").onchange=function(b){const c=b.target.files[0],a=new FileReader;a.onload=()=>{const b=new Uint8Array(a.result),c=Encoding.detect(b),d=Encoding.convert(b,{to:"unicode",from:c,type:"string"});updateViewer(d)},a.readAsArrayBuffer(c)}