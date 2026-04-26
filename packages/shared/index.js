// Shared constants
const WORKOUT_TYPES = ['Torso', 'Piernas', 'Full'];

const PESO_REGEX = /^(\d+\.?\d*)\+*$/;

function parsePeso(etiqueta) {
  const match = etiqueta.match(PESO_REGEX);
  return match ? parseFloat(match[1]) : null;
}

module.exports = { WORKOUT_TYPES, PESO_REGEX, parsePeso };
