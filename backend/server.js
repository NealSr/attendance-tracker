import express from 'express';
import cors from 'cors';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// People endpoints
app.get('/api/people', (req, res) => {
  const people = db.prepare('SELECT * FROM people ORDER BY name').all();
  res.json(people);
});

app.post('/api/people', (req, res) => {
  const { name, hireDate, endDate, department } = req.body;
  const result = db.prepare('INSERT INTO people (name, hire_date, end_date, department) VALUES (?, ?, ?, ?)')
    .run(name, hireDate, endDate || null, department);
  res.json({ id: result.lastInsertRowid, name, hireDate, endDate, department });
});

app.post('/api/people/bulk', (req, res) => {
  const { people } = req.body;
  const insert = db.prepare('INSERT INTO people (name, hire_date, end_date, department) VALUES (?, ?, ?, ?)');
  const insertMany = db.transaction((peopleList) => {
    for (const person of peopleList) {
      insert.run(person.name, person.hireDate, person.endDate || null, person.department);
    }
  });
  insertMany(people);
  res.json({ success: true, count: people.length });
});

app.put('/api/people/:id', (req, res) => {
  const { name, hireDate, endDate, department } = req.body;
  db.prepare('UPDATE people SET name = ?, hire_date = ?, end_date = ?, department = ? WHERE id = ?')
    .run(name, hireDate, endDate || null, department, req.params.id);
  res.json({ id: req.params.id, name, hireDate, endDate, department });
});

app.delete('/api/people/:id', (req, res) => {
  db.prepare('DELETE FROM people WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Events endpoints
app.get('/api/events', (req, res) => {
  const events = db.prepare('SELECT * FROM events ORDER BY date DESC').all();
  res.json(events);
});

app.post('/api/events', (req, res) => {
  const { name, type, date } = req.body;
  const result = db.prepare('INSERT INTO events (name, type, date) VALUES (?, ?, ?)')
    .run(name, type, date);
  res.json({ id: result.lastInsertRowid, name, type, date });
});

app.post('/api/events/bulk', (req, res) => {
  const { events } = req.body;
  const insert = db.prepare('INSERT INTO events (name, type, date) VALUES (?, ?, ?)');
  const insertMany = db.transaction((eventsList) => {
    for (const event of eventsList) {
      insert.run(event.name, event.type, event.date);
    }
  });
  insertMany(events);
  res.json({ success: true, count: events.length });
});

app.put('/api/events/:id', (req, res) => {
  const { name, type, date } = req.body;
  db.prepare('UPDATE events SET name = ?, type = ?, date = ? WHERE id = ?')
    .run(name, type, date, req.params.id);
  res.json({ id: req.params.id, name, type, date });
});

app.delete('/api/events/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Attendance endpoints
app.get('/api/attendance', (req, res) => {
  const attendance = db.prepare('SELECT * FROM attendance').all();
  res.json(attendance);
});

app.post('/api/attendance', (req, res) => {
  const { personId, eventId, status } = req.body;
  const result = db.prepare(
    'INSERT OR REPLACE INTO attendance (person_id, event_id, status) VALUES (?, ?, ?)'
  ).run(personId, eventId, status);
  res.json({ id: result.lastInsertRowid, personId, eventId, status });
});

app.delete('/api/attendance/:personId/:eventId', (req, res) => {
  db.prepare('DELETE FROM attendance WHERE person_id = ? AND event_id = ?')
    .run(req.params.personId, req.params.eventId);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
