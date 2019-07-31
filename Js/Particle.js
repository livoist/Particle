

//------------環境變數-----------//

var updateFPS = 30
//更新速度每秒30次
var showMouse = true
//滑鼠控制項顯示
var time = 0
//起始時間為0
var bgColor = 'black'


//-------------控制(GUI)-----------//
var controls = {
  particleCount: 5,
  //每秒產生的粒子陣列
  ay: 0.6,
  //額外的y方向加速度
  fade: 0.95,
  //消失的漸變參數，每次乘以0.95漸變消失
  v: 15,
  //額外的向量，粒子產生的左右偏移，使用random*15/2-5的區間
  r: 255,
  g: 255,
  b: 255,
  a: 1,
  //rgba設定
  methods: 'colors',
  //模式切換預設值
  forceValue: -300,
  //力場預設值
  clearForce: function () {
    forcefields = []
  },
  //清空力場，使力場陣列為0
  reset: function () {
    window.location.reload();
  }
}


//-----------顯示控制項GUI添加-----------
var gui = new dat.GUI()
//init gui
var basic = gui.addFolder('basicSet')
var color = gui.addFolder('colorSet')
var force = gui.addFolder('forceSet')
var methods = gui.addFolder('methodsSet')
//area set control
basic.add(controls, "particleCount", 0, 15).step(1).onChange(function (value) { })
basic.add(controls, "ay", -1, 1).step(0.01).onChange(function (value) { })
basic.add(controls, "fade", 0, 1).step(0.01).onChange(function (value) { })
basic.add(controls, "v", 0, 255).step(1).onChange(function (value) { })

color.add(controls, "r", 0, 255).step(1).onChange(function (value) { })
color.add(controls, "g", 0, 255).step(1).onChange(function (value) { })
color.add(controls, "b", 0, 255).step(1).onChange(function (value) { })
color.add(controls, "a", 0, 1).step(0.1).onChange(function (value) { })

force.add(controls, "forceValue", -300, 300).step(5).onChange(function (value) { })

methods.add(controls, "methods", ['colors', 'fire', 'flash','explode'])

gui.add(controls, 'reset')
gui.add(controls, 'clearForce')



//-----粒子的建構式----
class Particle {
  constructor(args) {
    let def = {
      p: new Vec2(),
      //位置
      v: new Vec2(),
      //向量
      a: new Vec2(),
      //加速度
      r: 10,
      //半徑
    }
    Object.assign(def, args)
    //assign把args客製化的值合併到原來的def上
    Object.assign(this, def)
    //再把合併完客製化的值合併到現在正在初始化的物件上
  }


  draw() {
    ctx.save()
    ctx.globalCompositeOperation = "lighter"
    if (controls.methods == 'flash') {
      ctx.shadowOffsetX = 4
      ctx.shadowOffsetY = 4
      ctx.shadowColor = `rgba(${Math.random() * controls.r},${Math.random() * controls.g},${Math.random() * controls.b},${Math.random() * controls.a})`
      ctx.shadowBlur = 4
    }
    //條件判斷，模式切換flash，加入陰影。
    ctx.translate(this.p.x, this.p.y)
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(0, 0, this.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  //繪製粒子


  update() {
    this.p = this.p.add(this.v)
    //現在位置等於外來向量加上現有位置
    this.v = this.v.add(this.a)
    //現在的向量等於外來向量加上加速度
    this.v.move(0, controls.ay)
    //在現有的向量加上額外的加速度y
    this.v = this.v.mul(0.99)
    //在現有的向量乘以0.99的衰減
    this.r *= controls.fade
    //現有的粒子大小半徑加上衰減，並加到GUI控制項


    //邊界偵測
    if (this.p.y + this.r > wh) {
      this.v.y = -Math.abs(this.v.y)
    }
    //如果位置y加上半徑大於視窗高度，向量為絕對值負(反彈)，上方判斷
    if (this.p.x + this.r > ww) {
      this.v.x = -Math.abs(this.v.x)
    }
    //如果位置x加上半徑大於視窗寬度，向量為絕對值負(反彈)，左側判斷
    if (this.p.y - this.r < 0) {
      this.v.y = Math.abs(this.v.y)
    }
    //如果y位置減掉自己的半徑大於上邊界，則向量為正，下方判斷
    if (this.p.x - this.r < 0) {
      this.v.x = Math.abs(this.v.x)
    }
    //如果x位置減掉自己的半徑大於左邊界，則向量為正，右方判斷
  }
}


//--------力場建構式---------
class Forcefield {
  constructor(args) {
    let def = {
      p: new Vec2(),
      value: controls.forceValue,
      //力場的力量值，正為斥力，負為吸力
    }
    Object.assign(def, args)
    Object.assign(this, def)
  }
  draw() {
      ctx.save()
      ctx.translate(this.p.x, this.p.y)
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()
      ctx.restore()
  }
  //畫出力場

  affect(particle) {
    let delta = particle.p.sub(this.p)
    //距離等於粒子的位置減掉力場的位置
    let len = controls.forceValue / (1 + delta.length)
    //長度等於給予的值除以(1+delta.length)
    let force = delta.unit.mul(len)
    //力場的單位力量等於距離乘以長度
    particle.v.move(force.x, force.y)
    //粒子的向量偏移等於力場的影響相對值
  }
  //力場的影響力

}

//------------
//--------Vec2，向量的建構式---------
class Vec2 {
  constructor(x, y) {
    this.x = x || 0
    this.y = y || 0
    //如果沒給參數則回傳0
  }

  set(x, y) {
    this.x = x
    this.y = y
  }
  //改變初始向量

  move(x, y) {
    this.x += x
    this.y += y
  }
  //向量位置移動

  add(v) {
    return new Vec2(this.x + v.x, this.y + v.y)
  }
  //添加外來向量

  sub(v) {
    return new Vec2(this.x - v.x, this.y - v.y)
  }
  //減掉外來向量

  mul(s) {
    return new Vec2(this.x * s, this.y * s)
  }
  //乘上外來值

  get length() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
  //computed，取得向量長度

  set length(nv) {
    let temp = this.unit.mul(nv)
    this.set(temp.x, temp.y)
  }
  //computed，取得相對於自己位置的單位向量，設定temp = 自己的向量的單位向量比並乘以新的向量，再把新的向量位置指定回去

  clone() {
    return new Vec2(this.x, this.y)
  }
  //複製一組新的向量，不影響初始向量

  toString() {
    return `(${this.x}, ${this.y})`
  }
  //向量轉成字串

  equal(v) {
    return this.x == v.x && this.y == v.y
  }
  //向量的相等判斷

  get angle() {
    return Math.atan2(this.y, this.x)
  }
  //取得角度

  get unit() {
    return this.mul(1 / this.length)
  }
  //單位向量，取得長度為1一樣方向的向量，用取的的向量長度除以自己長度分之一倍，用在控制向量的長度或是相對位置比
}
//------------canvas基礎設定-------------

var canvas = document.getElementById("canvas-main")
var ctx = canvas.getContext("2d",{alpha: false})
//優化渲染，關閉透明度{alpha: false}
// var canvas2 = document.getElementById("canvas-second")
// var ctx2 = canvas2.getContext("2d")

ctx.circle = function (v, r) {
  this.arc(v.x, v.y, r, 0, Math.PI * 2)
}
//畫圓的方法

ctx.line = function (v1, v2) {
  this.moveTo(v1.x, v1.y)
  this.lineTo(v2.x, v2.y)
}
//畫線的方法

//--------Canvas初始化----------
function initCanvas() {
  ww = canvas.width = window.innerWidth
  wh = canvas.height = window.innerHeight
  // ww = canvas2.width = window.innerWidth
  // wh = canvas2.height = window.innerHeight
}
initCanvas()



particles = []
//粒子的陣列
forcefields = []
//力場的陣列


function init() { }
//初始化



//邏輯更新
function update() {

  //-----模式切換：colors------
  if (controls.methods == 'colors') {
    time++
    particles = particles.concat(Array.from({ length: controls.particleCount }, (d, i) => {
      //粒子的陣列等於粒子的陣列設定一個長度(由GUI控制，from(ES6語法))，抓出每一個粒子與位置(d,i)，回傳新的粒子並定義其中的位置、向量、半徑、顏色
      return new Particle({
        //把更新過的陣列指向現在正在產生的陣列
        p: mousePos.clone(),
        v: new Vec2(Math.random() * controls.v / 2 - 5, Math.random() * controls.v / 2 - 5),
        r: Math.random() * 46,
        color: `rgba(${Math.random() * controls.r},${Math.random() * controls.g},${Math.random() * controls.b},${Math.random() * controls.a})`,
      });
    }));
    //-----模式切換：fire------
  } else if (controls.methods == 'fire') {
    time++
    particles = particles.concat(Array.from({ length: 8 }, (d, i) => {
      return new Particle({
        p: mousePos.clone(),
        v: new Vec2(Math.random() * controls.v / 2 - 8, Math.random() * controls.v / 2 - 8),
        r: Math.random() * 80,
        color: `rgba(227,23,13,0.1)`,
        a: new Vec2(Math.random() * 1, Math.random() * 2 / 2 - 3)
      });
    }));
    //-----模式切換：flash------
  } else if (controls.methods == 'flash') {
    time++
    particles = particles.concat(Array.from({ length: 4 }, (d, i) => {
      return new Particle({
        p: mousePos.clone(),
        v: new Vec2(Math.random() * controls.v / 2 - 5, Math.random() * controls.v / 2 - 5),
        r: Math.random() * 50,
        color: `rgba(${Math.random() * controls.r},${Math.random() * controls.g},${Math.random() * controls.b},${Math.random() * controls.a})`
      });
    }));
  }
  particles.forEach(p => { p.update() })
  //更新粒子，把陣列裡所有粒子抓出來跑過上面的更新
  var sp = particles.slice()
  sp.forEach((p, pid) => {
    forcefields.forEach(f => f.affect(p))
    //定義一個值等於切出一個一模一樣的粒子陣列，使用這個陣列跑過所有的粒子一次，取出每個粒子的內容和位置;把每個力場抓出來，並使用affect methods影響每個粒子
    if (controls.methods == 'colors' && p.r < 0.4) {
      //條件判斷，刪除半徑小於0.2的粒子
      var pp = sp.splice(pid, 1)
      //splice方法，從自己開始刪除一個符合條件判斷的元素
      delete pp
      //把從陣列中刪除掉的粒子刪除
    } else if (controls.methods == 'fire' && p.r < 20) {
      //條件判斷，刪除半徑小於20的粒子
      var pp = sp.splice(pid, 1)
      //splice方法，從自己開始刪除一個符合條件判斷的元素
      delete pp
      //把從陣列中刪除掉的粒子刪除
    } else if (controls.methods == 'flash' && p.r < 4.5) {
      //條件判斷，刪除半徑小於6的粒子
      var pp = sp.splice(pid, 1)
      //splice方法，從自己開始刪除一個符合條件判斷的元素
      delete pp
      //把從陣列中刪除掉的粒子刪除
    }
  });
  particles = sp
  //現在的陣列等於更新過的粒子陣列
}



//畫面更新(繪製)
function draw() {
  //text draw start
  const c = document.getElementById("canvas-main")
  const gradient = ctx.createLinearGradient(0, 0, c.width, 0)
  gradient.addColorStop(0.4, '#da1d37')
  gradient.addColorStop(0.5, '#0e6ca6')
  gradient.addColorStop(0.6, '#fdcc2f')
  //漸層線性填色設定

  //font-title
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, ww, wh)
  ctx.save()
  ctx.fillStyle = gradient
  ctx.font = '36px Georgia'
  ctx.textAlign = 'center'
  ctx.fillText('Particle Art', ww / 2, wh / 2)
  //font-content
  ctx.fillStyle = "white"
  ctx.font = '14px Georgia'
  ctx.textAlign = 'center'
  ctx.fillText('O p e n    c o n t r o l s    a n d    C h a n g e    m e t h o d s ， f i n d    m o r e    f u n', ww / 2, wh / 1.7)

  //text draw end
  //------------------
  //--------------繪製區域----------------

  particles.forEach(p => { p.draw() })
  //畫出每個粒子
  forcefields.forEach(f => { f.draw() })
  //畫出每個力場






  //------------------
  //滑鼠紅點
  ctx.font = '12px sans-self'
  ctx.fillStyle = "#fa8227"
  ctx.strokeStyle = "#fa8227"
  ctx.beginPath()
  //靶心
  ctx.circle(mousePos, 3)
  ctx.fill()

  //靶心外框
  ctx.circle(mousePos, 9)
  ctx.stroke()


  //靶心十字
  ctx.save()
  ctx.beginPath()
  ctx.translate(mousePos.x, mousePos.y)
  ctx.strokeStyle = "#fa8227"
  let len = 16
  ctx.line(new Vec2(-len, 0), new Vec2(len, 0))
  ctx.fillText(mousePos, 40, -10)
  ctx.rotate(Math.PI / 2)
  ctx.line(new Vec2(-len, 0), new Vec2(len, 0))
  ctx.stroke()

  ctx.restore()

  //提示字體
    ctx.beginPath()
    ctx.fillStyle = '#ededed'
    ctx.font = '12px sans-self'
    if(controls.methods == 'explode') {
      ctx.fillText('Hint：Double Click create explode effect!!' ,130,30)
    }else {
      ctx.fillText('Hint：Double Click create force point!!' ,120,30)
    }



  requestAnimationFrame(draw)
  //優化下次的繪製
}

//頁面載入
function loaded() {
  initCanvas()
  //初始化canvas
  init()
  //初始化
  requestAnimationFrame(draw)
  //優化繪製
  setInterval(update, 1000 / updateFPS)
  //更新的速度，1000/30，每秒更新30次
}

//載入 縮放的事件
window.addEventListener("load", loaded)
window.addEventListener("resize", initCanvas)


//滑鼠事件跟紀錄
var mousePos = new Vec2(0, 0)
var mousePosDown = new Vec2(0, 0)
var mousePosUp = new Vec2(0, 0)
window.addEventListener("mousemove", mousemove)
//監聽移動事件
window.addEventListener("mouseup", mouseup)
//監聽滑鼠放開事件
window.addEventListener("mousedown", mousedown)
//監聽滑鼠點擊事件
window.addEventListener('dblclick', dblclick)
//監聽滑鼠雙擊事件


//雙擊事件
function dblclick(evt) {
  mousePos.set(evt.x, evt.y)
    forcefields.push(new Forcefield({
      p: mousePos.clone()
    }))
  if (controls.methods == 'explode') {
    time++
    particles = particles.concat(Array.from({ length: 100 }, (d, i) => {
      //粒子的陣列等於粒子的陣列設定一個長度(由GUI控制，from(ES6語法))，抓出每一個粒子與位置(d,i)，回傳新的粒子並定義其中的位置、向量、半徑、顏色
      return new Particle({
        //把更新過的陣列指向現在正在產生的陣列
        p: mousePos.clone(),
        v: new Vec2(Math.random() * controls.v / 1 - 5, Math.random() * controls.v / 1 - 5),
        r: Math.random() * 45,
        color: `rgba(${Math.random() * controls.r},${Math.random() * controls.g},${Math.random() * controls.b},${Math.random() * controls.a})`,
      })
    }))
    particles.forEach(p => { p.update() })
    var sp = particles.slice()
  sp.forEach((p,pid)=> {
    if (p.r < 0.5) {
      pp = sp.splice(pid,1)
      delete pp
    }
  })
  particles = sp
  setTimeout(()=>{
    forcefields = [];
  },100)
  }
}

//移動事件
function mousemove(evt) {
  mousePos.set(evt.x, evt.y)
  // console.log(mousePos)
}

//放開事件
function mouseup(evt) {
  mousePos.set(evt.x, evt.y)
  mousePosUp = mousePos.clone()
}

//點擊事件
function mousedown(evt) {
  mousePos.set(evt.x, evt.y)
  mousePosDown = mousePos.clone()
}



//  ------------loadingPage scope------------------

window.onload = function() {
  showTexts();
  var page = document.querySelector('.loadingPage');
  setTimeout(() => {
    page.classList.add('is-none');
  },7000)
}
// gets a random integer 取得亂數整數
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const lineEq = (y2, y1, x2, x1, currentVal) => {
  const m = (y2 - y1) / (x2 - x1);
  const b = y1 - m * x1;
  return m * currentVal + b;
};
//some random chars 隨機陣列
const chars = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','T','U','R','S','X','Y','Z']
// const chars = ['$','%','#','&','=','*','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','.',':',',','^'];
const chartTotal = chars.length;
//randomize letters function 亂數抓取方法
const randomizeLetters = (letters) => {
  return new Promise((resolve, reject) => {
    const lettersTotal = letters.length;
    let cnt = 0;

    letters.forEach((letter, pos) => {
      let loopTimeout;
    const loop = () => {
      letter.innerHTML = chars[getRandomInt(0,chartTotal-1)];
      loopTimeout = setTimeout(loop, getRandomInt(10,500));
    };
    loop();

    const timeout = setTimeout(() => {
      clearTimeout(loopTimeout);
      letter.style.opacity = 1;
      letter.innerHTML = letter.dataset.initial;
      cnt++;
      if ( cnt === lettersTotal ) {
        resolve();
      }
    }, pos*lineEq(200,50,8,100,lettersTotal));
    });
  });
};

//hide each of the letters with random delays. 隨機延遲
const disassembleLetters = (letters) => {
  return new Promise((resolve, reject) => {
    const lettersTotal = letters.length;
    let cnt = 0;

    letters.forEach((letter, pos) => {
      setTimeout(() => {
        letter.style.opacity = 1;
        ++cnt;
        if ( cnt === lettersTotal ) {
          resolve();
        }
      }, pos*50);
    });
  });
}



var text = document.querySelector('.text');
charming(text);
//放入要拆的字體

var titleLetters = Array.from(text.querySelectorAll('span'));
titleLetters.forEach((letter) => {
  letter.dataset.initial = letter.innerHTML;
  letter.style.color = `rgba(${Math.random()*255 + 10},${Math.random()*255 -10},${Math.random()*255 +10},0.8)`;
});
function showTexts() {
    setTimeout(() => {
      randomizeLetters(titleLetters);
      disassembleLetters(titleLetters);
      TweenMax.to(text,0.8,{
        ease: Elastic.easeOut.config(0.5,0.5),
        startAt: {x: '-50%', opacity: 0.8},
        x: '-50%',
        opacity: 0.8
      })
    },1500)
}

