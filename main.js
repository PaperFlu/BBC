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



const canvas = document.getElementById('school');
let ctx = canvas.getContext('2d');
canvas.width = screen.width;
canvas.height = screen.height;

let mod = 'NongKen';
let settings;
let school = new Image();
school.onload = load;
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
	message(`取不到学校模组。${e}`);
});

function load() {
	settings.school.height = settings.school.height || settings.school.width / (school.width / school.height);
	settings.state.x = settings.state.x.includes('%') ? settings.school.width * settings.state.x.split('%')[0] * 0.01 : settings.state.x;
	settings.state.y = settings.state.y.includes('%') ? settings.school.height * settings.state.y.split('%')[0] * 0.01 : settings.state.y;
	settings.state.rotate = settings.state.rotate || 0;
	drawImage();
	drawGuy();
	document.addEventListener('keydown', turn);
	document.addEventListener('keyup', stop);
	move();
}

function drawImage(img = school) {
	const {width, height} = settings.school;
	const {x, y, rotate} = settings.state;
	ctx.save();
	ctx.translate(canvas.width / 2,canvas.height / 2);
	ctx.rotate(rotate * Math.PI / 180);
	ctx.drawImage(img, -x, -y, width, height);
	ctx.restore();
}

function drawGuy(guy = settings.people.me, [x,y] = [canvas.width / 2,canvas.height / 2]) {
	const type = guy.sex === 'male' ? 'boys' : 'girls';
	const radius = guy.radius || settings.people.normalRadius;
	ctx.save();

	ctx.fillStyle = '#fff';
	ctx.arc(x, y, radius, 0, 2 * Math.PI);
	ctx.fill();

	ctx.shadowBlur = radius / 3;
	ctx.shadowColor = 'rgba(0,0,0,0.5)';
	ctx.fillStyle = `rgba(${hexToRgb(settings.people.color[type])},${1 - settings.people.color.range * guy.charisma * 0.01})`;
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
const hexToRgb = hex => hex.slice(1).match(/.{2}/g).map(x => parseInt(x, 16)).join();

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
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		drawImage();
		drawGuy();

		move();
	});
}

function stop() {

}