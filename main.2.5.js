/* COPYRIGHT
* Author: Wang Hua
* License: MIT
* Version: 1.1754-20180128
* 
* 
*/
const mask = document.getElementById('mask');
const waiter = document.getElementById('waiter');
const menu = document.getElementById('menu');
const GetOn = document.getElementById('GetOn');
let playing = false;

function pause() {
	mask.classList.remove('playing');
	playing = false;
	stop();
}
function play() {
	mask.classList.add('playing');
	playing = true;
}

waiter.addEventListener('click', pause);
GetOn.addEventListener('click', play);



function message(m) {
	console.log(m);
}



const school = document.getElementById('school');
const livings = document.getElementById('livings');
let schoolCtx = school.getContext('2d');
let livingsCtx = livings.getContext('2d');

livings.width = window.innerWidth;
livings.height = window.innerHeight;

let mod = 'NongKen';
let settings;
const schoolImage = new Image();
schoolImage.onload = load;

let people = {};

fetch(`/${mod}/settings.json`).then((res) => {
	if (res.ok) {
		res.json().then((data) => {
			settings = data;
			people.me = settings.people.me;
			people.me.speed = 0;
			schoolImage.src = `/${mod}/${settings.school.path}`
		});
	} else {
		message(`读取校园模组时出现错误。状态${res.status}`);
	}
}, (e) => {
	message(`不知道为什么加载失败了。${e}`);
});

function load() {
	// Math.round: We suggested integers.
	settings.school.width = Math.round(window.innerWidth * settings.school.width.split('%')[0] * 0.01);
	settings.school.height = Math.round(settings.school.width / (schoolImage.width / schoolImage.height));

	settings.state.x = settings.school.width * settings.state.x.split('%')[0] * 0.01;
	settings.state.y = settings.school.height * settings.state.y.split('%')[0] * 0.01;
	settings.state.rotate = settings.state.rotate || 0;

	settings.people.color.boys = hexToRgb(settings.people.color.boys);
	settings.people.color.girls = hexToRgb(settings.people.color.girls);

	school.width = settings.school.width;
	school.height = settings.school.height;
	schoolCtx.drawImage(schoolImage,0,0,school.width,school.height);

	drawGuy();
	move();
	document.addEventListener('keydown', turn);
	document.addEventListener('keyup', turn);
}
const hexToRgb = hex => hex.slice(1).match(/.{2}/g).map(x => parseInt(x, 16)).join();

function drawGuy(guy = people.me, [x,y] = [livings.width / 2, livings.height / 2]) {
	const type = guy.sex === 'male' ? 'boys' : 'girls';
	const color = `rgba(${settings.people.color[type]},${1 - settings.people.color.range * guy.charisma * 0.01})`;
	const radius = guy.radius || settings.people.normalRadius;
	const direction = guy.direction * (Math.PI / 180);

	const cache_livings = document.createElement('canvas');
	cache_livings.width = window.innerWidth;
	cache_livings.height = window.innerHeight;
	let cache_livingsCtx = cache_livings.getContext('2d');
	cache_livingsCtx.font = `800 ${radius * 0.8}px Roboto,sans-serif`;
	cache_livingsCtx.textAlign = 'center';
	cache_livingsCtx.textBaseline = 'middle';

	cache_livingsCtx.fillStyle = '#fff';
	cache_livingsCtx.arc(x, y, radius + 1, 0, 2 * Math.PI);
	cache_livingsCtx.fill();

	cache_livingsCtx.fillStyle = color;
	cache_livingsCtx.arc(x, y, radius, 0, 2 * Math.PI);
	cache_livingsCtx.fill();

	cache_livingsCtx.fillStyle = '#444';
	cache_livingsCtx.translate(x,y);
	cache_livingsCtx.rotate(direction);
	cache_livingsCtx.fillText(guy.letter, 0,0);

	livingsCtx.drawImage(cache_livings,0,0);
}

const axisVertical = ['ArrowUp','ArrowDown'];
const axisHorizontal = ['ArrowLeft','ArrowRight'];
let keyPressing = [];
let speeding;

function turn(e) {
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
}

function speedUp() {
	window.cancelAnimationFrame(speeding);
	speeding = requestAnimationFrame((e) => {
		if (people.me.speed > 4) {
			people.me.speed = 4;
			return;
		}
		people.me.speed += 0.07;
		speedUp();
	});
}

function move() {
	const direction = people.me.direction - settings.state.rotate;
	const speed = people.me.speed;
	if (keyPressing.includes(axisVertical[0])) {
		settings.state.y -= speed * Math.cos(direction * (Math.PI / 180));
		settings.state.x += speed * Math.sin(direction * (Math.PI / 180));
	} else if (keyPressing.includes(axisVertical[1])) {
		settings.state.y += speed * Math.cos(direction * (Math.PI / 180));
		settings.state.x -= speed * Math.sin(direction * (Math.PI / 180));
	}
	if (keyPressing.includes(axisHorizontal[0])) {
		people.me.direction -= 4 - speed / 2;
	} else if (keyPressing.includes(axisHorizontal[1])) {
		people.me.direction += 4 - speed / 2;
	}
	requestAnimationFrame((e) => {
		const {x, y, rotate} = settings.state;
		const X = x - window.innerWidth / 2;
		const Y = y - window.innerHeight / 2;
		// My position.
		school.style.transformOrigin = `${x}px ${y}px`;
		// -X -Y, to the center of the screen.
		school.style.transform = `translate3d(${- X}px,${- Y}px,0) rotate(${rotate}deg)`;

		livingsCtx.clearRect(0, 0, livings.width, livings.height);
		// cache_livingsCtx.clearRect(0, 0, livings.width, livings.height);
		drawGuy();

		move();
	});
}

function speedDown() {
	window.cancelAnimationFrame(speeding);
	speeding = requestAnimationFrame((e) => {
		if (people.me.speed < 0) {
			people.me.speed = 0;
			keyPressing = [];
			return;
		}
		people.me.speed -= 0.1;
		speedDown();
	});
}

function stop() {
	keyPressing = [];
}