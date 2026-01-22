import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

app.use(cors());
app.use(express.json());

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password_hash);

  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, username: user.username });
});

// People endpoints (protected)
app.get('/api/people', verifyToken, (req, res) => {
  const people = db.prepare('SELECT * FROM people ORDER BY name').all();
  res.json(people);
});

app.post('/api/people', verifyToken, (req, res) => {
  const { name, hireDate, endDate, department } = req.body;
  const result = db.prepare('INSERT INTO people (name, hire_date, end_date, department) VALUES (?, ?, ?, ?)')
    .run(name, hireDate, endDate || null, department);
  res.json({ id: result.lastInsertRowid, name, hireDate, endDate, department });
});

app.post('/api/people/bulk', verifyToken, (req, res) => {
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

app.put('/api/people/:id', verifyToken, (req, res) => {
  const { name, hireDate, endDate, department } = req.body;
  db.prepare('UPDATE people SET name = ?, hire_date = ?, end_date = ?, department = ? WHERE id = ?')
    .run(name, hireDate, endDate || null, department, req.params.id);
  res.json({ id: req.params.id, name, hireDate, endDate, department });
});

app.delete('/api/people/:id', verifyToken, (req, res) => {
  db.prepare('DELETE FROM people WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Events endpoints (protected)
app.get('/api/events', verifyToken, (req, res) => {
  const events = db.prepare('SELECT * FROM events ORDER BY date DESC').all();
  res.json(events);
});

app.post('/api/events', verifyToken, (req, res) => {
  const { name, type, date } = req.body;
  const result = db.prepare('INSERT INTO events (name, type, date) VALUES (?, ?, ?)')
    .run(name, type, date);
  res.json({ id: result.lastInsertRowid, name, type, date });
});

app.post('/api/events/bulk', verifyToken, (req, res) => {
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

app.put('/api/events/:id', verifyToken, (req, res) => {
  const { name, type, date } = req.body;
  db.prepare('UPDATE events SET name = ?, type = ?, date = ? WHERE id = ?')
    .run(name, type, date, req.params.id);
  res.json({ id: req.params.id, name, type, date });
});

app.delete('/api/events/:id', verifyToken, (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Attendance endpoints (protected)
app.get('/api/attendance', verifyToken, (req, res) => {
  const attendance = db.prepare('SELECT * FROM attendance').all();
  res.json(attendance);
});

app.post('/api/attendance', verifyToken, (req, res) => {
  const { personId, eventId, status } = req.body;
  const result = db.prepare(
    'INSERT OR REPLACE INTO attendance (person_id, event_id, status) VALUES (?, ?, ?)'
  ).run(personId, eventId, status);
  res.json({ id: result.lastInsertRowid, personId, eventId, status });
});

app.delete('/api/attendance/:personId/:eventId', verifyToken, (req, res) => {
  db.prepare('DELETE FROM attendance WHERE person_id = ? AND event_id = ?')
    .run(req.params.personId, req.params.eventId);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
