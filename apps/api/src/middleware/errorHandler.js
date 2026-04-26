function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Datos invalidos', details: messages });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Registro duplicado' });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Error interno del servidor' : err.message;
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
