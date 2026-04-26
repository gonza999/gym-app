const fs = require('fs');
const path = require('path');

const DATE_REGEX = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;
const TIPO_MAP = {
  torso: 'Torso',
  piernas: 'Piernas',
  pierna: 'Piernas',
  full: 'Full',
  'full body': 'Full',
  'fullbody': 'Full',
};

/**
 * Detecta si una línea es un tipo de rutina. Acepta variantes:
 * "Piernas", "Pierna", "Full body", "Fullbody", "Torso casa", etc.
 */
function detectTipo(line) {
  const lower = line.toLowerCase().trim();
  for (const [key, value] of Object.entries(TIPO_MAP)) {
    if (lower === key || lower.startsWith(key + ' ')) return value;
  }
  return null;
}

/**
 * Intenta parsear una línea como serie de ejercicio.
 * Formatos soportados:
 *   "40.5 15"           → peso=40.5, reps=15
 *   "31.5+ 12"          → peso=31.5+, reps=12
 *   "31.7++ 7"          → peso=31.7++, reps=7
 *   "49++ 6"            → peso=49++, reps=6
 *   "25 8 spot"         → peso=25, reps=8, nota=spot
 *   "25 ayuda 10"       → peso=25, reps=10, nota=ayuda
 *   "110kg"             → peso=110kg, reps=null (solo peso, sin reps)
 *   "Calentamiento 30kg"→ null (es texto descriptivo, no serie)
 *   "10kg +10lbs 5"     → peso="10kg +10lbs", reps=5
 *   "10kg+5 8"          → peso="10kg+5", reps=8
 *   "49-40 8"           → peso="49-40", reps=8
 *   "25 c/l 9"          → peso=25, reps=9, nota="c/l"
 *   "12c/u 15"          → peso="12c/u", reps=15
 *   "45lbs"             → peso="45lbs", reps=null
 *   "22.7 lbs"          → peso="22.7 lbs", reps=null (lbs sin número después)
 */
function parseSerie(line) {
  // Skip lines that are clearly not series (start with text words)
  if (/^(calentamiento|_)/i.test(line)) return null;

  // Pattern: "peso reps [nota]" or "peso nota reps" — peso starts with digit
  // Also handle "peso texto reps" like "25 ayuda 10" or "25 8 spot"
  if (/^\d/.test(line) || /^\d/.test(line.replace(/^_/, ''))) {
    // Try: everything up to last number group = peso+nota, last number = reps (if nota before reps)
    // Primary pattern: tokens where we find peso at start, reps somewhere
    const tokens = line.split(/\s+/);

    // Strategy: find the rightmost standalone integer that looks like reps (1-50 range)
    // Everything before it is peso+nota, everything after is nota
    let bestRepsIdx = -1;
    for (let i = tokens.length - 1; i >= 1; i--) {
      if (/^\d+$/.test(tokens[i]) && parseInt(tokens[i], 10) <= 50) {
        bestRepsIdx = i;
        break;
      }
    }

    if (bestRepsIdx >= 1) {
      const repeticiones = parseInt(tokens[bestRepsIdx], 10);
      const pesoTokens = tokens.slice(0, bestRepsIdx);
      const notaTokens = tokens.slice(bestRepsIdx + 1);

      // Check if peso part contains only non-numeric text (like "calentamiento barra")
      const pesoStr = pesoTokens.join(' ');
      if (!/\d/.test(pesoStr)) return null; // no digits in peso = not a serie

      const nota = notaTokens.length > 0 ? notaTokens.join(' ') : null;
      const numMatch = pesoStr.match(/^(\d+\.?\d*)/);
      const pesoValor = numMatch ? parseFloat(numMatch[1]) : null;

      return {
        pesoEtiqueta: pesoStr,
        pesoValor,
        repeticiones,
        nota,
      };
    }

    // No reps found — might be a weight-only line like "110kg" or "40kg"
    // We'll store it with reps=0 so it's not lost
    const weightOnly = line.trim();
    if (/\d/.test(weightOnly)) {
      const numMatch = weightOnly.match(/^(\d+\.?\d*)/);
      const pesoValor = numMatch ? parseFloat(numMatch[1]) : null;
      return {
        pesoEtiqueta: weightOnly,
        pesoValor,
        repeticiones: 0,
        nota: 'sin reps registradas',
      };
    }
  }

  return null;
}

/**
 * Parsea el archivo Rutina.txt y devuelve un array de objetos workout.
 */
function parseRutinaTxt(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  const workouts = [];
  let current = null;
  let currentExercise = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Strip leading underscores (some exercises prefixed with _)
    line = line.replace(/^_\s*/, '');

    // Detect date dd/mm (possibly with extra text like "15/11 sin dormir,sali")
    const dateMatch = line.match(DATE_REGEX);
    if (dateMatch) {
      if (current) {
        if (currentExercise && currentExercise.series.length > 0) {
          current.ejercicios.push(currentExercise);
        }
        if (current.tipo && current.ejercicios.length > 0) {
          workouts.push(current);
        }
      }

      const extraText = line.slice(dateMatch[0].length).trim();
      let anio = null;
      if (dateMatch[3]) {
        anio = parseInt(dateMatch[3], 10);
        if (anio < 100) anio += 2000; // 25 → 2025
      }
      current = {
        fechaTexto: line,
        dia: parseInt(dateMatch[1], 10),
        mes: parseInt(dateMatch[2], 10),
        anio,
        tipo: null,
        ejercicios: [],
        notasGenerales: extraText || null,
      };
      currentExercise = null;
      continue;
    }

    if (!current) continue;

    // Detect workout type (if not yet set)
    if (!current.tipo) {
      const tipo = detectTipo(line);
      if (tipo) {
        current.tipo = tipo;
        continue;
      }
    }

    // Try to parse as a serie
    const serie = parseSerie(line);
    if (serie && currentExercise) {
      currentExercise.series.push(serie);
      continue;
    }

    // If we get here with a serie but no currentExercise, skip (shouldn't happen)
    if (serie && !currentExercise) continue;

    // Otherwise it's an exercise name
    // Skip lines that look like "Calentamiento ..." as standalone
    if (/^calentamiento\b/i.test(line)) continue;

    if (currentExercise && currentExercise.series.length > 0) {
      current.ejercicios.push(currentExercise);
    }
    currentExercise = { nombre: line, series: [] };
  }

  // Close last workout
  if (current) {
    if (currentExercise && currentExercise.series.length > 0) {
      current.ejercicios.push(currentExercise);
    }
    if (current.tipo && current.ejercicios.length > 0) {
      workouts.push(current);
    }
  }

  return workouts;
}

module.exports = { parseRutinaTxt };

if (require.main === module) {
  const file = process.argv[2] || path.resolve(__dirname, '../../Rutina.txt');
  const result = parseRutinaTxt(file);
  console.log(JSON.stringify(result, null, 2));
  console.log(`\nTotal: ${result.length} rutinas parseadas`);
}
