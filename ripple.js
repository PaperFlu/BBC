/* COPYRIGHT
* Author: Wang Hua
* License: MIT
* Version: 1.1346-20180127
* 
* 
*/
let Ripple = {
	store (ele) {
		ele.addEventListener('mousedown', Ripple.start);
		ele.addEventListener('mouseup', Ripple.blur);
		ele.addEventListener('animationend', Ripple.end);
		ele.setAttribute('O','');
		ele.ripple = {animating: false,focusing: false};
	},

	start ({offsetX: X, offsetY: Y}) {
		const diameter = Math.max(this.clientWidth, this.clientHeight) * 0.6;
		this.style.setProperty('--ripple-center', `${this.clientWidth / 2}px, ${this.clientHeight / 2}px`);
		this.style.setProperty('--ripple-kiss-point', `${X}px, ${Y}px`);
		this.style.setProperty('--ripple-diameter', `${diameter}px`);
		this.style.setProperty('--ripple-scale', Math.hypot(this.clientWidth, this.clientHeight) / diameter);
		this.classList.remove('ripple-ended');
		this.classList.add('ripple-running');

		this.ripple.animating = true
		this.ripple.focusing = true;
	},

	blur (e) {
		this.ripple.focusing = false;
		if (this.ripple.animating) return;
		this.classList.remove('ripple-running');
		this.classList.add('ripple-ended');
	},

	end ({animationName: animationName}) {
		if (animationName !== 'ripple-running') return;

		this.ripple.animating = false;
		if (this.ripple.focusing) return;
		this.classList.remove('ripple-running');
		this.classList.add('ripple-ended');
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const lakes = document.querySelectorAll('[O]');
	for (const lake of lakes) Ripple.store(lake);
});