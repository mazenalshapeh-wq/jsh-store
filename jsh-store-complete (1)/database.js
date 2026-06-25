const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'store.db'));

// Enable WAL mode for better performance
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

// Create default admin if not exists
const adminExists = db.prepare('SELECT COUNT(*) as count FROM admin').get();
if (adminExists.count === 0) {
  const hashedPassword = bcrypt.hashSync('JSH@2024', 10);
  db.prepare('INSERT INTO admin (phone, password) VALUES (?, ?)').run('01001234567', hashedPassword);
  console.log('Default admin created: phone=01001234567, password=JSH@2024');
}

// Create default settings if not exists
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
    { key: 'payment_visa_number', value: '' },
    { key: 'payment_vodafone_enabled', value: '1' },
    { key: 'payment_vodafone_number', value: '' },
    { key: 'payment_cod_enabled', value: '1' },
    { key: 'theme_mode', value: 'dark' }
  ];

  const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  for (const s of defaultSettings) {
    insert.run(s.key, s.value);
  }
  console.log('Default settings created');
}

// Insert default products if empty
const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (productsCount.count === 0) {
  const defaultProducts = [
    { name: 'iPhone 15 Pro Max', brand: 'apple', specs: '256GB - تيتانيوم طبيعي', price: '58,000', image: 'photo-1696446701796-da61225697cc', stock: 5 },
    { name: 'iPhone 15 Pro', brand: 'apple', specs: '128GB - تيتانيوم أزرق', price: '52,000', image: 'photo-1695048133142-1a20484d2569', stock: 8 },
    { name: 'iPhone 14 Pro Max', brand: 'apple', specs: '256GB - بنفسجي غامق', price: '48,000', image: 'photo-1663499478489-22227f5d8073', stock: 3 },
    { name: 'iPhone 13', brand: 'apple', specs: '128GB - أحمر (Product Red)', price: '30,000', image: 'photo-1632661674596-88f675a5b38f', stock: 10 },
    { name: 'Galaxy S24 Ultra', brand: 'samsung', specs: '256GB - رمادي تيتانيوم', price: '54,000', image: 'photo-1610945415295-d9bbf067e59c', stock: 6 },
    { name: 'Galaxy S23 Ultra', brand: 'samsung', specs: '256GB - أسود فانتوم', price: '46,000', image: 'photo-1678911820864-e2c567c6fb67', stock: 4 },
    { name: 'Galaxy A55', brand: 'samsung', specs: '128GB - أسود Awesome', price: '16,500', image: 'photo-1610945268494-c7a5c567b9c1', stock: 15 },
    { name: 'Xiaomi 14 Pro', brand: 'xiaomi', specs: '512GB - أبيض سيراميك', price: '42,000', image: 'photo-1598327105666-5b89351aff97', stock: 7 },
    { name: 'Redmi Note 13 Pro+', brand: 'xiaomi', specs: '512GB - بنفسجي فاتح', price: '16,000', image: 'photo-1592434134753-a70baf7979d5', stock: 20 },
    { name: 'Huawei Pura 70 Pro', brand: 'huawei', specs: '512GB - أسود أنيق', price: '45,000', image: 'photo-1592899677977-9c10ca588bbd', stock: 5 },
    { name: 'Huawei Nova 12 Pro', brand: 'huawei', specs: '256GB - أخضر زمردي', price: '19,500', image: 'photo-1580910051074-3eb694886505', stock: 12 },
    { name: 'Red Magic 9 Pro', brand: 'redmagic', specs: '256GB - أسود (هاتف ألعاب)', price: '38,000', image: 'photo-1616348436168-de43ad0db179', stock: 4 },
    { name: 'Red Magic 8 Pro', brand: 'redmagic', specs: '256GB - شفاف (مضيء)', price: '32,000', image: 'photo-1550009158-9ebf69173e03', stock: 3 },
    { name: 'Tecno Camon 30 Pro', brand: 'tecno', specs: '256GB - جلد أسود فاخر', price: '15,000', image: 'photo-1511707171634-5f897ff02aa9', stock: 18 },
    { name: 'Tecno Spark 20 Pro', brand: 'tecno', specs: '256GB - أزرق سماوي', price: '8,500', image: 'photo-1565849904461-04a58ad377e0', stock: 25 }
  ];

  const insert = db.prepare('INSERT INTO products (name, brand, specs, price, image, stock) VALUES (?, ?, ?, ?, ?, ?)');
  for (const p of defaultProducts) {
    insert.run(p.name, p.brand, p.specs, p.price, p.image, p.stock);
  }
  console.log('Default products inserted');
}

module.exports = db;
