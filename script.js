const COLORS = [0xFE2712, 0xFC600A, 0xFB9902, 0xFCCC1A, 0xFEFE33, 0xB2D732, 0x66B032, 0x347C98, 0x0247FE, 0x4424D6, 0x8601AF, 0xC21460];
const STEP_SIZE = 25;

// Constants for saturation reductions
const TINT = 0xFFFFFF;
const TONE = 0x888888;
const SHADE = 0x0;

// Color difference sensitivity
const COLOR_SENSITIVITY = 3;

//// Color theory
// Make a gradual reduction from 'saturatedColor' to 'reducerColor'
// based on perceptual steps.
function reduce(saturatedColor, reducerColor) {
  const steps = distance(saturatedColor, reducerColor)
  return blendColors(saturatedColor, reducerColor, Math.max(2,steps));
}
function complimentary(color) {
  const index = COLORS.indexOf(color);
  if (index < 0) {
    // Not one of the predefined colors, do calculation?
    throw new Error("Unsupported complimentary origin");
  }
  // Shift 6 positions in the wheel
  return COLORS[(index + 6) % COLORS.length];
}

//// Rendering
function renderChart(parent, color) {
  appendRow(parent, reduce(color, TINT));
  appendRow(parent, reduce(color, TONE));
  appendRow(parent, reduce(color, SHADE));
  appendRow(parent, [color, grayscaleToRgbHex(toGrayscale(color))]);
  appendRow(parent, blendColors(color, complimentary(color), 9));
}

function appendRow(parent, colorArray) {
  const row = document.createElement('div');
  for (color of colorArray) {
    row.appendChild(createSwatch(color));
  }
  parent.appendChild(row);
}
function createSwatch(color) {
  const swatch = document.createElement('div');
  swatch.className = 'swatch';
  const cssHex = toCssHex(color);
  swatch.style.background = cssHex;
  swatch.addEventListener('mousedown', () => {
    canvas.style.background = cssHex;
  });
  swatch.addEventListener('mouseup', () => {
    canvas.style.background = '';
  });
  swatch.addEventListener('mouseout', () => {
    canvas.style.background = '';
  });
  return swatch;
}

//// Utils/conversions
// Convert from javascript numerical hex representation to css.
// e.g. from 0x111 to #000111
function toCssHex(color) {
  return '#' + color.toString(16).padStart(6, '0');
}
function blendColors(colorStart, colorEnd, steps) {
  const start = toRgb(colorStart);
  const end = toRgb(colorEnd);
  const result = [];
  for (let step = 0; step <= steps; step++) {
    const shift = step/steps;
    result.push(toColor(
      start.r + (end.r - start.r) * shift,
      start.g + (end.g - start.g) * shift,
      start.b + (end.b - start.b) * shift,
    ));
  }
  return result;
}
// Conversion of color to grayscale using BT.709 / Luma
// See https://en.wikipedia.org/wiki/Rec._709
function toGrayscale(color) {
  const {r,g,b} = toRgb(color);
  //return Math.round(0.2126*r + 0.7152*g + 0.0722*b);
    return Math.round(0.35*r + 0.6*g + 0.1*b);
}
// Calculates distance between rgb values between 0 and 10.
// 0 is the same color, 10 is as different as can be.
function distance(origin, destination) {
  if (distance === origin) {
    return 0;
  }
  
  const o = toRgb(origin);
  const d = toRgb(destination);

  // See https://en.wikipedia.org/wiki/Color_difference#sRGB
  const lowRed = ((o.r + d.r) / 2) < 128;
  const rco = lowRed ? 2 : 3;
  const gco = 4;
  const bco = lowRed ? 3 : 2;
  
  // Standard 3d distance formula, with weights for approximate
  // human perception.
  const dist = Math.sqrt(
    rco * Math.pow(d.r - o.r, 2) +
    gco * Math.pow(d.g - o.g, 2) +
    bco * Math.pow(d.b - o.b, 2));
    
  // Scale to 0-9
  if (dist <= 50) return 2;
  if (dist > 750) return 9;
  return Math.floor(((dist - 50)/700) * 7) + 2;
}
// Convert grayscale int to rgb composite.
function grayscaleToRgbHex(value) {
  return toColor(value, value, value);
}
// Convert to separate rgb channels.
function toRgb(color) {
  // Bit shift to access rgb values.
  return {
    r:(color >> 16) & 255,
    g:(color >> 8) & 255,
    b:color & 255,
  };
}
function toColor(r, g, b) {
  return (bounds(r) << 16) + (bounds(g) << 8) + bounds(b);
}
function bounds(channel) {
  return Math.min(255, Math.max(0, Math.round(channel)));
}
function colorFromMouseEvent(mouseEvent, size) {
  const radians = Math.atan2(mouseEvent.offsetY - size/2, mouseEvent.offsetX - size/2);
  // Multiplying by 6 (rather than 180) since we're working with 12 colors (and not 360 deg).
  // Adding 15 to move align the index to our COLOR list (atan returns -6 to 6, with 0 
  // starting at yellow orange, and our color list starts at red).
  const index = (Math.floor((radians * 6) / Math.PI) +15) % COLORS.length;
  return COLORS[index];
}

// Initialization
const canvas = document.getElementById('canvas');
const wheel = document.getElementById('wheel');
const focusColor = document.getElementById('focus-color');
wheel.addEventListener('mousemove', (event) => {
  focusColor.style.background = toCssHex(colorFromMouseEvent(event, 120));
});
wheel.addEventListener('mouseout', () => {
  focusColor.style.background = 'inherit';
});
wheel.addEventListener('dragout', () => {
  focusColor.style.background = 'inherit';
});
wheel.addEventListener('click', (event) => {
  canvas.innerHTML = '';
  renderChart(canvas, colorFromMouseEvent(event, 120));
});
renderChart(canvas, COLORS[0]);
