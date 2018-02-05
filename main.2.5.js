/**
 * @version 1.2177-20180205
 */

import SliderDiscrete from './Components/slider/slider.js';
import Ripple from './Components/Ripple/Ripple.js';

// Custom Element
SliderDiscrete.store('slider-discrete','./Components/slider/slider.css');

// Click Effect
Ripple.load();

let root = window.location.pathname;
if (root.endsWith('/')) {
  root = root.slice(0, -1);
}

const mask = document.getElementById('mask');
const waiter = document.getElementById('waiter');
// const menu = document.getElementById('menu');
const GetOn = document.getElementById('GetOn');
let playing = false;

const axisVertical = ['ArrowUp', 'ArrowDown'];
const axisHorizontal = ['ArrowLeft', 'ArrowRight'];
let keyPressing = [];
let speeding;
/**
 * Stop moving.
 */
function stop() {
  keyPressing = [];
}

/**
 * Pause the game.
 */
function pause() {
  mask.classList.remove('playing');
  playing = false;
  stop();
}

/**
 * Continue the game.
 */
function play() {
  mask.classList.add('playing');
  playing = true;
}

waiter.addEventListener('click', pause);
GetOn.addEventListener('click', play);

/**
 * Show a message
 * @param {string} m
 */
function message(m) {
}

const school = document.getElementById('school');
const livings = document.getElementById('livings');
const schoolCTX = school.getContext('2d');
const livingsCTX = livings.getContext('2d');

livings.width = window.innerWidth;
livings.height = window.innerHeight;

// noinspection SpellCheckingInspection
const modName = 'NongKen';
const modPath = `mods/${modName}`;
const schoolImage = new Image();

/**
 * @type {Object}
 * @property {Object} people
 * @property {Object} people.color
 * @property {Object} people.me
 * @property {Number} people.normalRadius
 * @property {Object} school
 * @property {Object} state
 */
let settings;

const people = {};

fetch(`${root}/${modPath}/settings.json`).then((res) => {
  if (res.ok) {
    res.json().then((data) => {
      settings = data;
      people.me = settings.people.me;
      people.me.speed = 0;
      schoolImage.src = `${root}/${modPath}/${settings.school.path}`;
    });
  } else {
    message(`读取校园模组时出现错误。状态 ${res.status}`);
  }
}, (e) => {
  message(`不知道为什么加载失败了：${e}`);
});

/**
 * Draw a man on the canvas
 * @param {Object} guy - the man
 * @property {String} guy.charisma
 * @property {String} guy.letter
 * @property {Number} guy.radius
 * @property {String} guy.sex
 * @param {Number} x
 * @param {Number} y
 */
const drawGuy = function drawAManOnTheCanvas(
  guy = people.me,
  [x, y] = [livings.width / 2, livings.height / 2],
) {
  const type = guy.sex === 'male' ? 'boys' : 'girls';
  const color = `rgba(${settings.people.color[type]},${1 - (settings.people.color.range * guy.charisma * 0.01)})`;
  const radius = guy.radius || settings.people.normalRadius;
  const direction = guy.direction * (Math.PI / 180);

  const cacheLivings = document.createElement('canvas');
  cacheLivings.width = window.innerWidth;
  cacheLivings.height = window.innerHeight;
  const cacheLivingsCTX = cacheLivings.getContext('2d');
  cacheLivingsCTX.font = `800 ${radius * 0.8}px Roboto,sans-serif`;
  cacheLivingsCTX.textAlign = 'center';
  cacheLivingsCTX.textBaseline = 'middle';

  cacheLivingsCTX.fillStyle = '#fff';
  cacheLivingsCTX.arc(x, y, radius + 1, 0, 2 * Math.PI);
  cacheLivingsCTX.fill();

  cacheLivingsCTX.fillStyle = color;
  cacheLivingsCTX.arc(x, y, radius, 0, 2 * Math.PI);
  cacheLivingsCTX.fill();

  cacheLivingsCTX.fillStyle = '#444';
  cacheLivingsCTX.translate(x, y);
  cacheLivingsCTX.rotate(direction);
  cacheLivingsCTX.fillText(guy.letter, 0, 0);

  livingsCTX.drawImage(cacheLivings, 0, 0);
};

/**
 * Be quick.
 */
const speedUp = function hurryUp() {
  window.cancelAnimationFrame(speeding);
  speeding = requestAnimationFrame(() => {
    if (people.me.speed > 4) {
      people.me.speed = 4;
      return;
    }
    people.me.speed += 0.07;
    speedUp();
  });
};

/**
 * Have a rest.
 */
const speedDown = function slowDown() {
  window.cancelAnimationFrame(speeding);
  speeding = requestAnimationFrame(() => {
    if (people.me.speed < 0) {
      people.me.speed = 0;
      keyPressing = [];
      return;
    }
    people.me.speed -= 0.15;
    speedDown();
  });
};

const update = function goToAnotherPlace() {
  const direction = people.me.direction - settings.state.rotate;
  const { speed } = people.me;
  if (keyPressing.includes(axisVertical[0])) {
    settings.state.y -= speed * Math.cos(direction * (Math.PI / 180));
    settings.state.x += speed * Math.sin(direction * (Math.PI / 180));
  } else if (keyPressing.includes(axisVertical[1])) {
    settings.state.y += speed * Math.cos(direction * (Math.PI / 180));
    settings.state.x -= speed * Math.sin(direction * (Math.PI / 180));
  }
  if (keyPressing.includes(axisHorizontal[0])) {
    people.me.direction -= 4 - (speed / 2);
  } else if (keyPressing.includes(axisHorizontal[1])) {
    people.me.direction += 4 - (speed / 2);
  }
  requestAnimationFrame(() => {
    const { x, y, rotate } = settings.state;
    const X = x - (window.innerWidth / 2);
    const Y = y - (window.innerHeight / 2);
    // My position.
    school.style.transformOrigin = `${x}px ${y}px`;
    // -X -Y, to the center of the screen.
    school.style.transform = `translate3d(${-X}px,${-Y}px,0) rotate(${rotate}deg)`;

    livingsCTX.clearRect(0, 0, livings.width, livings.height);
    // cacheLivingsCTX.clearRect(0, 0, livings.width, livings.height);
    drawGuy();

    update();
  });
};

const turn = function lookAround(e) {
  if (!playing) return;
  if (!(axisVertical.includes(e.key) || axisHorizontal.includes(e.key))) return;

  if (e.type === 'keydown') {
    if (keyPressing.includes(e.key)) return;

    const horizontal = axisHorizontal.includes(e.key);
    const axis = horizontal ? axisHorizontal : axisVertical;
    const oppositeDirection = axis[axis.indexOf(e.key) === 0 ? 1 : 0];
    if (keyPressing.includes(oppositeDirection)) {
      keyPressing.splice(keyPressing.indexOf(oppositeDirection), 1);
    }
    keyPressing.push(e.key);
    if (!horizontal) {
      speedUp();
    }
  } else if (e.type === 'keyup') {
    if (!keyPressing.includes(e.key)) return;

    if (axisHorizontal.includes(e.key)) {
      keyPressing.splice(keyPressing.indexOf(e.key), 1);
    } else {
      speedDown();
    }
  }
};

const hexToRgb = hex => hex.slice(1).match(/.{2}/g).map(x => parseInt(x, 16)).join();

/**
 * Prepare for playing.
 */
const load = function prepareForTheGame() {
  // Math.round: We suggested integers.
  const schoolWidthMultiple = settings.school.width.split('%')[0] * 0.01;
  const schoolAspectRatio = schoolImage.width / schoolImage.height;
  settings.school.width = Math.round(window.innerWidth * schoolWidthMultiple);
  settings.school.height = Math.round(settings.school.width / schoolAspectRatio);

  settings.state.x = settings.school.width * settings.state.x.split('%')[0] * 0.01;
  settings.state.y = settings.school.height * settings.state.y.split('%')[0] * 0.01;
  settings.state.rotate = settings.state.rotate || 0;

  settings.people.color.boys = hexToRgb(settings.people.color.boys);
  settings.people.color.girls = hexToRgb(settings.people.color.girls);

  school.width = settings.school.width;
  school.height = settings.school.height;
  schoolCTX.drawImage(schoolImage, 0, 0, school.width, school.height);

  document.addEventListener('keydown', turn);
  document.addEventListener('keyup', turn);

  drawGuy();
  update();
};

schoolImage.onload = load;
