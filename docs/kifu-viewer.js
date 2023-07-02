class KifuViewer{constructor(a,b){this.board=a,this.canvas=document.createElement("canvas").getContext("2d"),this.canvas.font="22px YuMincho, Hiragino Mincho ProN, MS Mincho, serif",this.options=b||{},this.options.buttons||(this.options.buttons="default"),this.options.keybinds||(this.options.keybinds=this.board.parentNode),this.options.comment||(this.options.comment=null),this.options.start||(this.options.start=0),this.options.reverse||(this.options.reverse=!1),this.options.onMove||(this.options.onMove=()=>{})}defaultButtons(){return`
<div class='kifu-viewer-buttons mb-2' style='text-align:center;'>
<button class='kifu-viewer-first material-icons btn btn-lg btn-outline-secondary'>first_page</button>
<button class='kifu-viewer-prev material-icons btn btn-lg btn-outline-secondary'>chevron_left</button>
<button class='kifu-viewer-next material-icons btn btn-lg btn-outline-secondary'>chevron_right</button>
<button class='kifu-viewer-last material-icons btn btn-lg btn-outline-secondary'>last_page</button>
<button class='kifu-viewer-reverse material-icons btn btn-lg btn-outline-secondary'>autorenew</button>
</div>`}defaultKeybinds(a){switch(a.key){case"ArrowUp":this.first();break;case"ArrowDown":this.last();break;case"ArrowLeft":this.prev();break;case"ArrowRight":this.next();break}}loadKeybinds(){this.keybinds=a=>{this.defaultKeybinds(a)},this.options.keybinds.addEventListener("keydown",this.keybinds)}removeKeybinds(){this.options.keybinds.removeEventListener("keydown",this.keybinds)}loadButtons(){if(this.options.buttons=="none")return;this.options.buttons=="default"&&(this.board.insertAdjacentHTML("afterend",this.defaultButtons()),this.options.buttons=this.board.nextElementSibling),[...this.options.buttons.getElementsByClassName("kifu-viewer-first")].forEach(a=>{a.addEventListener("click",()=>{this.first()})}),[...this.options.buttons.getElementsByClassName("kifu-viewer-prev")].forEach(a=>{a.addEventListener("click",()=>{this.prev()})}),[...this.options.buttons.getElementsByClassName("kifu-viewer-next")].forEach(a=>{a.addEventListener("click",()=>{this.next()})}),[...this.options.buttons.getElementsByClassName("kifu-viewer-last")].forEach(a=>{a.addEventListener("click",()=>{this.last()})}),[...this.options.buttons.getElementsByClassName("kifu-viewer-reverse")].forEach(a=>{a.addEventListener("click",()=>{this.reverse()})})}get(b,c,d){const a=new XMLHttpRequest;a.open("GET",b),a.timeout=6e4,a.onloadend=()=>{d(a.responseText)},a.overrideMimeType("text/plain; charset="+c),a.send()}load(b,a,c=()=>{}){a=a||"UTF-8",this.get(b,a,a=>{this.data=KifuViewer.KIF解析(a),this.data.手数=KifuViewer.手数正規化(this.options.start,this.data.総手数),this.data.全局面=KifuViewer.全局面構築(this.data.全指し手,this.data.初期局面),this.局面描画(this.data.手数,this.data.手数),c(this.data)}),this.loadButtons(),this.loadKeybinds()}loadString(a,b=()=>{}){this.data=KifuViewer.KIF解析(a),this.data.手数=KifuViewer.手数正規化(this.options.start,this.data.総手数),this.data.全局面=KifuViewer.全局面構築(this.data.全指し手,this.data.初期局面),this.局面描画(this.data.手数,this.data.手数),this.loadButtons(),this.loadKeybinds(),b(this.data)}static 手数正規化(a,b){return!a||!b?0:(a<0&&(a=b+a+1),a>b)?b:a}static 全局面構築(b,c){const a=[];for(let d=0;d<b.length;d++){a[d]=[c];for(let c=1;c<b[d].length;c++)a[d].push(KifuViewer.全局面構築.各局面(b[d][c],a[d][c-1]))}return a}static KIF解析(b){const c={},a={局面図:[],解析:[]};b=b.split(/\r?\n/);for(let c=0;c<b.length;c++){if(b[c]=b[c].trim(),b[c].indexOf("#")===0)continue;if(b[c].indexOf("|")===0)a.局面図.push(b[c]);else if(b[c].indexOf("：")>-1){const d=b[c].split("：");a[d[0]]=d[1]}else if(b[c].indexOf("**Engines")===0)a.解析済み=!0;else if(b[c]==="後手番"||b[c]==="上手番")a.開始手番="後手";else if(b[c]==="先手番"||b[c]==="下手番")a.開始手番="先手";else if(b[c].match(/手数＝\d/))a.最終手=b[c];else if(b[c].match(/^[1\*]/)){a.指し手=b.slice(c);break}}return c.先手名=a.先手||a.下手||"",c.後手名=a.後手||a.上手||"",c.開始手番=KifuViewer.KIF解析.開始手番(a.開始手番,a.手合割),c.最終手=KifuViewer.KIF解析.最終手(a.最終手),c.手合割=KifuViewer.KIF解析.手合割(a.手合割),c.評価値=a.解析済み?KifuViewer.KIF解析.評価値(a.指し手):[],c.読み筋=a.解析済み?KifuViewer.KIF解析.読み筋(a.指し手):["-"],c.初期局面={"駒":KifuViewer.KIF解析.局面図(a.局面図,c.手合割),"先手の持駒":KifuViewer.KIF解析.持駒(a.先手の持駒||a.下手の持駒),"後手の持駒":KifuViewer.KIF解析.持駒(a.後手の持駒||a.上手の持駒)},c.全指し手=KifuViewer.KIF解析.指し手(a.指し手,c.開始手番),c.総手数=c.全指し手[0].length-1,c.変化=0,c}static オブジェクトコピー(a){const b=Array.isArray(a)?[]:{};for(const c in a)b[c]=a[c]instanceof Object?KifuViewer.オブジェクトコピー(a[c]):a[c];return b}static 局面停止状態(a){return a.駒=="終"}static svg(a){return document.createElementNS("http://www.w3.org/2000/svg",a)}static svgText(b,c,d,e,f){const a=KifuViewer.svg("text");return a.setAttribute("x",b),a.setAttribute("y",c),a.setAttribute("font-size",d),a.setAttribute("font-family","YuMincho, Hiragino Mincho ProN, MS Mincho, serif"),a.setAttribute("text-anchor",f),a.textContent=e,a}static svgLine(b,c,d,e){const a=KifuViewer.svg("line");return a.setAttribute("x1",b),a.setAttribute("x2",d),a.setAttribute("y1",c),a.setAttribute("y2",e),a.setAttribute("stroke","#000"),a.setAttribute("stroke-width",1),a}static svgRect(b,c,d,e){const a=KifuViewer.svg("rect");return a.setAttribute("x",b),a.setAttribute("y",c),a.setAttribute("width",d),a.setAttribute("height",e),a}指し手表示(c,a){let b;if(a.手数==0)b="開始局面";else{const c=a.手番==="▲"?"☗":"☖";b=a.手数+"手目  "+c+a.手}c?this.board.childNodes[1].textContent=b:this.board.appendChild(KifuViewer.svgText(15,530,17,b,"center"))}持駒計算(b){let a="";for(const c in b)b[c]!=0&&(a!=""&&(a+=" "),a+=c+b[c]);return a==""?"なし":a}持駒表示(g,b,c){const d=this.持駒計算(b.先手の持駒),e=this.持駒計算(b.後手の持駒),f=c?d:e,a=c?e:d;if(g)this.board.childNodes[2].firstChild.textContent=f,this.board.childNodes[3].firstChild.textContent=a;else{const b=KifuViewer.svgText(0,0,21,f,"left");b.setAttribute("transform","translate(15, 53)");const c=KifuViewer.svgText(0,0,21,a,"left");c.setAttribute("transform","translate(15, 500)"),this.board.appendChild(b),this.board.appendChild(c)}}局面描画(f,c){this.data.手数=c;const d=this.data.全局面[this.data.変化][c],a=this.data.全指し手[this.data.変化][c],e=this.data.全指し手[this.data.変化][f],b=this.options.reverse;this.board.childNodes.length>0?(this.指し手表示(!0,a),this.持駒表示(!0,d,b),this.駒配置(!0,d,b,a,e),this.評価値表示(!0,this.data.評価値[c],a)):(this.将棋盤描画(),this.指し手表示(!1,a),this.持駒表示(!1,d,b),this.指し手強調(!1,0,0),this.駒配置(!1,d,b,a,e),this.符号表示(!1,b),this.上下名称表示(!1,b),this.評価値表示(!1,this.data.評価値[c],a),this.showAttribution()),this.コメント表示(a.コメント)}コメント表示(a){this.options.comment&&(this.options.comment.innerHTML=a)}指し手初期化(){const a=this.board.childNodes[4];a.setAttribute("fill","none")}指し手強調(c,a,b){if(c){const c=this.board.childNodes[4];c.setAttribute("transform",`translate(${a}, ${b})`)}else{const c=KifuViewer.svgRect(a,b,40,40);c.setAttribute("fill","none"),this.board.appendChild(c)}}駒配置(e,c,f,b,a){let d;if(e?d=this.board.childNodes[5]:(d=KifuViewer.svg("g"),this.board.appendChild(d)),a&&Math.abs(b.手数-a.手数)==1){if(b.手数<a.手数){if(KifuViewer.局面停止状態(a))return;a.前X!=0&&this.駒描画(e,d,c.駒[a.前Y][a.前X],a.前X,a.前Y,!1,f),this.駒描画(e,d,c.駒[a.後Y][a.後X],a.後X,a.後Y,!1,f)}else{if(KifuViewer.局面停止状態(b))return;a.手数>=1&&this.駒描画(e,d,c.駒[a.後Y][a.後X],a.後X,a.後Y,!1,f)}b.手数==0?this.指し手初期化():(b.前X!=0&&this.駒描画(e,d,c.駒[b.前Y][b.前X],b.前X,b.前Y,!1,f),this.駒描画(e,d,c.駒[b.後Y][b.後X],b.後X,b.後Y,!0,f))}else if(this.data.最終手){const a=this.data.最終手[0],b=this.data.最終手[1];for(const g in c.駒)for(const h in c.駒[g]){let i=!1;h==a&&g==b&&(i=!0),this.駒描画(e,d,c.駒[g][h],h,g,i,f)}}else for(const a in c.駒)for(const g in c.駒[a]){let h=!1;g==b.後X&&a==b.後Y&&(h=!0),this.駒描画(e,d,c.駒[a][g],g,a,h,f)}}駒描画(k,j,a,c,d,i,h){c=10-c,a||(a=""),h&&(c=10-c,d=10-d,a=a.match("_")?a.replace("_",""):a+"_");let e=a;a.match("_")&&(e=a.replace("_",""));const f=40*c-40+32,g=40*d-40+94;if(i){const a=this.board.childNodes[4];a.setAttribute("fill","#111111"),this.指し手強調(!0,f-20,g-16)}let b;if(k){const a=h?80-9*d+c:9*d-c;b=j.childNodes[a],b.textContent=e}else b=KifuViewer.svgText(0,0,31,e,"middle"),b.setAttribute("dy",16),j.appendChild(b);a.match("_")?b.setAttribute("transform",`translate(${f}, ${g+8}) scale(-1, -1)`):b.setAttribute("transform",`translate(${f}, ${g})`),i?b.setAttribute("fill","#fff"):b.setAttribute("fill","#000")}盤外表示(){const a=KifuViewer.svgRect(0,58,395,390);return a.setAttribute("touch-action","manipulation"),a.setAttribute("fill","#FFE084"),a}盤枠表示(){const a=KifuViewer.svgRect(12,77,360,360);return a.setAttribute("fill","#FFE084"),a.setAttribute("stroke","#000"),a.setAttribute("stroke-width",2),a.setAttribute("id","ban"),a}showAttribution(){const a=KifuViewer.svg("a");a.setAttribute("href","https://marmooo.github.io/kifu-viewer/");const b=KifuViewer.svgText(300,500,17,"KifuViewer","left");b.setAttribute("text-decoration","underline"),a.appendChild(b),this.board.appendChild(a)}名称表示サイズ(a){const b=this.canvas.measureText(a).width,c=b<395?22:b/a.length;return c}上下名称表示(h,d){const e=this.data.先手名==""?"先手":this.data.先手名,f=this.data.後手名==""?"後手":this.data.後手名,a=d?"☗"+e:"☖"+f,b=d?"☖"+f:"☗"+e,c=this.名称表示サイズ(a),g=this.名称表示サイズ(b);if(h){const d=this.board.childNodes[7].childNodes;d[0].textContent=a,d[1].textContent=b,d[0].setAttribute("font-size",c),d[1].setAttribute("font-size",g)}else{const d=KifuViewer.svg("g");this.board.appendChild(d),d.appendChild(KifuViewer.svgText(10,23,c,a,"left")),d.appendChild(KifuViewer.svgText(10,470,g,b,"left"))}}評価値表示(d,a,c){let b="評価値  -";if(c!==void 0&&c!=="投了"&&a!==void 0){let c="";if(a.match("詰"))c="勝勢";else{const b=a.replace("-","");0<=b&&b<=300?c="互角":301<=b&&b<=800?c="有利":801<=b&&b<=1500?c="優勢":1501<=b?c="勝勢":c=""}let d;a.match("-")?d="☖後手":d="☗先手",c=="互角"&&(d=""),b="評価値  "+d+c+"("+a+")"}d?this.board.childNodes[8].textContent=b:this.board.appendChild(KifuViewer.svgText(215,530,17,b,"left"))}枡目表示(){const a=document.createDocumentFragment();for(let b=1;b<=8;b++)a.appendChild(KifuViewer.svgLine(12+40*b,77.5,12+40*b,360+77.5)),a.appendChild(KifuViewer.svgLine(12,77.5+40*b,370,77.5+40*b));return a}符号表示(c,d){let a=["１","２","３","４","５","６","７","８","９"],b=["一","二","三","四","五","六","七","八","九"];if(d&&(a=["９","８","７","６","５","４","３","２","１"],b=["九","八","七","六","五","四","三","二","一"]),c){const c=this.board.childNodes[6].childNodes;for(let d=0;d<=8;d+=1)c[d*2].textContent=a[d],c[d*2+1].textContent=b[d]}else{const c=KifuViewer.svg("g");this.board.appendChild(c);for(let d=0;d<=8;d++)c.appendChild(KifuViewer.svgText(355-40*d,73,14,a[d],"middle")),c.appendChild(KifuViewer.svgText(386,100+40*d,14,b[d],"middle"))}}将棋盤描画(){const a=KifuViewer.svg("g");this.board.appendChild(a),a.appendChild(this.盤外表示()),a.appendChild(this.盤枠表示()),a.appendChild(this.枡目表示())}first(){this.指し手初期化(),this.局面描画(this.data.手数,0),this.options.onMove(this.data)}prev(){this.data.手数>0&&(this.局面描画(this.data.手数,this.data.手数-1),this.options.onMove(this.data))}next(){const a=this.data.全指し手[this.data.変化].length-1;this.data.手数<a&&(this.局面描画(this.data.手数,this.data.手数+1),this.options.onMove(this.data))}last(){const a=this.data.全指し手[this.data.変化].length-1;this.局面描画(this.data.手数,a),this.options.onMove(this.data)}reverse(){this.options.reverse=!this.options.reverse,this.符号表示(!0,this.options.reverse),this.上下名称表示(!0,this.options.reverse),this.局面描画(this.data.手数,this.data.手数)}}KifuViewer.全局面構築.各局面=function(a,g){const b=KifuViewer.オブジェクトコピー(g);if(KifuViewer.局面停止状態(a))return b;const d=a.手番==="▲"?"先手":"後手",e={"歩":"と","香":"杏","桂":"圭","銀":"全","角":"馬","飛":"龍"},f={"と":"歩","杏":"香","圭":"桂","全":"銀","馬":"角","龍":"飛"};let c=a.駒;if(a.前X!==0){if(b.駒[a.前Y][a.前X]=null,a.成り&&(c=c in e?e[c]:c),b.駒[a.後Y][a.後X]){let c=b.駒[a.後Y][a.後X].replace("_","");c=c in f?f[c]:c,b[d+"の持駒"][c]++}}else b[d+"の持駒"][c]--;return d==="後手"&&(c+="_"),b.駒[a.後Y][a.後X]=c,b},KifuViewer.KIF解析.開始手番=function(a,b){return a?a:b&&b!=="平手"?"後手":"先手"},KifuViewer.KIF解析.最終手=function(b){if(!b)return;const a=b.match(/([１２３４５６７８９])(.)/);if(a){const b={"１":"1","２":"2","３":"3","４":"4","５":"5","６":"6","７":"7","８":"8","９":"9"},c={"一":"1","二":"2","三":"3","四":"4","五":"5","六":"6","七":"7","八":"8","九":"9"};return b[a[1]]+c[a[2]]}},KifuViewer.KIF解析.手合割=function(a){const b=["香落ち","右香落ち","角落ち","飛車落ち","飛香落ち","二枚落ち","三枚落ち","四枚落ち","五枚落ち","左五枚落ち","六枚落ち","八枚落ち","十枚落ち","その他"];return b.indexOf(a)>=0?a:null},KifuViewer.KIF解析.局面図=function(c,d){if(c.length!==9)return d?KifuViewer.KIF解析.局面図.手合割(d):KifuViewer.KIF解析.局面図.平手();const e=KifuViewer.KIF解析.局面図.駒無し();let b=!0,a=10;const f={"王":"玉","竜":"龍"};for(let g=0;g<9;g++){a=10;const d=c[g];for(let c=1;c<d.length;c++){if(d[c]===" "){b=!0,a-=1;continue}if(d[c]==="v"){b=!1,a-=1;continue}if(d[c]==="|")break;if(d[c]==="・")continue;let h=d[c];h=h in f?f[h]:h,e[g+1][a]=b?h:h+"_"}}return e},KifuViewer.KIF解析.局面図.平手=function(){return{1:{9:"香_",8:"桂_",7:"銀_",6:"金_",5:"玉_",4:"金_",3:"銀_",2:"桂_",1:"香_"},2:{9:null,8:"飛_",7:null,6:null,5:null,4:null,3:null,2:"角_",1:null},3:{9:"歩_",8:"歩_",7:"歩_",6:"歩_",5:"歩_",4:"歩_",3:"歩_",2:"歩_",1:"歩_"},4:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null},5:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null},6:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null},7:{9:"歩",8:"歩",7:"歩",6:"歩",5:"歩",4:"歩",3:"歩",2:"歩",1:"歩"},8:{9:null,8:"角",7:null,6:null,5:null,4:null,3:null,2:"飛",1:null},9:{9:"香",8:"桂",7:"銀",6:"金",5:"玉",4:"金",3:"銀",2:"桂",1:"香"}}},KifuViewer.KIF解析.局面図.駒無し=function(){return{1:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null},2:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null},3:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null},4:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null},5:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null},6:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null},7:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null},8:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null},9:{9:null,8:null,7:null,6:null,5:null,4:null,3:null,2:null,1:null}}},KifuViewer.KIF解析.局面図.手合割=function(b){const a=KifuViewer.KIF解析.局面図.平手();switch(b){case"香落ち":return a[1][1]=null,a;case"右香落ち":return a[1][9]=null,a;case"角落ち":return a[2][2]=null,a;case"飛車落ち":return a[2][8]=null,a;case"飛車香落ち":return a[1][1]=null,a[2][8]=null,a;case"二枚落ち":return a[2][2]=null,a[2][8]=null,a;case"三枚落ち":return a[1][1]=null,a[2][2]=null,a[2][8]=null,a;case"四枚落ち":return a[1][1]=null,a[1][9]=null,a[2][2]=null,a[2][8]=null,a;case"五枚落ち":return a[1][1]=null,a[1][2]=null,a[1][9]=null,a[2][2]=null,a[2][8]=null,a;case"左五枚落ち":return a[1][1]=null,a[1][8]=null,a[1][9]=null,a[2][2]=null,a[2][8]=null,a;case"六枚落ち":return a[1][1]=null,a[1][2]=null,a[1][8]=null,a[1][9]=null,a[2][2]=null,a[2][8]=null,a;case"八枚落ち":return a[1][1]=null,a[1][2]=null,a[1][3]=null,a[1][7]=null,a[1][8]=null,a[1][9]=null,a[2][2]=null,a[2][8]=null,a;case"十枚落ち":return a[1][1]=null,a[1][2]=null,a[1][3]=null,a[1][4]=null,a[1][6]=null,a[1][7]=null,a[1][8]=null,a[1][9]=null,a[2][2]=null,a[2][8]=null,a;default:return a}},KifuViewer.KIF解析.持駒=function(b){const a={"歩":0,"香":0,"桂":0,"銀":0,"金":0,"飛":0,"角":0};if(b===void 0||b.match("なし"))return a;const d={"一":1,"二":2,"三":3,"四":4,"五":5,"六":6,"七":7,"八":8,"九":9,"十":10,"十一":11,"十二":12,"十三":13,"十四":14,"十五":15,"十六":16,"十七":17,"十八":18},c=b.split(/\s/);for(let b=0;b<c.length;b++){const e=c[b][0],f=c[b][1];e in a&&(a[e]=f?d[f]:1)}return a},KifuViewer.KIF解析.指し手=function(a,e){const b=[[{手数:0,コメント:""}]];let c=0,d=0;if(b.変化手数=[],!a)return b;for(let f=0;f<a.length;f++)a[f]=a[f].trim(),a[f].indexOf("*")===0&&b[d][c]?b[d][c].コメント+=a[f].replace(/^\*/,"")+"\n":a[f].match(/^\d/)?(c++,KifuViewer.KIF解析.指し手.現在の手(b[d],a[f],c,e)):a[f].indexOf("変化：")===0&&(c=Number(a[f].match(/変化：(\d+)/)[1]),b.push(b[0].slice(0,c)),b.変化手数.push(c),c--,d++);return b},KifuViewer.KIF解析.指し手.手番解析=function(b,a){return b=="先手"?a%2==1?"▲":"△":a%2==1?"△":"▲"},KifuViewer.KIF解析.指し手.現在の手=function(b,i,c,j){const f={"１":1,"２":2,"３":3,"４":4,"５":5,"６":6,"７":7,"８":8,"９":9},g={"一":1,"二":2,"三":3,"四":4,"五":5,"六":6,"七":7,"八":8,"九":9},h=["中断","投了","持将棋","千日手","詰み","切れ負け","反則勝ち","反則負け","入玉勝ち"],e=KifuViewer.KIF解析.指し手.手番解析(j,c),d=i.split(/ +/)[1]||"",a=d.match(/([１-９同])([一二三四五六七八九\u3000])([^\(]+)(\((\d)(\d)\))?/);if(a)b.push({"手数":c,"手番":e,"手":a[0],"駒":a[3].replace(/[打成]$/,"").replace("成銀","全").replace("成桂","圭").replace("成香","杏").replace("王","玉").replace("竜","龍"),"前X":Number(a[5]||0),"前Y":Number(a[6]||0),"後X":a[1]==="同"?b[c-1].後X:f[a[1]],"後Y":a[1]==="同"?b[c-1].後Y:g[a[2]],"成り":/成$/.test(a[3]),"コメント":""});else if(0<=h.indexOf(d)){const a=b[b.length-1];b.push({"手数":c,"手番":e,"手":d,"駒":"終","前X":0,"前Y":0,"後X":a.後X,"後Y":a.後Y,"成り":!1,"コメント":""}),b.勝敗=KifuViewer.KIF解析.指し手.勝敗(d,e)}},KifuViewer.KIF解析.指し手.勝敗=function(b,c){const a={"勝者":"","敗者":"","理由":b,"表記":""};switch(b){case"投了":case"詰み":case"切れ負け":case"反則負け":a.勝者=c==="▲"?"△":"▲",a.敗者=c==="▲"?"▲":"△",a.表記=a.敗者+b+"で"+a.勝者+"の勝ち";break;case"反則勝ち":case"入玉勝ち":a.勝者=c==="▲"?"▲":"△",a.敗者=c==="▲"?"△":"▲",a.表記=a.勝者+b;break;case"時将棋":case"千日手":a.勝者=a.敗者="引き分け",a.表記=b+"で引き分け";break;case"中断":a.表記=b}return a},KifuViewer.KIF解析.評価値=function(a){const b=[];for(let c=0;c<a.length;c++){if(a[c].indexOf("**解析 0 ")!==0)continue;b.push(a[c].match(/評価値 (\S+)/)[1].replace(/↓|↑/,""))}return b},KifuViewer.KIF解析.読み筋=function(a){const b=["-"];for(let b=0;b<a.length;b++)if(a[b].indexOf("**解析 0 ")!==0)continue;return b}