const mongoose = require('mongoose');

const setSchema = new mongoose.Schema(
  {
    pesoEtiqueta: { type: String, required: true },
    pesoValor: { type: Number },
    repeticiones: { type: Number, required: true },
    nota: { type: String, default: null },
  },
  { _id: false }
);

const exerciseSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    grupoMuscular: { type: String, default: null },
    series: [setSchema],
  },
  { _id: false }
);

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fecha: { type: Date, required: true },
    fechaTextoOriginal: { type: String, default: null },
    tipo: {
      type: String,
      enum: ['Torso', 'Piernas', 'Full'],
      required: true,
    },
    ejercicios: [exerciseSchema],
    notasGenerales: { type: String, default: null },
  },
  { timestamps: true }
);

workoutSchema.index({ userId: 1, fecha: -1 });
workoutSchema.index({ userId: 1, tipo: 1 });
workoutSchema.index({ userId: 1, 'ejercicios.nombre': 1 });

workoutSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Workout', workoutSchema);
