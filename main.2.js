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



const game = document.getElementById('game');
const school = document.getElementById('school');
const livings = document.getElementById('livings');

let ctx = livings.getContext('2d');

school.onload = load;

let mod = 'NongKen';
let settings;

fetch(`/${mod}/settings.json`).then((res) => {
	if (res.ok) {
		res.json().then((data) => {
			settings = data;
			school.src = `${mod}/${settings.school.path}`;
		});
	} else {
		message(`读取校园模组时出现错误。状态${res.status}`);
	}
}, (e) => {
	message(`不知道为什么加载失败了。${e}`);
});

function load() {
	settings.school.height = settings.school.height || settings.school.width / (school.width / school.height);
	settings.state.x = settings.state.x.includes('%') ? settings.school.width * settings.state.x.split('%')[0] * 0.01 : settings.state.x;
	settings.state.y = settings.state.y.includes('%') ? settings.school.height * settings.state.y.split('%')[0] * 0.01 : settings.state.y;
	settings.state.rotate = settings.state.rotate || 0;
	settings.people.color.boys = hexToRgb(settings.people.color.boys);
	settings.people.color.girls = hexToRgb(settings.people.color.girls);

	school.width = settings.school.width;
	school.height = settings.school.height;

	livings.width = settings.school.width;
	livings.height = settings.school.height;
	drawGuy();
	document.addEventListener('keydown', turn);
	document.addEventListener('keyup', stop);
	move();
}
const hexToRgb = hex => hex.slice(1).match(/.{2}/g).map(x => parseInt(x, 16)).join();

function drawGuy(guy = settings.people.me, [x,y] = [settings.state.x, settings.state.y]) {
	const type = guy.sex === 'male' ? 'boys' : 'girls';
	const radius = guy.radius || settings.people.normalRadius;
	ctx.save();

	ctx.fillStyle = '#fff';
	ctx.arc(x, y, radius, 0, 2 * Math.PI);
	ctx.fill();

	ctx.shadowBlur = radius / 4;
	ctx.shadowColor = 'rgba(0,0,0,0.5)';
	ctx.fillStyle = `rgba(${settings.people.color[type]},${1 - settings.people.color.range * guy.charisma * 0.01})`;
	ctx.arc(x, y, radius, 0, 2 * Math.PI);
	ctx.fill();
	ctx.restore();

	ctx.fillStyle = '#444';
	ctx.font = `800 ${radius * 0.8}px Roboto,sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(guy.letter, x,y);

	ctx.restore();
}

const directions = ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'];
let direction;
function turn(e) {
	if (!directions.includes(e.key)) return;
	direction = e.key;
}

function move() {
	switch (direction) {
		case directions[0]:
			settings.state.y -= 4;
			break;
		case directions[1]:
			settings.state.x += 4;
			break;
		case directions[2]:
			settings.state.y += 4;
			break;
		case directions[3]:
			settings.state.x -= 4;
			break;
	}
	requestAnimationFrame((e) => {
		const {x, y, rotate} = settings.state;
		const innerX = x - innerWidth / 2;
		const innerY = y - innerHeight / 2;
		game.style.transformOrigin = `${x}px ${y}px`;
		game.style.transform = `translate3d(${- innerX}px,${- innerY}px,0) rotate(${rotate}deg)`;

		// ctx.clearRect(0, 0, livings.width, livings.height);
		// drawGuy();

		move();
	});
}

function stop() {
	direction = null;
}