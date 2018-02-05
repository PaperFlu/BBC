/**
 * @version: 1.1637-20180204
 */

/**
 * A power of ten which multiplied is a integer by the specified number.
 * @param {number} num
 * @returns {number} - A power of ten.
 */
const toIntegerFactor = function aPowerOfTen(num) {
  const decimalPart = num.toString().split('.')[1];
  const decimalPartLength = decimalPart ? decimalPart.length : 0;

  return 10 ** decimalPartLength;
};

/**
 * Minutes in the time.
 * @param {string} time - Time, it may be 6:24.
 * @returns {number}
 */
const minutesFromTime = function totalNumberOfMinutes(time) {
  const timeArray = time.split(':');
  return (Number(timeArray[0]) * 60) + Number(timeArray[1]);
};

/**
 * Convert to time format.
 * @param {number} minutes
 * @returns {string}
 */
const timeFromMinutes = function convertToTimeFormat(minutes) {
  const hours = Math.floor(minutes / 60);
  const min = minutes % 60;
  return `${hours}:${min}`;
};

/**
 * @class
 */
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
   * @param {number} e.screenX
   * @event SliderDiscrete#onMouseDown
   */
  onMouseDown({ screenX }) {
    this.X = screenX;
    this.constructor.current = this;
  }

  /**
   * Count the new value.
   * @param {MouseEvent} e
   * @param {number} e.screenX
   * @event document~onMouseMove
   */
  static onMouseMove({ screenX }) {
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

  /**
   * Legalize the value if it is illegal.
   * @param {number} value
   * @param {number[]} range - Legal range.
   * @returns {number}
   */
  static checkValue(value, [valueMin, valueMax]) {
    let checkedValue = value;

    if (value < valueMin) {
      checkedValue = valueMin;
    } else if (checkedValue > valueMax) {
      checkedValue = valueMax;
    }

    return checkedValue;
  }

  /**
   * Set the related property value by a countable number.
   * @param {Object} properties
   */
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

  /**
   * Set the related property value by a readable string.
   * @param {Object} properties
   */
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

  /**
   * Get the required attributes
   * @param {...string} propertyNames
   * @returns {Object} - A property map
   */
  getCSSProperties(...propertyNames) {
    const properties = {};

    propertyNames.forEach((propertyName) => {
      const propertyCSSName = this.constructor.cssPropertyNames[propertyName];
      const propertyValue = this.style.getPropertyValue(propertyCSSName);
      properties[propertyName] = Number(propertyValue);
    });

    return properties;
  }

  /**
   * Done the change.
   */
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

SliderDiscrete.styleURL = 'slider.css';

/**
 * @type {SliderDiscrete}
 */
SliderDiscrete.current = null;

/**
 * @readonly
 * @enum {string}
 */
SliderDiscrete.cssPropertyNames = {
  valueMin: '--value-min',
  valueMax: '--value-max',
  value: '--value',
  step: '--step',
};

export default SliderDiscrete;
