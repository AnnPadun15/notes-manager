const express = require('express');
const path = require('path');
const notes = require('./notes.json');

const app = express();
const PORT = 3000;

// Повертає список нотаток у форматі JSON
app.get('/api/notes', (req, res) => {
  const notesForApi = notes.map((note) => ({
    id: note.id,
    title: note.title,
    category: note.category,
    categoryName: note.categoryName,
    text: note.excerpt
  }));

  res.json(notesForApi);
});

// Повертає нотатку за id або повідомлення 404, якщо її не знайдено
app.get('/api/notes/:id', (req, res) => {
  const note = notes.find((item) => item.id === req.params.id);

  if (!note) {
    return res.status(404).json({ error: 'Нотатку не знайдено' });
  }

  res.json({
    id: note.id,
    title: note.title,
    category: note.category,
    categoryName: note.categoryName,
    text: note.excerpt
  });
});

// Роздає HTML, CSS і JavaScript із папки public
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Сервер запущено на http://localhost:${PORT}`);
});