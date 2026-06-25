const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'jsh-store-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// ============ PUBLIC API ============

// Get all products
app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Get public settings (for website)
app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT key, value FROM settings').all();
  const settingsObj = {};
  settings.forEach(s => {
    settingsObj[s.key] = s.value;
  });
  res.json(settingsObj);
});

// Create order
app.post('/api/orders', (req, res) => {
  const { customer_name, customer_phone, customer_governorate, items, total_price, payment_method, notes } = req.body;
  
  if (!customer_name || !customer_phone || !items || !total_price || !payment_method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = db.prepare(`
    INSERT INTO orders (customer_name, customer_phone, customer_governorate, items, total_price, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(customer_name, customer_phone, customer_governorate || '', JSON.stringify(items), total_price, payment_method, notes || '');

  res.json({ success: true, orderId: result.lastInsertRowid });
});

// Submit phone evaluation
app.post('/api/evaluations', (req, res) => {
  const { brand, model, screen_condition, battery_condition, phone_number } = req.body;
  
  if (!brand || !model || !phone_number) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = db.prepare(`
    INSERT INTO evaluations (brand, model, screen_condition, battery_condition, phone_number)
    VALUES (?, ?, ?, ?, ?)
  `).run(brand, model, screen_condition || '', battery_condition || '', phone_number);

  res.json({ success: true, evaluationId: result.lastInsertRowid });
});

// ============ ADMIN API ============

// Admin login
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

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check auth status
app.get('/api/admin/status', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// Get all orders (admin)
app.get('/api/admin/orders', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(orders);
});

// Update order status
app.put('/api/admin/orders/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Delete order
app.delete('/api/admin/orders/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get all evaluations (admin)
app.get('/api/admin/evaluations', requireAuth, (req, res) => {
  const evaluations = db.prepare('SELECT * FROM evaluations ORDER BY created_at DESC').all();
  res.json(evaluations);
});

// Update evaluation status
app.put('/api/admin/evaluations/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE evaluations SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Get all products (admin)
app.get('/api/admin/products', requireAuth, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

// Create product
app.post('/api/admin/products', requireAuth, upload.single('image'), (req, res) => {
  const { name, brand, specs, price, stock, discount, featured } = req.body;
  
  if (!name || !brand || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let image = req.body.image || '';
  if (req.file) {
    image = '/uploads/' + req.file.filename;
  }

  const result = db.prepare(`
    INSERT INTO products (name, brand, specs, price, image, stock, discount, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, brand, specs || '', price, image, stock || 10, discount || 0, featured || 0);

  res.json({ success: true, productId: result.lastInsertRowid });
});

// Update product
app.put('/api/admin/products/:id', requireAuth, upload.single('image'), (req, res) => {
  const { name, brand, specs, price, stock, discount, featured } = req.body;
  
  let image = req.body.image || '';
  if (req.file) {
    image = '/uploads/' + req.file.filename;
  }

  if (image) {
    db.prepare(`
      UPDATE products SET name=?, brand=?, specs=?, price=?, image=?, stock=?, discount=?, featured=?
      WHERE id=?
    `).run(name, brand, specs || '', price, image, stock || 10, discount || 0, featured || 0, req.params.id);
  } else {
    db.prepare(`
      UPDATE products SET name=?, brand=?, specs=?, price=?, stock=?, discount=?, featured=?
      WHERE id=?
    `).run(name, brand, specs || '', price, stock || 10, discount || 0, featured || 0, req.params.id);
  }

  res.json({ success: true });
});

// Delete product
app.delete('/api/admin/products/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ SETTINGS API ============

// Get all settings (admin)
app.get('/api/admin/settings', requireAuth, (req, res) => {
  const settings = db.prepare('SELECT key, value FROM settings').all();
  const settingsObj = {};
  settings.forEach(s => {
    settingsObj[s.key] = s.value;
  });
  res.json(settingsObj);
});

// Update settings
app.post('/api/admin/settings', requireAuth, (req, res) => {
  const settings = req.body;
  
  const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  for (const [key, value] of Object.entries(settings)) {
    update.run(key, value);
  }
  
  res.json({ success: true });
});

// Change admin password
app.post('/api/admin/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.session.adminId);
  if (!bcrypt.compareSync(currentPassword, admin.password)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admin SET password = ? WHERE id = ?').run(hashedPassword, req.session.adminId);
  
  res.json({ success: true });
});

// Statistics
app.get('/api/admin/stats', requireAuth, (req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count;
  const totalEvaluations = db.prepare('SELECT COUNT(*) as count FROM evaluations').get().count;
  
  res.json({ totalProducts, totalOrders, pendingOrders, totalEvaluations });
});

// Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`JSH Store server running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Default login: phone=01001234567, password=JSH@2024`);
});
