export async function loadRapaportMatrix(shape: 'Round' | 'Pear'): Promise<RapaportMatrix> {
  const shapeKey = shape.toLowerCase();
  
  // Fallback to localStorage
  try {
    const local = localStorage.getItem(`rapnet_matrix_${shapeKey}`);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.error(`Local storage read failed for ${shape} Rapaport matrix:`, e);
  }

  // Generate fallback GIA pricing matrix
  const fallback = generateMockRapaportMatrix(shape);
  try {
    localStorage.setItem(`rapnet_matrix_${shapeKey}`, JSON.stringify(fallback));
  } catch (e) {}
  return fallback;
}

export async function saveRapaportMatrix(shape: 'Round' | 'Pear', matrix: RapaportMatrix): Promise<void> {
  const shapeKey = shape.toLowerCase();
  
  try {
    localStorage.setItem(`rapnet_matrix_${shapeKey}`, JSON.stringify(matrix));
    localStorage.setItem('rapnet_last_sync_time', new Date().toISOString());
  } catch (e) {
    console.warn("localStorage quota exceeded:", e);
  }
}

export interface RapaportRate {
  l: number; // low size
  h: number; // high size
  p: number; // price per carat
}

export interface RapaportMatrix {
  [color_clarity: string]: RapaportRate[];
}

export const CALC_SHAPES = [
  'Round', 'Pear', 'Princess', 'Marquise', 'Sq. Emerald', 'Oval', 'Radiant', 
  'Emerald', 'Trilliant', 'Heart', 'European Cut', 'Old Miner', 'Flanders', 
  'Cushion Brilliant', 'Cushion Modified', 'Epaulette', 'Asscher', 'Baguette', 
  'Kite', 'Star', 'Other', 'Half Moon', 'Trapezoid', 'Bullets', 'Hexagonal', 
  'Lozenge', 'Pentagonal', 'Rose', 'Shield', 'Square', 'Triangular', 'Briolette', 
  'Octagonal', 'Tapered Baguette', 'Square Radiant', 'Calf', 'Tapered Bullet', 
  'Circular', 'Circular Brilliant'
];

export const CALC_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];

export const CALC_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'];

// Standard GIA size brackets for Rapaport calculations
export const SIZE_BRACKETS = [
  { l: 0.01, h: 0.29 },
  { l: 0.30, h: 0.39 },
  { l: 0.40, h: 0.49 },
  { l: 0.50, h: 0.69 },
  { l: 0.70, h: 0.89 },
  { l: 0.90, h: 0.99 },
  { l: 1.00, h: 1.49 },
  { l: 1.50, h: 1.99 },
  { l: 2.00, h: 2.99 },
  { l: 3.00, h: 3.99 },
  { l: 4.00, h: 4.99 },
  { l: 5.00, h: 9.99 },
  { l: 10.00, h: 99.99 }
];

// Generates highly realistic fallback pricing based on industry standards
function generateFallbackPrice(
  shape: string,
  color: string,
  clarity: string,
  weight: number
): number {
  // Base price index for 1ct D-FL round diamond (~$14,000 / ct)
  let basePrice = 14000;

  // Color discount multiplier (D=1.0, decreases to M=0.3)
  const colorIndex = CALC_COLORS.indexOf(color.toUpperCase());
  const colorMultiplier = colorIndex !== -1 ? (1 - colorIndex * 0.07) : 0.5;

  // Clarity discount multiplier (FL=1.0, IF=0.95 down to I3=0.15)
  const clarityIndex = CALC_CLARITIES.indexOf(clarity.toUpperCase());
  const clarityMultiplier = clarityIndex !== -1 ? (1 - clarityIndex * 0.08) : 0.4;

  // Carat bracket multiplier
  let bracketMultiplier = 1.0;
  if (weight < 0.30) bracketMultiplier = 0.15;
  else if (weight < 0.40) bracketMultiplier = 0.28;
  else if (weight < 0.50) bracketMultiplier = 0.38;
  else if (weight < 0.70) bracketMultiplier = 0.55;
  else if (weight < 0.90) bracketMultiplier = 0.70;
  else if (weight < 1.00) bracketMultiplier = 0.85;
  else if (weight < 1.50) bracketMultiplier = 1.0; // Base 1ct
  else if (weight < 2.00) bracketMultiplier = 1.45;
  else if (weight < 3.00) bracketMultiplier = 2.10;
  else if (weight < 4.00) bracketMultiplier = 3.30;
  else if (weight < 5.00) bracketMultiplier = 4.60;
  else bracketMultiplier = 6.00;

  // Shape adjustments (fancy shapes are usually cheaper than round by 10-25%)
  const isRound = shape.toLowerCase().includes('round') || shape.toLowerCase().includes('circular');
  const shapeMultiplier = isRound ? 1.0 : 0.82;

  // Calculate rate per carat
  let rate = basePrice * colorMultiplier * clarityMultiplier * bracketMultiplier * shapeMultiplier;
  
  // Ensure minimum realistic rate
  return Math.max(300, Math.round(rate));
}

// Generate an entire mock matrix for testing and seeding
export function generateMockRapaportMatrix(shape: 'Round' | 'Pear'): RapaportMatrix {
  const matrix: RapaportMatrix = {};
  for (const color of CALC_COLORS) {
    for (const clarity of CALC_CLARITIES) {
      const key = `${color.toLowerCase()}_${clarity.toLowerCase()}`;
      matrix[key] = SIZE_BRACKETS.map(bracket => {
        const midWeight = (bracket.l + bracket.h) / 2;
        return {
          l: bracket.l,
          h: bracket.h,
          p: generateFallbackPrice(shape, color, clarity, midWeight)
        };
      });
    }
  }
  return matrix;
}



// Calculator core execution
export interface CalculationResult {
  rawRate: number;     // List price per carat
  rawTotal: number;    // Base list total (rate * weight)
  markupRate: number;  // Price per carat with markup
  markupTotal: number; // Final total with markup
  markupAmount: number; // Diff between final and base
}

export async function calculateDiamondPrice(
  shape: string,
  weight: number,
  color: string,
  clarity: string,
  markupPercent: number
): Promise<CalculationResult> {
  if (weight <= 0) {
    return { rawRate: 0, rawTotal: 0, markupRate: 0, markupTotal: 0, markupAmount: 0 };
  }

  // Choose matrix (Round vs Pear/Fancy)
  const isRound = shape.toLowerCase().includes('round') || shape.toLowerCase().includes('circular');
  const matrixShape = isRound ? 'Round' : 'Pear';
  
  const matrix = await loadRapaportMatrix(matrixShape);
  const key = `${color.toLowerCase()}_${clarity.toLowerCase()}`;
  
  // If FL is requested but only IF is in database, fallback to IF (standard industry match)
  let activeKey = key;
  if (!matrix[activeKey] && clarity.toLowerCase() === 'fl') {
    activeKey = `${color.toLowerCase()}_if`;
  }

  let rate = 0;
  const rates = matrix[activeKey] || [];
  for (const r of rates) {
    if (weight >= r.l && weight <= r.h) {
      rate = r.p;
      break;
    }
  }

  // If not found in custom matrix, compute via realistic fallback generator
  if (rate === 0) {
    rate = generateFallbackPrice(shape, color, clarity, weight);
  }

  const rawTotal = rate * weight;
  const markupMultiplier = 1 + markupPercent / 100;
  const markupRate = rate * markupMultiplier;
  const markupTotal = rawTotal * markupMultiplier;
  const markupAmount = markupTotal - rawTotal;

  return {
    rawRate: Math.round(rate),
    rawTotal: Math.round(rawTotal * 100) / 100,
    markupRate: Math.round(markupRate * 100) / 100,
    markupTotal: Math.round(markupTotal * 100) / 100,
    markupAmount: Math.round(markupAmount * 100) / 100
  };
}

// Local parser for custom CSV files uploaded by admin
export function parseRapaportCSV(csvText: string): RapaportMatrix {
  const matrix: RapaportMatrix = {};
  const lines = csvText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split CSV line safely
    const data = line.split(',').map(s => s.trim().replace(/["']/g, ''));
    if (data.length < 6) continue;

    // Skip header line if it contains non-numeric indicator
    if (data[0].toLowerCase().includes('shape') || data[3].toLowerCase().includes('low')) {
      continue;
    }

    const shape = data[0];
    const clarity = data[1].toLowerCase();
    const color = data[2].toLowerCase();
    const lowSize = parseFloat(data[3]);
    const highSize = parseFloat(data[4]);
    const caratPrice = parseFloat(data[5].replace(/,/g, ''));

    if (isNaN(lowSize) || isNaN(highSize) || isNaN(caratPrice)) {
      continue;
    }

    const key = `${color}_${clarity}`;
    if (!matrix[key]) {
      matrix[key] = [];
    }

    matrix[key].push({
      l: lowSize,
      h: highSize,
      p: caratPrice
    });
  }

  return matrix;
}

// Local parser for Rapaport API style JSON files uploaded by admin
export function parseRapaportJSON(jsonText: string): RapaportMatrix {
  const matrix: RapaportMatrix = {};
  const rawData = JSON.parse(jsonText);

  if (!Array.isArray(rawData)) {
    throw new Error("JSON structure is not an array");
  }

  for (const row of rawData) {
    if (!row.color || !row.clarity || row.low_size === undefined || row.high_size === undefined || row.caratprice === undefined) {
      continue;
    }

    const color = row.color.toLowerCase();
    const clarity = row.clarity.toLowerCase();
    const lowSize = parseFloat(row.low_size);
    const highSize = parseFloat(row.high_size);
    const caratPrice = parseFloat(row.caratprice);

    if (isNaN(lowSize) || isNaN(highSize) || isNaN(caratPrice)) {
      continue;
    }

    const key = `${color}_${clarity}`;
    if (!matrix[key]) {
      matrix[key] = [];
    }

    matrix[key].push({
      l: lowSize,
      h: highSize,
      p: caratPrice
    });
  }

  return matrix;
}
