const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();

// Initialize database
const dbPath = path.join(__dirname, '..', 'store.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    specs TEXT,
    price TEXT NOT NULL,
    image TEXT,
    stock INTEGER DEFAULT 10,
    discount INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_governorate TEXT,
    items TEXT NOT NULL,
    total_price TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    screen_condition TEXT,
    battery_condition TEXT,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  );
`);

// Create default admin
const adminExists = db.prepare('SELECT COUNT(*) as count FROM admin').get();
if (adminExists.count === 0) {
  const hashedPassword = bcrypt.hashSync('JSH@2024', 10);
  db.prepare('INSERT INTO admin (phone, password) VALUES (?, ?)').run('01001234567', hashedPassword);
}

// Create default settings
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
if (settingsCount.count === 0) {
  const defaultSettings = [
    { key: 'whatsapp_number', value: '201001234567' },
    { key: 'primary_color', value: '#06b6d4' },
    { key: 'secondary_color', value: '#f59e0b' },
    { key: 'font_family', value: 'Cairo' },
    { key: 'store_name', value: 'JSH Store' },
    { key: 'store_phone', value: '+20 100 123 4567' },
    { key: 'store_location', value: 'القاهرة، جمهورية مصر العربية' },
    { key: 'payment_visa_enabled', value: '1' },
    { key: 'payment_vodafone_enabled', value: '1' },
    { key: 'payment_cod_enabled', value: '1' }
  ];

  const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  for (const s of defaultSettings) {
    insert.run(s.key, s.value);
  }
}

// Insert default products
const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (productsCount.count === 0) {
  const defaultProducts = [
    { name: 'iPhone 15 Pro Max', brand: 'apple', specs: '256GB - تيتانيوم طبيعي', price: '58,000', image: 'photo-1696446701796-da61225697cc', stock: 5 },
    { name: 'iPhone 15 Pro', brand: 'apple', specs: '128GB - تيتانيوم أزرق', price: '52,000', image: 'photo-1695048133142-1a20484d2569', stock: 8 },
    { name: 'Galaxy S24 Ultra', brand: 'samsung', specs: '256GB - رمادي تيتانيوم', price: '54,000', image: 'photo-1610945415295-d9bbf067e59c', stock: 6 },
    { name: 'Galaxy A55', brand: 'samsung', specs: '128GB - أسود Awesome', price: '16,500', image: 'photo-1610945268494-c7a5c567b9c1', stock: 15 },
    { name: 'Xiaomi 14 Pro', brand: 'xiaomi', specs: '512GB - أبيض سيراميك', price: '42,000', image: 'photo-1598327105666-5b89351aff97', stock: 7 },
    { name: 'Redmi Note 13 Pro+', brand: 'xiaomi', specs: '512GB - بنفسجي فاتح', price: '16,000', image: 'photo-1592434134753-a70baf7979d5', stock: 20 }
  ];

  const insert = db.prepare('INSERT INTO products (name, brand, specs, price, image, stock) VALUES (?, ?, ?, ?, ?, ?)');
  for (const p of defaultProducts) {
    insert.run(p.name, p.brand, p.specs, p.price, p.image, p.stock);
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'jsh-store-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Public API
app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT key, value FROM settings').all();
  const settingsObj = {};
  settings.forEach(s => { settingsObj[s.key] = s.value; });
  res.json(settingsObj);
});

app.post('/api/orders', (req, res) => {
  const { customer_name, customer_phone, customer_governorate, items, total_price, payment_method, notes } = req.body;
  const result = db.prepare(`INSERT INTO orders (customer_name, customer_phone, customer_governorate, items, total_price, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(customer_name, customer_phone, customer_governorate || '', JSON.stringify(items), total_price, payment_method, notes || '');
  res.json({ success: true, orderId: result.lastInsertRowid });
});

app.post('/api/evaluations', (req, res) => {
  const { brand, model, screen_condition, battery_condition, phone_number } = req.body;
  const result = db.prepare(`INSERT INTO evaluations (brand, model, screen_condition, battery_condition, phone_number) VALUES (?, ?, ?, ?, ?)`)
    .run(brand, model, screen_condition || '', battery_condition || '', phone_number);
  res.json({ success: true, evaluationId: result.lastInsertRowid });
});

// Admin API
app.post('/api/admin/login', (req, res) => {
  const { phone, password } = req.body;
  const admin = db.prepare('SELECT * FROM admin WHERE phone = ?').get(phone);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.isAdmin = true;
  req.session.adminId = admin.id;
  res.json({ success: true });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/admin/status', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

app.get('/api/admin/stats', requireAuth, (req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count;
  const totalEvaluations = db.prepare('SELECT COUNT(*) as count FROM evaluations').get().count;
  res.json({ totalProducts, totalOrders, pendingOrders, totalEvaluations });
});

app.get('/api/admin/products', requireAuth, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

app.post('/api/admin/products', requireAuth, (req, res) => {
  const { name, brand, specs, price, stock, discount, featured, image } = req.body;
  const result = db.prepare(`INSERT INTO products (name, brand, specs, price, image, stock, discount, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(name, brand, specs || '', price, image || '', stock || 10, discount || 0, featured || 0);
  res.json({ success: true, productId: result.lastInsertRowid });
});

app.put('/api/admin/products/:id', requireAuth, (req, res) => {
  const { name, brand, specs, price, stock, discount, featured, image } = req.body;
  db.prepare(`UPDATE products SET name=?, brand=?, specs=?, price=?, image=?, stock=?, discount=?, featured=? WHERE id=?`)
    .run(name, brand, specs || '', price, image || '', stock || 10, discount || 0, featured || 0, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/products/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/orders', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(orders);
});

app.put('/api/admin/orders/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/orders/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/evaluations', requireAuth, (req, res) => {
  const evaluations = db.prepare('SELECT * FROM evaluations ORDER BY created_at DESC').all();
  res.json(evaluations);
});

app.put('/api/admin/evaluations/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE evaluations SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/settings', requireAuth, (req, res) => {
  const settings = db.prepare('SELECT key, value FROM settings').all();
  const settingsObj = {};
  settings.forEach(s => { settingsObj[s.key] = s.value; });
  res.json(settingsObj);
});

app.post('/api/admin/settings', requireAuth, (req, res) => {
  const settings = req.body;
  const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(settings)) {
    update.run(key, value);
  }
  res.json({ success: true });
});

// Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;
