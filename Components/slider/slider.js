/**
 * @version: 1.1642-20180205
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
    this.setProperties({
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
    const { valueMin, valueMax, step } = currentSlider.getCSSProperties('valueMin', 'valueMax', 'step');

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

    currentSlider.setProperties({ value: newValue }, false);

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

  setProperties(properties, readable = true) {
    const propertyNames = Object.keys(properties);

    propertyNames.forEach((propertyName) => {
      const value = properties[propertyName];
      let countableValue = value;
      let readableValue = value;
      if (readable) {
        switch (this.type) {
          case 'time': {
            countableValue = minutesFromTime(value);
            break;
          }
          default: {
            break;
          }
        }
      } else {
        switch (this.type) {
          case 'time': {
            readableValue = timeFromMinutes(value);
            break;
          }
          default: {
            break;
          }
        }
      }

      // CSS countable part.
      this.style.setProperty(this.constructor.cssPropertyNames[propertyName], countableValue);

      // HTML readable part.
      this.dataset[propertyName] = readableValue;
    });

    // Get ready for the next change.
    if (
      propertyNames.includes('valueMin')
      || propertyNames.includes('valueMax')
      || propertyNames.includes('step')
    ) {
      const { valueMin, valueMax, step = 0 } = this.getCSSProperties('valueMin', 'valueMax', 'step');
      this.range = valueMax - valueMin;
      this.factorToInteger = Math.max(
        toIntegerFactor(valueMin),
        toIntegerFactor(valueMax),
        toIntegerFactor(step),
      );
      this.safeStep = Math.round(step * this.factorToInteger);
    }
    if (propertyNames.includes('value')) {
      // Valuer update.
      this.valuer.innerText = this.dataset.value;

      const { value } = this.getCSSProperties('value');
      this.safeValue = Math.round(value * this.factorToInteger);
    }
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

  // noinspection JSUnusedGlobalSymbols
  disconnectedCallback() {
    this.removeEventListener('mousedown', this.onMouseDown);
  }

  static store(customName, cssPath) {
    // Determine the location.
    if (cssPath) this.styleURL = cssPath;

    customElements.define(customName, this);

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    document.body.addEventListener('mousemove', this.onMouseMove);
    document.body.addEventListener('mouseup', this.onMouseUp);
  }
}

/**
 * The location of the style(.css) file.
 * @type {string} - Absolute path.
 */
SliderDiscrete.styleURL = 'slider.css';

/**
 * The sliding slider.
 * @type {?SliderDiscrete}
 */
SliderDiscrete.current = null;

/**
 * Corresponds to the custom CSS variables on which the style transformations is based.
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
