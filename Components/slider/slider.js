/**
 * @module SliderDiscrete
 * @version: 1.1637-20180204
 */

/**
 * A power of ten which multiplied is a integer by the specified number.
 * @param {Number} num
 * @returns {Number} - A power of ten.
 */
const toIntegerFactor = function aPowerOfTen(num) {
  const decimalPart = num.toString().split('.')[1];
  const decimalPartLength = decimalPart ? decimalPart.length : 0;

  return 10 ** decimalPartLength;
};

/**
 * Minutes in the time.
 * @param {String} time - Time, it may be 6:24.
 * @returns {Number}
 */
const minutesFromTime = function totalNumberOfMinutes(time) {
  const timeArray = time.split(':');
  return (Number(timeArray[0]) * 60) + Number(timeArray[1]);
};

/**
 * Convert to time format.
 * @param {Number} minutes
 * @returns {String}
 */
const timeFromMinutes = function convertToTimeFormat(minutes) {
  const hours = Math.floor(minutes / 60);
  const min = minutes % 60;
  return `${hours}:${min}`;
};

class SliderDiscrete extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.innerText = `@import url(${this.constructor.styleURL})`;
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

    this.type = this.dataset.step.includes(':') ? 'time' : 'number';
    this.setPropertiesFromDisplay({
      valueMin: this.dataset.valueMin,
      valueMax: this.dataset.valueMax,
      value: this.dataset.value || this.dataset.valueMin,
      step: this.dataset.step || 0,
    });

    this.addEventListener('mousedown', this.onMouseDown);
  }

  /**
   * Notes the slider.
   * @param {MouseEvent} e
   * @event SliderDiscrete#onMouseDown
   */
  onMouseDown(e) {
    this.X = e.screenX;
    this.constructor.current = this;
  }

  /**
   * Count the new value.
   * @param {Number} screenX
   * @event document~onMouseMove
   */
  static onMouseMove({ screenX }) {
    /** @type {SliderDiscrete} */
    const currentSlider = this.current;

    // Stop if no slider is sliding.
    if (!currentSlider) return;

    const {
      offsetWidth,
      range,
      factorToInteger,
      safeStep,
      safeValue,
    } = currentSlider;
    let { valueMin, valueMax, step } = currentSlider.getCSSProperties('valueMin', 'valueMax', 'step');
    valueMin = Number(valueMin);
    valueMax = Number(valueMax);
    step = Number(step);

    const pixelDifference = (screenX - currentSlider.X) / window.devicePixelRatio;
    const valueDifference = pixelDifference / (offsetWidth / range);

    let valueDifferenceBySafeStep;
    if (step === 0) {
      valueDifferenceBySafeStep = valueDifference;
    } else {
      valueDifferenceBySafeStep = Math.round(valueDifference / step) * safeStep;
    }

    let newValue;
    newValue = (valueDifferenceBySafeStep + safeValue) / factorToInteger;
    newValue = currentSlider.constructor.checkValue(newValue, [valueMin, valueMax]);

    currentSlider.setPropertiesFromCountable({ value: newValue });

    currentSlider.X = screenX;
  }

  /**
   * Clear changing slider note.
   */
  static onMouseUp() {
    this.current = null;
  }

  static checkValue(value, [valueMin, valueMax]) {
    let checkedValue = value;

    if (value < valueMin) {
      checkedValue = valueMin;
    } else if (checkedValue > valueMax) {
      checkedValue = valueMax;
    }

    return checkedValue;
  }

  setPropertiesFromCountable(properties) {
    Object.keys(properties).forEach((propertyName) => {
      const countableValue = properties[propertyName];

      this.style.setProperty(this.constructor.cssPropertyNames[propertyName], countableValue);

      let displayValue = countableValue;
      if (this.type === 'time') {
        displayValue = timeFromMinutes(countableValue);
      }

      this.dataset[propertyName] = displayValue;
    });

    this.updateProperties();
  }

  setPropertiesFromDisplay(properties) {
    Object.keys(properties).forEach((propertyName) => {
      const displayValue = properties[propertyName];

      this.dataset[propertyName] = displayValue;

      let countableValue = displayValue;
      if (this.type === 'time') {
        countableValue = minutesFromTime(displayValue);
      }

      this.style.setProperty(this.constructor.cssPropertyNames[propertyName], countableValue);
    });

    this.updateProperties();
  }

  getCSSProperties(...propertyNames) {
    const properties = {};

    propertyNames.forEach((propertyName) => {
      const propertyCSSName = this.constructor.cssPropertyNames[propertyName];
      const propertyValue = this.style.getPropertyValue(propertyCSSName);
      properties[propertyName] = Number(propertyValue);
    });

    return properties;
  }

  updateProperties() {
    const {
      valueMin, valueMax, value, step,
    } = this.getCSSProperties('valueMin', 'valueMax', 'value', 'step');
    this.range = valueMax - valueMin;
    this.factorToInteger = Math.max(toIntegerFactor(valueMin), toIntegerFactor(step));
    this.safeStep = Math.round(step * this.factorToInteger);
    this.safeValue = Math.round(value * this.factorToInteger);

    this.valuer.innerText = this.dataset.value;
  }

  // noinspection JSUnusedGlobalSymbols
  disconnectedCallback() {
    this.removeEventListener('mousedown', this.onMouseDown);
  }

  static store(customName, cssPath) {
    this.styleURL = cssPath;
    customElements.define(customName, this);

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    document.body.addEventListener('mousemove', this.onMouseMove);
    document.body.addEventListener('mouseup', this.onMouseUp);
  }
}

/**
 * @readonly
 * @enum {String}
 */
SliderDiscrete.cssPropertyNames = {
  valueMin: '--value-min',
  valueMax: '--value-max',
  value: '--value',
  step: '--step',
};

export default SliderDiscrete;
