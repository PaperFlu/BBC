/**
 * @module Ripple
 * @version 1.1437-20180204
 */

/**
 * Set multiple properties in once.
 * @param {HTMLElement} ele
 * @param {Object} properties
 */
const setStyleProperties = function setMultipleProperties(ele, properties) {
  Object.keys(properties).forEach((propertyName) => {
    const value = properties[propertyName];
    ele.style.setProperty(propertyName, value);
  });
};

/**
 * Replace the specified class with the other specified class.
 * @param {Element} ele - specified element.
 * @param {String} from - the class which would be replace.
 * @param {String} to - the new class.
 */
const classSwitch = function ReplaceTheClassWithOneAnother(ele, [from, to]) {
  ele.classList.remove(from);
  ele.classList.add(to);
};

const Ripple = {
  /** @type {{animating: boolean, focusing: boolean, current: Element|null}} */
  state: {
    animating: false,
    focusing: false,
    current: null,
  },

  animationNames: {
    running: 'ripple-running',
    ended: 'ripple-ended',
  },

  /**
   * Apply the effect to the marked elements.
   */
  load() {
    document.body.addEventListener('mousedown', Ripple.start);
    document.body.addEventListener('mouseup', Ripple.blur);
    document.body.addEventListener('animationend', Ripple.animationEnd);
    const lakes = document.querySelectorAll('[O]');
    lakes.forEach(lake => Ripple.store(lake));
  },

  /**
   * Apply the effect to the specified element.
   * @param {Element} ele
   */
  store(ele) {
    ele.setAttribute('O', '');
  },

  /**
   * Start the effect when mouse goes down.
   * @param {Number} X
   * @param {Number} Y
   * @param {HTMLElement} ele
   * @event document~start
   */
  start({ offsetX: X, offsetY: Y, target }) {
    // End if it hasn't been choose.
    if (!target.hasAttribute('O')) return;

    // Be ready to create a ripple.
    Ripple.end();
    Ripple.state.animating = true;
    Ripple.state.focusing = true;
    Ripple.state.current = target;

    // The ripple's diameter is 60% of the longer one between the width and the height.
    const diameter = Math.max(target.clientWidth, target.clientHeight) * 0.6;
    setStyleProperties(target, {
      '--ripple-center': `${target.clientWidth / 2}px, ${target.clientHeight / 2}px`,
      '--ripple-kiss-point': `${X}px, ${Y}px`,
      '--ripple-diameter': `${diameter}px`,
      '--ripple-scale': Math.hypot(target.clientWidth, target.clientHeight) / diameter,
    });
    classSwitch(target, [Ripple.animationNames.ended, Ripple.animationNames.running]);
  },

  /**
   * End the effect when mouse goes up if the animation has ended.
   * @event document~blur
   */
  blur() {
    // Stop if nothing is rippling.
    if (!Ripple.state.current) return;

    Ripple.state.focusing = false;

    // Stop if it is still rippling.
    if (Ripple.state.animating) return;

    Ripple.end(Ripple.state.current);
  },

  /**
   * End the effect at the end of the animation if the mouse has upped.
   * @param {String} animationName
   * @param {HTMLElement} target
   * @event document~animationEnd
   */
  animationEnd({ animationName, target }) {
    // Stop if the animation is not the one we want.
    if (animationName !== Ripple.animationNames.running) return;

    // Stop if nothing is rippling.
    if (!Ripple.state.current) return;

    Ripple.state.animating = false;

    // Stop if it is still focusing.
    if (Ripple.state.focusing) return;

    Ripple.end(Ripple.state.current);
  },

  /**
   * End the ripple.
   */
  end() {
    // Stop if nothing is rippling.
    if (!Ripple.state.current) return;

    // End CSS animation.
    classSwitch(Ripple.state.current, [Ripple.animationNames.running, Ripple.animationNames.ended]);

    // Restore the state.
    Ripple.state.current = null;
  },
};

export default Ripple;
