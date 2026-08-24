import { storage } from './storage.js';

export const COLOR_VISION_MODES = ['none', 'protanopia', 'deuteranopia', 'tritanopia'];
export const FONT_SIZES = ['normal', 'large', 'xlarge'];

const DEFAULTS = {
  colorVision: 'none',
  fontSize: 'normal'
};

export function getAccessibilitySettings() {
  const saved = storage.get('accessibility', DEFAULTS) || DEFAULTS;
  return {
    colorVision: COLOR_VISION_MODES.includes(saved.colorVision) ? saved.colorVision : DEFAULTS.colorVision,
    fontSize: FONT_SIZES.includes(saved.fontSize) ? saved.fontSize : DEFAULTS.fontSize
  };
}

export function applyAccessibilitySettings(settings = getAccessibilitySettings()) {
  document.documentElement.setAttribute('data-color-vision', settings.colorVision);
  document.documentElement.setAttribute('data-font-size', settings.fontSize);
}

export function setColorVision(mode) {
  const current = getAccessibilitySettings();
  current.colorVision = COLOR_VISION_MODES.includes(mode) ? mode : 'none';
  storage.set('accessibility', current);
  applyAccessibilitySettings(current);
}

export function setFontSize(size) {
  const current = getAccessibilitySettings();
  current.fontSize = FONT_SIZES.includes(size) ? size : 'normal';
  storage.set('accessibility', current);
  applyAccessibilitySettings(current);
}

export function initAccessibility() {
  applyAccessibilitySettings(getAccessibilitySettings());
}
