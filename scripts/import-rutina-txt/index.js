/**
 * Script para importar Rutina.txt a MongoDB.
 *
 * Uso:
 *   node scripts/import-rutina-txt/index.js [ruta-a-rutina.txt] [userId]
 *
 * Requiere que MONGODB_URI este definida (via .env en apps/api o como env var).
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../apps/api/.env') });

const path = require('path');
const mongoose = require('mongoose');
const { parseRutinaTxt } = require('./parser');

// Reusa el modelo del API
const Workout = require('../../apps/api/src/models/Workout');

const CURRENT_YEAR = new Date().getFullYear();

async function main() {
  const filePath = process.argv[2] || path.resolve(__dirname, '../../Rutina.txt');
  const userId = process.argv[3];

  if (!userId) {
    console.error('Uso: node scripts/import-rutina-txt/index.js [rutina.txt] <userId>');
    console.error('  userId es obligatorio (ObjectId del usuario en MongoDB)');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no definida. Crea apps/api/.env o exporta la variable.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Conectado a MongoDB');

  // Borrar workouts anteriores del usuario para reimportar limpio
  const deleted = await Workout.deleteMany({ userId });
  console.log(`Eliminadas ${deleted.deletedCount} rutinas anteriores del usuario`);

  const parsed = parseRutinaTxt(filePath);
  console.log(`Parseadas ${parsed.length} rutinas desde ${filePath}`);

  // Calcular años: usa el año del archivo si existe,
  // sino infiere: empiezan en 2025, si mes baja (dic→ene) incrementa
  let inferredYear = 2025;
  let prevMonth = 0;

  let imported = 0;
  for (const w of parsed) {
    let year;
    if (w.anio) {
      year = w.anio;
    } else {
      if (w.mes < prevMonth && prevMonth - w.mes > 6) {
        inferredYear++;
      }
      year = inferredYear;
    }
    prevMonth = w.mes;

    const fecha = new Date(year, w.mes - 1, w.dia);

    const doc = {
      userId,
      fecha,
      fechaTextoOriginal: w.fechaTexto,
      tipo: w.tipo,
      notasGenerales: w.notasGenerales || null,
      ejercicios: w.ejercicios.map((ex) => ({
        nombre: ex.nombre,
        series: ex.series.map((s) => ({
          pesoEtiqueta: s.pesoEtiqueta,
          pesoValor: s.pesoValor,
          repeticiones: s.repeticiones,
          nota: s.nota,
        })),
      })),
    };

    await Workout.create(doc);
    imported++;
    console.log(`  + ${w.fechaTexto} - ${w.tipo} (${w.ejercicios.length} ejercicios)`);
  }

  console.log(`\nImportacion completa: ${imported} rutinas guardadas.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
