/* COPYRIGHT
* Author: Wang Hua
* License: MIT
* Version: 1.1457-20180127
* 
* 
*/
class SliderDiscrete extends HTMLElement {
	constructor () {
		super();

		let shadow = this.attachShadow({mode: 'open'});

		let style = document.createElement('style'),
			styleUrl = "slider.css";
		style.innerText = `@import url(${styleUrl})`
		shadow.appendChild(style);

		this.fill = document.createElement('div');
		this.fill.className = 'fill';
		shadow.appendChild(this.fill);

		this.thumb = document.createElement('div');
		this.thumb.className = 'thumb';
		shadow.appendChild(this.thumb);

		this.valuer = document.createElement('div');
		this.valuer.className = 'valuer';
		this.valuer.innerText = this.style.getPropertyValue('--value');
		shadow.appendChild(this.valuer);

		this.addEventListener('mousedown', this.take);
		document.body.addEventListener('mousemove', this.move.bind(this));
		document.body.addEventListener('mouseup', this.done.bind(this));
		this.value = Number(this.style.getPropertyValue('--value')) || Number(this.style.getPropertyValue('--value-min'));
		this.moving = false;
	}

	take (e) {
		this.X = e.screenX;
		this.moving = true;
	}

	move (e) {
		if (!this.moving) return;
		requestAnimationFrame(this.change.bind(this, e));
	}

	change (e) {
		const width = this.offsetWidth;
		const valueMin = this.style.getPropertyValue('--value-min');
		const valueMax = this.style.getPropertyValue('--value-max');
		const step = Number(this.style.getPropertyValue('--step'));
		const factorToInteger = Math.max(this.toIntegerFactor(valueMin),this.toIntegerFactor(step));
		let range,pixelDifference,valueDifference,valueDifferenceBySafeStep,safeValue,newValue;
		range = valueMax - valueMin;
		pixelDifference = (e.screenX - this.X) / devicePixelRatio;
		valueDifference = pixelDifference / (width / range);
		valueDifferenceBySafeStep = step === 0 ? valueDifference : Math.round(valueDifference / step) * (step * factorToInteger);
		safeValue = this.value * factorToInteger;
		newValue = (valueDifferenceBySafeStep + safeValue) / factorToInteger;
		newValue = newValue < valueMin ? valueMin : (newValue > valueMax ? valueMax : newValue);
		if (step !== 0 && newValue.toString().length > 7) debugger;
		this.style.setProperty('--value',newValue);
		this.valuer.innerText = newValue;
	}

	done (e) {
		if (!this.moving) return;
		this.X = e.screenX;
		this.value = Number(this.style.getPropertyValue('--value'));
		this.moving = false;
	}

	toIntegerFactor (num) {
		let factor;

		if (Number.isInteger(+num)) {
			factor = 1;
		} else {
			factor = 10 ** num.toString().split('.')[1].length;
		}

		return factor;
	}
}

customElements.define('slider-discrete', SliderDiscrete);