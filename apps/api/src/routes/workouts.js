const { Router } = require('express');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');

const router = Router();

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Todas las rutas requieren autenticacion
router.use(auth);

// GET /api/workouts/stats
router.get('/stats', async (req, res) => {
  const mongoose = require('mongoose');
  const uid = new mongoose.Types.ObjectId(req.userId);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalResult, tipoResult, lastWorkout, semanaActual, mesActual, allDates] =
    await Promise.all([
      Workout.countDocuments({ userId: uid }),
      Workout.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: '$tipo', count: { $sum: 1 } } },
      ]),
      Workout.findOne({ userId: uid }).sort({ fecha: -1 }).lean(),
      Workout.countDocuments({ userId: uid, fecha: { $gte: startOfWeek } }),
      Workout.countDocuments({ userId: uid, fecha: { $gte: startOfMonth } }),
      Workout.find({ userId: uid })
        .select('fecha')
        .sort({ fecha: -1 })
        .lean(),
    ]);

  const porTipo = {};
  for (const t of tipoResult) porTipo[t._id] = t.count;

  // Calculate streak (consecutive days with workouts, counting from today backwards)
  let racha = 0;
  if (allDates.length > 0) {
    const uniqueDays = [
      ...new Set(
        allDates.map((d) => {
          const dt = new Date(d.fecha);
          return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
        })
      ),
    ];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);
    // If no workout today, start from yesterday
    const firstDay = uniqueDays[0];
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    if (firstDay !== todayStr) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    for (let i = 0; i < 365; i++) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (uniqueDays.includes(key)) {
        racha++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  res.json({
    total: totalResult,
    porTipo,
    ultimoEntrenamiento: lastWorkout ? lastWorkout.fecha : null,
    semanaActual,
    mesActual,
    racha,
  });
});

// GET /api/workouts/exercises — unique exercise names with count and last date
router.get('/exercises', async (req, res) => {
  const mongoose = require('mongoose');
  const uid = new mongoose.Types.ObjectId(req.userId);

  const result = await Workout.aggregate([
    { $match: { userId: uid } },
    { $unwind: '$ejercicios' },
    {
      $group: {
        _id: '$ejercicios.nombre',
        count: { $sum: 1 },
        lastDate: { $max: '$fecha' },
        lastWeight: { $last: '$ejercicios.series' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const exercises = result.map((r) => {
    const lastSeries = r.lastWeight || [];
    const lastPeso = lastSeries.length > 0 ? lastSeries[0].pesoEtiqueta : null;
    return {
      nombre: r._id,
      count: r.count,
      lastDate: r.lastDate,
      lastPeso,
    };
  });

  res.json({ exercises });
});

// GET /api/workouts/exercises/maxes — max weight from the LAST workout per exercise
router.get('/exercises/maxes', async (req, res) => {
  const mongoose = require('mongoose');
  const uid = new mongoose.Types.ObjectId(req.userId);

  const result = await Workout.aggregate([
    { $match: { userId: uid } },
    { $unwind: '$ejercicios' },
    { $unwind: '$ejercicios.series' },
    {
      $match: {
        'ejercicios.series.pesoValor': { $ne: null, $exists: true },
        // Excluir entradas sin reps reales (importadas como "sin reps registradas")
        'ejercicios.series.repeticiones': { $gt: 0 },
      },
    },
    // 1) Para cada (ejercicio, fecha) calcular el peso máximo de ese día
    {
      $group: {
        _id: { nombre: '$ejercicios.nombre', fecha: '$fecha' },
        pesoValor: { $max: '$ejercicios.series.pesoValor' },
        series: { $push: '$ejercicios.series' },
      },
    },
    // 2) Ordenar por fecha desc para que $first tome la sesión más reciente
    { $sort: { '_id.fecha': -1 } },
    {
      $group: {
        _id: '$_id.nombre',
        pesoValor: { $first: '$pesoValor' },
        series: { $first: '$series' },
        fecha: { $first: '$_id.fecha' },
      },
    },
  ]);

  const maxes = {};
  for (const r of result) {
    // Elegir la serie con mayor pesoValor en esa última sesión
    const top = (r.series || [])
      .filter((s) => s && s.pesoValor != null && s.repeticiones > 0)
      .sort((a, b) => (b.pesoValor ?? 0) - (a.pesoValor ?? 0))[0];

    maxes[r._id] = {
      pesoValor: r.pesoValor,
      pesoEtiqueta: top ? top.pesoEtiqueta : String(r.pesoValor),
      repeticiones: top ? top.repeticiones : null,
      fecha: r.fecha,
    };
  }

  res.json({ maxes });
});

// GET /api/workouts/exercises/:name/history — all sets for a specific exercise over time
router.get('/exercises/:name/history', async (req, res) => {
  const mongoose = require('mongoose');
  const uid = new mongoose.Types.ObjectId(req.userId);
  const name = decodeURIComponent(req.params.name);

  const result = await Workout.aggregate([
    {
      $match: {
        userId: uid,
        'ejercicios.nombre': { $regex: `^${escapeRegExp(name)}$`, $options: 'i' },
      },
    },
    { $sort: { fecha: 1 } },
    { $unwind: '$ejercicios' },
    {
      $match: {
        'ejercicios.nombre': { $regex: `^${escapeRegExp(name)}$`, $options: 'i' },
      },
    },
    {
      $project: {
        fecha: 1,
        tipo: 1,
        series: '$ejercicios.series',
      },
    },
  ]);

  res.json({ history: result });
});

// GET /api/workouts/calendar?year=2026&month=4 — lightweight calendar data
router.get('/calendar', async (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) {
    return res.status(400).json({ error: 'year y month son obligatorios' });
  }
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  const workouts = await Workout.find({
    userId: req.userId,
    fecha: { $gte: start, $lte: end },
  })
    .select('fecha tipo')
    .sort({ fecha: 1 })
    .lean();

  const days = workouts.map((w) => ({
    id: w._id,
    fecha: w.fecha,
    tipo: w.tipo,
  }));

  res.json({ days });
});

// GET /api/workouts
router.get('/', async (req, res) => {
  const { tipo, ejercicio, desde, hasta, page = 1, limit = 20 } = req.query;
  const filter = { userId: req.userId };

  if (tipo) {
    if (!['Torso', 'Piernas', 'Full'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }
    filter.tipo = tipo;
  }
  if (ejercicio) {
    filter['ejercicios.nombre'] = { $regex: escapeRegExp(ejercicio), $options: 'i' };
  }
  if (desde || hasta) {
    filter.fecha = {};
    if (desde) filter.fecha.$gte = new Date(desde);
    if (hasta) filter.fecha.$lte = new Date(hasta);
  }

  const pg = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pg - 1) * lim;
  const [workouts, total] = await Promise.all([
    Workout.find(filter)
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(lim),
    Workout.countDocuments(filter),
  ]);

  res.json({
    workouts,
    page: pg,
    totalPages: Math.ceil(total / lim),
    total,
  });
});

// GET /api/workouts/:id
router.get('/:id', async (req, res) => {
  const workout = await Workout.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!workout) return res.status(404).json({ error: 'Rutina no encontrada' });
  res.json({ workout });
});

// POST /api/workouts
router.post('/', async (req, res) => {
  const { fecha, tipo, ejercicios, fechaTextoOriginal, notasGenerales } = req.body;

  if (!fecha || !tipo || !ejercicios?.length) {
    return res.status(400).json({ error: 'fecha, tipo y ejercicios son obligatorios' });
  }
  if (!['Torso', 'Piernas', 'Full'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo inválido' });
  }
  if (isNaN(Date.parse(fecha))) {
    return res.status(400).json({ error: 'Fecha inválida' });
  }

  const workout = await Workout.create({
    userId: req.userId,
    fecha: new Date(fecha),
    fechaTextoOriginal,
    tipo,
    ejercicios,
    notasGenerales,
  });

  res.status(201).json({ workout });
});

// PATCH /api/workouts/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['fecha', 'tipo', 'ejercicios', 'notasGenerales'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.tipo && !['Torso', 'Piernas', 'Full'].includes(updates.tipo)) {
    return res.status(400).json({ error: 'Tipo inválido' });
  }
  if (updates.fecha) {
    if (isNaN(Date.parse(updates.fecha))) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }
    updates.fecha = new Date(updates.fecha);
  }

  const workout = await Workout.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    updates,
    { new: true, runValidators: true }
  );

  if (!workout) return res.status(404).json({ error: 'Rutina no encontrada' });
  res.json({ workout });
});

// DELETE /api/workouts/:id
router.delete('/:id', async (req, res) => {
  const workout = await Workout.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!workout) return res.status(404).json({ error: 'Rutina no encontrada' });
  res.json({ ok: true });
});

module.exports = router;
