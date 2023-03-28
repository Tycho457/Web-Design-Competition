import './style.css'
import {
  Clock,
  Scene,
  LoadingManager,
  WebGLRenderer,
  sRGBEncoding,
  Group,
  PerspectiveCamera,
  DirectionalLight,
  PointLight,
  MeshPhongMaterial,
  TextureLoader,
  AmbientLight,
  Color,
  Fog
} from 'three';
import {
  TWEEN
} from 'three/examples/jsm/libs/tween.module.min.js';
import {
  DRACOLoader
} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {
  GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader.js';
import '../node_modules/swiper/swiper-bundle.min.js'
import axios from 'axios';


// 定义渲染尺寸
const section = document.getElementsByClassName('section')[0];
let oldMaterial;
let width = section.clientWidth;
let height = section.clientHeight;

// 初始化渲染器
const renderer = new WebGLRenderer({
  canvas: document.querySelector('#canvas-container'),
  antialias: true,
  alpha: true, //透明背景
  powerPreference: 'high-performance'
});
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = true;
renderer.outputEncoding = sRGBEncoding;

// 初始化场景
const scene = new Scene();

// 初始化相机(透视相机)
const cameraGroup = new Group();
scene.add(cameraGroup);
const camera = new PerspectiveCamera(40, width / height, 0.1, 1000)
camera.position.set(19, 1.54, -.1);
cameraGroup.add(camera);


// 页面缩放事件监听
window.addEventListener('resize', () => {
  let section = document.getElementsByClassName('section')[0];
  camera.aspect = section.clientWidth / section.clientHeight
  camera.updateProjectionMatrix();
  renderer.setSize(section.clientWidth, section.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});


// 直射光
const directionLight = new DirectionalLight(0xffffff, .8);
directionLight.position.set(-200, 0, -200);
scene.add(directionLight);
// 点光源(颜色，强度，从光源到光照强度为0的位置，沿着光照距离的衰退量)
const fillLight = new PointLight(0x88ffee, 1.7, 0, 3);
fillLight.position.set(30, 3, 1.8);
scene.add(fillLight);
//环境光
const ambientLight = new AmbientLight(0xdeedff, 1.5);
scene.add(ambientLight);

// 加载管理
const ftsLoader = document.querySelector('.lds-roller');
const loadingCover = document.getElementById('loading-text-intro');
// 初始化加载管理器
const loadingManager = new LoadingManager();
loadingManager.onLoad = () => {
  document.getElementById('enterhtml').innerText = "走进一代伟人"
  document.getElementById('enterhtml').addEventListener('click', () => {
    document.querySelector('.content').style.visibility = 'visible'; // 显示
    const yPosition = {
      y: 0
    };
    // 隐藏加载页面动画
    new TWEEN.Tween(yPosition)
      .to({
        y: 100
      }, 900)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()
      .onUpdate(() => {
        loadingCover.style.setProperty('transform', `translate(0, ${yPosition.y}%)`)
      })
      .onComplete(function () {
        loadingCover.parentNode.removeChild(document.getElementById('loading-text-intro'));
        ftsLoader.parentNode.removeChild(ftsLoader);
        TWEEN.remove(this);
      });

    // 使用Tween给相机添加入场动画
    new TWEEN.Tween(
        camera.position.set(0, 0, 3))
      .to({
        x: 0,
        y: 0,
        z: 9
      }, 3500)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()
      .onComplete(function () {
        TWEEN.remove(this);
        document.querySelector('.header').classList.add('ended');
        document.querySelector('.description').classList.add('ended');
      });
  })

  window.scroll(0, 0)
}

// 使用 dracoLoader 加载用blender压缩过的模型
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
dracoLoader.setDecoderConfig({
  type: 'js'
});

// 模型加载
const loader = new GLTFLoader(loadingManager);
loader.setDRACOLoader(dracoLoader);
loader.load('http://8.134.146.74:3000/public/mao.glb', function (gltf) {
  gltf.scene.traverse((obj) => {});
  scene.add(gltf.scene);
  oldMaterial.dispose();
  renderer.renderLists.dispose();
});

// 鼠标移动时添加虚拟光标
const cursor = {
  x: 0,
  y: 0
};
document.addEventListener('mousemove', event => {
  event.preventDefault();
  cursor.x = event.clientX / window.innerWidth - .5;
  cursor.y = event.clientY / window.innerHeight - .5;
  document.querySelector('.cursor').style.cssText = `left: ${event.clientX}px; top: ${event.clientY}px;`;
}, false);

// 基于容器视图禁用渲染器
let secondContainer = false;
const ob = new IntersectionObserver(payload => {
  secondContainer = payload[0].intersectionRatio > 0.05;
}, {
  threshold: 0.05
});
ob.observe(document.querySelector('.second'));

// 页面重绘动画
const clock = new Clock()
let previousTime = 0;
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;
  const parallaxY = cursor.y;
  const parallaxX = cursor.x
  fillLight.position.y -= (parallaxY * 9 + fillLight.position.y - 2) * deltaTime;
  fillLight.position.x += (parallaxX * 8 - fillLight.position.x) * 2 * deltaTime;
  cameraGroup.position.z -= (parallaxY / 3 + cameraGroup.position.z) * 2 * deltaTime;
  cameraGroup.position.x += (parallaxX / 3 - cameraGroup.position.x) * 2 * deltaTime;
  TWEEN.update();
  secondContainer ? renderer.render(scene, camera) : renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();



// 鼠标悬浮到菜单动画
const btn = document.querySelectorAll('nav > .a');

function update(e) {
  const span = this.querySelector('span');
  if (e.type === 'mouseleave') {
    span.style.cssText = '';
  } else {
    const {
      offsetX: x,
      offsetY: y
    } = e;
    const {
      offsetWidth: width,
      offsetHeight: height
    } = this;
    const walk = 20;
    const xWalk = (x / width) * (walk * 2) - walk,
      yWalk = (y / height) * (walk * 2) - walk;
    span.style.cssText = `transform: translate(${xWalk}px, ${yWalk}px);`
  }
}
btn.forEach(b => b.addEventListener('mousemove', update));
btn.forEach(b => b.addEventListener('mouseleave', update));


// 页面Tab点击事件监听
document.getElementById('one').addEventListener('click', () => {
  document.getElementById('one').classList.add('active');
  document.getElementById('three').classList.remove('active');
  document.getElementById('two').classList.remove('active');
  document.getElementById('four').classList.remove('active');
  document.getElementById('img1').style.display = "block";
  document.getElementById('img2').style.display = "none";
  document.getElementById('img3').style.display = "none";
  document.getElementById('img4').style.display = "none";
  document.getElementById('content').innerHTML = '青年时，毛主席为组织湖南赴法勤工俭学运动第一次到北京。在北京期间，他担任了北京大学图书馆管理员，得到李大钊等人帮助，开始接受俄国十月革命的思想影响。毛主席后来这么形容自己的这次经历，“我自己在北平的生活是十分困苦的。我住在一个叫三眼井的地方，和另外七个人合住一个小房间，我们全体挤在炕上，连呼吸都地方都没有。每逢我翻身都得预先警告身旁的人。不过在公园和故宫的宫址我看到了北国的早春，在坚冰还盖着北海的时候，我看到了怒放的梅花。北京的树木引起了我无穷的欣赏。”在困苦的生活中毛主席也总是充满对生活的欣赏和希望。随后，毛泽东开始了他的海外游学生涯。他先后在美国、英国、法国等国学习，并在那里接触了许多先进的思想和新技术。这些青年经历对他后来的政治生涯产生了深远的影响。';
});

document.getElementById('two').addEventListener('click', () => {
  document.getElementById('two').classList.add('active');
  document.getElementById('one').classList.remove('active');
  document.getElementById('three').classList.remove('active');
  document.getElementById('four').classList.remove('active');
  document.getElementById('img1').style.display = "none";
  document.getElementById('img2').style.display = "block";
  document.getElementById('img3').style.display = "none";
  document.getElementById('img4').style.display = "none";
  document.getElementById('content').innerHTML = '毛主席进入壮年后，渐渐褪去了学生时代的青涩之气，变得更加务实，这个阶段的毛主席，领导过秋收起义，创建过井冈山革命根据地，当选过中华苏维埃共和国主席，还率领红军走过了两万五千里长征，见证了中国革命的整个摸索期，也为中国革命未来的发展指明了方向。在这个时期，毛主席提出过很多伟大的革命理论，比如“枪杆子里出政权”、“党支部建在连上”、“工农武装割据”、“农村包围城市”、“三大纪律八项注意”、“敌进我退，敌驻我扰，敌疲我打，敌退我追”……可惜，当时的中国共产党还是由知识分子领导，看不上毛主席提出的这些“山大王”思想，让毛主席屡次受到排挤，不得不离开领导岗位。但是，历史已经无数次证明，离开了毛主席的正确领导，中国革命就要走弯路，只有把毛主席重新请出来，中国革命才会顺利前进。';
});

document.getElementById('three').addEventListener('click', () => {
  document.getElementById('three').classList.add('active');
  document.getElementById('one').classList.remove('active');
  document.getElementById('two').classList.remove('active');
  document.getElementById('four').classList.remove('active');
  document.getElementById('img1').style.display = "none";
  document.getElementById('img2').style.display = "none";
  document.getElementById('img3').style.display = "block";
  document.getElementById('img4').style.display = "none";
  document.getElementById('content').innerHTML = '毛主席到了中年后，逐渐确立了他在中国革命中的领导地位。自从1935年1月遵义会议开始，毛主席就正式成为了中国革命的领军人物，一个更加伟大的中年时期拉开了序幕。中年时期的毛主席，已经历练出了无人能比的远见卓识，开始在各个领域全面开花，军事方面，领导过抗日战争、解放战争等战争，取得了一个又一个辉煌的胜利。建设方面，毛主席领导创建了中华人民共和国，在一穷二白的基础上，实现了工业、农业、商业的全面发展，全国一片欣欣向荣。理论方面，毛主席写出了《论持久战》《实践论》《矛盾论》等等伟大的著作，这些作品，不光在中国家喻户晓，在全世界也拥有无数拥趸，成为世界各国革命者的宝典。文化方面，毛主席创作出了《沁园春·雪》《七律·长征》《水调歌头·游泳》等等诗词，文风豪放纵横，气吞千古。';
});
document.getElementById('four').addEventListener('click', () => {
  document.getElementById('four').classList.add('active');
  document.getElementById('one').classList.remove('active');
  document.getElementById('two').classList.remove('active');
  document.getElementById('three').classList.remove('active');
  document.getElementById('img1').style.display = "none";
  document.getElementById('img2').style.display = "none";
  document.getElementById('img3').style.display = "none";
  document.getElementById('img4').style.display = "block";
  document.getElementById('content').innerHTML = '毛主席进入壮年后，渐渐褪去了学生时代的青涩之气，变得更加务实，这个阶段的毛主席，领导过秋收起义，创建过井冈山革命根据地，当选过中华苏维埃共和国主席，还率领红军走过了两万五千里长征，见证了中国革命的整个摸索期，也为中国革命未来的发展指明了方向。在这个时期，毛主席提出过很多伟大的革命理论，比如“枪杆子里出政权”、“党支部建在连上”、“工农武装割据”、“农村包围城市”、“三大纪律八项注意”、“敌进我退，敌驻我扰，敌疲我打，敌退我追”……可惜，当时的中国共产党还是由知识分子领导，看不上毛主席提出的这些“山大王”思想，让毛主席屡次受到排挤，不得不离开领导岗位。但是，历史已经无数次证明，离开了毛主席的正确领导，中国革命就要走弯路，只有把毛主席重新请出来，中国革命才会顺利前进。';
});

function isMobile() {
  let flag = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return flag;
}
//思想轮播
var swiper = new Swiper(".mySwiper", {
  pagination: {
    el: ".swiper-pagination1",
    dynamicBullets: true,
  },
});

document.getElementById('weixin').addEventListener('click', () => {
  document.getElementById('zhezhao').style.display = "block";
})
document.getElementById('header-right').addEventListener('click', () => {
  document.getElementById('zhezhao').style.display = "none";
})
document.getElementById('share').addEventListener('click', () => {
  document.getElementById('zhezhao1').style.display = "block";
})
document.getElementById('header-right1').addEventListener('click', () => {
  document.getElementById('zhezhao1').style.display = "none";
})

//PC轮播图
let slideW = 300;
let radius = slideW * 0.5 / Math.sin(Math.PI / 16);
var carouselSwiper = new Swiper('#carousel .swiper', {
  watchSlidesProgress: true,
  slidesPerView: 'auto',
  centeredSlides: false,
  loop: true,
  loopedSlides: 4,
  grabCursor: true,
  autoplay: true,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  on: {
    progress: function (swiper, progress) {
      for (let i = 0; i < this.slides.length; i++) {
        var slide = this.slides.eq(i);
        var slideProgress = this.slides[i].progress;
        var translateX = (slideProgress + 1.5) * (slideW / 3 - Math.cos((slideProgress + 1.5) *
          0.125 * Math.PI) * slideW * 1.1 / 3) + 'px'; //调整图片间距，根据图片宽度改变数值实现自适应
        let rotateY = (slideProgress + 1.5) * 22.5; //图片角度
        var translateZ = (radius - Math.cos((slideProgress + 1.5) * 0.125 * Math.PI) * radius - 150) +
          'px'; //调整图片远近，刚好4个在画框内
        slide.transform('translateX(' + translateX + ') translateZ(' + translateZ + ') rotateY(' +
          rotateY + 'deg)');
      }
    },
    setTransition: function (swiper, transition) {
      for (var i = 0; i < this.slides.length; i++) {
        var slide = this.slides.eq(i)
        slide.transition(transition);
      }
    }
  }
})


// 移动端轮播图
var swiper = new Swiper('.swiper-container', {
  watchSlidesProgress: true, //查看slide的progress
  resistanceRatio: 0, //禁止边缘移动
  on: {
    init: function () {
      let slides = this.slides
      for (let i = 0; i < slides.length; i++) {
        let slide = slides.eq(i)
        slide.css('zIndex', 100 - i); //设置slide的z-index层级
      }
    },

    resize: function (swiper) {
      swiper.update()
    },

    setTranslate: function () {
      let slides = this.slides
      let offsetAfter = this.width * 0.95 //每个slide的位移值
      for (let i = 0; i < slides.length; i++) {
        var slide = slides.eq(i)
        var progress = slides[i].progress

        if (progress <= 0) { //右边slide位移
          slide.transform('translate3d(' + (progress) * offsetAfter + 'px, 0, 0) scale(' + (1 - Math.abs(progress) / 20) + ')');
          slide.css('opacity', (progress + 3)); //最右边slide透明
        }

        if (progress > 0) {
          slide.transform('rotate(' + (-progress) * 5 + 'deg)'); //左边slide旋转
          slide.css('opacity', 1 - progress); //左边slide透明
        }
      }
    },
    setTransition: function (swiper, transition) {
      for (var i = 0; i < this.slides.length; i++) {
        var slide = this.slides.eq(i)
        slide.transition(transition);
      }
    },
  },
});

// 水墨渐变
const elts = {
  text1: document.getElementById("text1"),
  text2: document.getElementById("text2")
};

// The strings to morph between. You can change these to anything you want!
const texts = [
  "独立寒秋，湘江北去，橘子洲头",
  "看万山红遍，层林尽染，漫江碧透，百舸争流",
  "鹰击长空，鱼翔浅底，万类霜天竞自由",
  "怅寥廓，问苍茫大地，谁主沉浮？",
  "携来百侣曾游，忆往昔峥嵘岁月稠",
  "恰同学少年，风华正茂；书生意气，挥斥方遒",
  "指点江山，激扬文字，粪土当年万户侯",
  "曾记否，到中流击水，浪遏飞舟！"
];

// Controls the speed of morphing.
const morphTime = 2;
const cooldownTime = 1.5;

let textIndex = texts.length - 1;
let time = new Date();
let morph = 0;
let cooldown = cooldownTime;

elts.text1.textContent = texts[textIndex % texts.length];
elts.text2.textContent = texts[(textIndex + 1) % texts.length];

function doMorph() {
  morph -= cooldown;
  cooldown = 0;

  let fraction = morph / morphTime;

  if (fraction > 1) {
    cooldown = cooldownTime;
    fraction = 1;
  }

  setMorph(fraction);
}

// A lot of the magic happens here, this is what applies the blur filter to the text.
function setMorph(fraction) {
  // fraction = Math.cos(fraction * Math.PI) / -2 + .5;

  elts.text2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
  elts.text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

  fraction = 1 - fraction;
  elts.text1.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
  elts.text1.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

  elts.text1.textContent = texts[textIndex % texts.length];
  elts.text2.textContent = texts[(textIndex + 1) % texts.length];
}

function doCooldown() {
  morph = 0;

  elts.text2.style.filter = "";
  elts.text2.style.opacity = "100%";

  elts.text1.style.filter = "";
  elts.text1.style.opacity = "0%";
}

// Animation loop, which is called every frame.
function animate() {
  requestAnimationFrame(animate);

  let newTime = new Date();
  let shouldIncrementIndex = cooldown > 0;
  let dt = (newTime - time) / 1000;
  time = newTime;

  cooldown -= dt;

  if (cooldown <= 0) {
    if (shouldIncrementIndex) {
      textIndex++;
    }

    doMorph();
  } else {
    doCooldown();
  }
}

// Start the animation.
animate();

/* 弹幕功能 */
// 弹幕数据
var dataBarrage = []
let instance = axios.create({
  baseURL: 'http://8.134.146.74:5000/api', //基本请求路径
  timeout: 1000, //超时设定
})
var create = function(){
  instance.get('/message').then(res => {
    console.log(res.data)
    dataBarrage = res.data
    console.log(dataBarrage)
    canvasBarrage("#canvasBarrage", dataBarrage)
  })
}


// 弹幕方法
var canvasBarrage = function (canvas, data) {
  
  if (!canvas || !data || !data.length) {
    return;
  }
  if (typeof canvas == "string") {
    canvas = document.querySelector(canvas);
    canvasBarrage(canvas, data);
    return;
  }
  var context = canvas.getContext("2d");
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // 存储实例
  var store = {};

  var fontSize = 28
  // 实例方法
  var Barrage = function (obj, index) {
    // 随机x坐标也就是横坐标，对于y纵坐标，以及变化量moveX
    this.x = (1 + index * 0.1 / Math.random()) * canvas.width;
    this.y =
      obj.range[0] * canvas.height +
      (obj.range[1] - obj.range[0]) * canvas.height * Math.random() +
      36;
    if (this.y < fontSize) {
      this.y = fontSize;
    } else if (this.y > canvas.height - fontSize) {
      this.y = canvas.height - fontSize;
    }
    this.moveX = 1 + Math.random() * 3;

    this.opacity = 0.8 + 0.2 * Math.random();
    this.params = obj;

    this.draw = function () {
      var params = this.params;
      // 根据此时x位置绘制文本
      context.strokeStyle = params.color;
      var width = document.querySelector("html").offsetWidth;
      if (width < 767) {
        context.font = 'bold 1rem "microsoft yahei", sans-serif';
      } else {
        context.font = 'bold ' + fontSize + 'px "microsoft yahei", sans-serif';
      }
      context.fillStyle = "rgba(255,255,255," + this.opacity + ")";
      context.fillText(params.value, this.x, this.y);
      context.strokeText(params.value, this.x, this.y);
    };
  };

  data.forEach(function (obj, index) {
    store[index] = new Barrage(obj, index);
  });

  // 绘制弹幕文本
  var draw = function () {
    for (var index in store) {
      var barrage = store[index];
      // 位置变化
      barrage.x -= barrage.moveX;
      if (barrage.x < -1 * canvas.width * 1.5) {
        // 移动到画布外部时候从左侧开始继续位移
        barrage.x = (1 + index * 0.1 / Math.random()) * canvas.width;
        barrage.y =
          (barrage.params.range[0] +
            (barrage.params.range[1] - barrage.params.range[0]) *
            Math.random()) *
          canvas.height;
        if (barrage.y < fontSize) {
          barrage.y = fontSize;
        } else if (barrage.y > canvas.height - fontSize) {
          barrage.y = canvas.height - fontSize;
        }
        barrage.moveX = 1 + Math.random() * 3;
      }
      // 根据新位置绘制圆圈圈
      store[index].draw();
    }
  };

  // 画布渲染
  var render = function () {
    // 清除画布
    context.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制画布上所有的圆圈圈
    draw();

    // 继续渲染
    requestAnimationFrame(render);
  };

  render();
};

create();

document.getElementById('mycomment').addEventListener('click', () => {
  var rangeBegin = Math.random()
  if(rangeBegin >= 0.8){
    rangeBegin = 0.8
  }
  var data = document.getElementById('textarea').value
  var comment = {
      value: data,
      color: "#813f33",
      range: [rangeBegin, rangeBegin+0.2]
  }
  instance.post('/create', comment).then(res => {
    console.log(res)
    document.getElementById('textarea').value = ""
  })
  create()
  create()
})