import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured');
}

app.use(express.json());

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    req.user = jwt.verify(authHeader.substring(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const getData = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const requireArray = (value, label, res) => {
  if (Array.isArray(value)) return true;
  res.status(400).json({ error: `${label} must be an array` });
  return false;
};

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = await getData(
    db.from('users').select('id, username, password_hash').eq('username', username).maybeSingle()
  );

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, username: user.username });
}));

app.get('/api/people', verifyToken, asyncHandler(async (_req, res) => {
  const people = await getData(db.from('people').select('*').order('name'));
  res.json(people);
}));

app.post('/api/people', verifyToken, asyncHandler(async (req, res) => {
  const { name, hireDate, endDate, department } = req.body;
  const person = await getData(
    db.from('people')
      .insert({
        name,
        hire_date: hireDate,
        end_date: endDate || null,
        department
      })
      .select('*')
      .single()
  );

  res.json({
    id: person.id,
    name: person.name,
    hireDate: person.hire_date,
    endDate: person.end_date,
    department: person.department
  });
}));

app.post('/api/people/bulk', verifyToken, asyncHandler(async (req, res) => {
  const { people } = req.body;
  if (!requireArray(people, 'people', res)) return;

  if (people.length) {
    await getData(db.from('people').insert(people.map((person) => ({
      name: person.name,
      hire_date: person.hireDate,
      end_date: person.endDate || null,
      department: person.department
    }))));
  }
  res.json({ success: true, count: people.length });
}));

app.put('/api/people/:id', verifyToken, asyncHandler(async (req, res) => {
  const { name, hireDate, endDate, department } = req.body;
  await getData(
    db.from('people').update({
      name,
      hire_date: hireDate,
      end_date: endDate || null,
      department
    }).eq('id', req.params.id)
  );
  res.json({ id: req.params.id, name, hireDate, endDate, department });
}));

app.delete('/api/people/:id', verifyToken, asyncHandler(async (req, res) => {
  await getData(db.from('people').delete().eq('id', req.params.id));
  res.json({ success: true });
}));

app.get('/api/events', verifyToken, asyncHandler(async (_req, res) => {
  const events = await getData(db.from('events').select('*').order('date', { ascending: false }));
  res.json(events);
}));

app.post('/api/events', verifyToken, asyncHandler(async (req, res) => {
  const { name, type, date } = req.body;
  const event = await getData(
    db.from('events').insert({ name, type, date }).select('*').single()
  );
  res.json({ id: event.id, name: event.name, type: event.type, date: event.date });
}));

app.post('/api/events/bulk', verifyToken, asyncHandler(async (req, res) => {
  const { events } = req.body;
  if (!requireArray(events, 'events', res)) return;

  if (events.length) {
    await getData(db.from('events').insert(events.map(({ name, type, date }) => ({
      name,
      type,
      date
    }))));
  }
  res.json({ success: true, count: events.length });
}));

app.put('/api/events/:id', verifyToken, asyncHandler(async (req, res) => {
  const { name, type, date } = req.body;
  await getData(
    db.from('events').update({ name, type, date }).eq('id', req.params.id)
  );
  res.json({ id: req.params.id, name, type, date });
}));

app.delete('/api/events/:id', verifyToken, asyncHandler(async (req, res) => {
  await getData(db.from('events').delete().eq('id', req.params.id));
  res.json({ success: true });
}));

app.get('/api/attendance', verifyToken, asyncHandler(async (_req, res) => {
  const attendance = await getData(db.from('attendance').select('*'));
  res.json(attendance);
}));

app.post('/api/attendance', verifyToken, asyncHandler(async (req, res) => {
  const { personId, eventId, status } = req.body;
  const record = await getData(
    db.from('attendance')
      .upsert(
        { person_id: personId, event_id: eventId, status },
        { onConflict: 'person_id,event_id' }
      )
      .select('id')
      .single()
  );
  res.json({ id: record.id, personId, eventId, status });
}));

app.delete('/api/attendance/:personId/:eventId', verifyToken, asyncHandler(async (req, res) => {
  await getData(
    db.from('attendance')
      .delete()
      .eq('person_id', req.params.personId)
      .eq('event_id', req.params.eventId)
  );
  res.json({ success: true });
}));

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

export default app;
