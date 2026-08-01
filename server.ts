import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '50mb' }));

// Hostinger MySQL Connection Pool
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u513407224_phetmany',
  password: process.env.DB_PASSWORD || 'India@1234#@$$',
  database: process.env.DB_NAME || 'u513407224_phetmany',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool: mysql.Pool | null = null;

try {
  pool = mysql.createPool(dbConfig);
} catch (err) {
  console.warn('MySQL pool initialization notice:', err);
}

// Auto-initialize required tables if they don't exist
async function initTables() {
  if (!pool) return;
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS products (
          Sr_No_ INT AUTO_INCREMENT PRIMARY KEY,
          Stock_NO VARCHAR(50),
          Shape VARCHAR(50),
          Carat DECIMAL(10,2),
          Clarity VARCHAR(20),
          Color VARCHAR(20),
          Color_Shade VARCHAR(20),
          Rap_Rate INT,
          Rap_Vlu INT,
          Rap__ DECIMAL(10,2),
          Pr_Ct DECIMAL(10,2),
          Amount DECIMAL(10,2),
          TD_ DECIMAL(5,2),
          Tab_ DECIMAL(5,2),
          Cut VARCHAR(10),
          Polish VARCHAR(10),
          Symmetry VARCHAR(10),
          Fluorescent VARCHAR(20),
          Measurement VARCHAR(50),
          Lab VARCHAR(20),
          H_A VARCHAR(10),
          CUL VARCHAR(10),
          Girdle VARCHAR(50),
          Girdle_ INT,
          BIT VARCHAR(10),
          BIC VARCHAR(10),
          WIT VARCHAR(10),
          WIC VARCHAR(10),
          MILKY VARCHAR(10),
          LIns VARCHAR(20),
          LUS VARCHAR(10),
          OPPV VARCHAR(10),
          OPTA VARCHAR(10),
          OPCR VARCHAR(10),
          CA DECIMAL(5,2),
          CH DECIMAL(5,2),
          PA DECIMAL(5,2),
          PHP DECIMAL(5,2),
          CERT_NO VARCHAR(50),
          Location VARCHAR(50),
          RO VARCHAR(10),
          EC VARCHAR(10),
          Keytosymbol VARCHAR(255),
          FancyColorDescription VARCHAR(255),
          ImageLink TEXT,
          CertificateLink TEXT,
          VideoLink TEXT,
          Videomp4Link TEXT,
          id VARCHAR(255),
          name TEXT,
          price DOUBLE,
          stock INT DEFAULT 1,
          image TEXT,
          description TEXT,
          status VARCHAR(100) DEFAULT 'In Stock',
          data LONGTEXT,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_stockNo (Stock_NO),
          KEY idx_certNo (CERT_NO)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(255) PRIMARY KEY,
          customerId VARCHAR(255),
          customerName VARCHAR(255),
          customerEmail VARCHAR(255),
          totalAmount DOUBLE,
          paymentMethod VARCHAR(100),
          paymentStatus VARCHAR(100),
          shippingStatus VARCHAR(100),
          data LONGTEXT,
          createdAt VARCHAR(255),
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS tickets (
          id VARCHAR(255) PRIMARY KEY,
          userId VARCHAR(255),
          userName VARCHAR(255),
          userEmail VARCHAR(255),
          subject TEXT,
          status VARCHAR(100),
          data LONGTEXT,
          createdAt VARCHAR(255),
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255),
          email VARCHAR(255),
          fullName VARCHAR(255),
          role VARCHAR(255),
          status VARCHAR(100),
          data LONGTEXT,
          createdAt VARCHAR(255),
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      console.log('Hostinger MySQL tables verified/initialized successfully.');
    } finally {
      conn.release();
    }
  } catch (err) {
    console.warn('Hostinger MySQL table initialization note:', err);
  }
}

initTables().catch(console.error);

// Health Check API
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  if (pool) {
    try {
      const [rows] = await pool.query('SELECT 1 as val');
      if (Array.isArray(rows) && rows.length > 0) {
        dbStatus = 'connected';
      }
    } catch (err: any) {
      dbStatus = `error: ${err.message || 'connection failed'}`;
    }
  }
  res.json({
    status: 'ok',
    database: dbStatus,
    config: {
      host: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.user,
    },
  });
});

// Comprehensive Database Connection Diagnostic API
app.all('/api/test-db-connection', async (req, res) => {
  const host = (req.body?.host || req.query?.host || dbConfig.host || 'localhost').trim();
  const user = (req.body?.user || req.query?.user || dbConfig.user || 'u513407224_phetmany').trim();
  const password = req.body?.password !== undefined ? req.body.password : (req.query?.password !== undefined ? req.query.password : dbConfig.password);
  const database = (req.body?.database || req.query?.database || dbConfig.database || 'u513407224_phetmany').trim();
  const port = parseInt(String(req.body?.port || req.query?.port || dbConfig.port || '3306'), 10);

  const testConfig = {
    host,
    user,
    password,
    database,
    port,
    connectTimeout: 8000,
  };

  const maskedConfig = {
    host,
    user,
    database,
    port,
    passwordMasked: password ? '••••••••' : '(empty)',
  };

  let connection: mysql.Connection | null = null;
  const startTime = Date.now();

  try {
    connection = await mysql.createConnection(testConfig);
    const connectionTimeMs = Date.now() - startTime;

    // Run test queries
    const [pingRows]: any = await connection.query('SELECT 1 as pingVal, NOW() as serverTime, VERSION() as mysqlVersion');
    const [tableRows]: any = await connection.query('SHOW TABLES');

    const tableNameKey = tableRows.length > 0 ? Object.keys(tableRows[0])[0] : null;
    const tablesList: string[] = tableNameKey ? tableRows.map((r: any) => r[tableNameKey]) : [];

    let productCount = 0;
    let orderCount = 0;
    let ticketCount = 0;
    let userCount = 0;

    if (tablesList.includes('products')) {
      const [pRows]: any = await connection.query('SELECT COUNT(*) as cnt FROM products');
      productCount = pRows[0]?.cnt || 0;
    }
    if (tablesList.includes('orders')) {
      const [oRows]: any = await connection.query('SELECT COUNT(*) as cnt FROM orders');
      orderCount = oRows[0]?.cnt || 0;
    }
    if (tablesList.includes('tickets')) {
      const [tRows]: any = await connection.query('SELECT COUNT(*) as cnt FROM tickets');
      ticketCount = tRows[0]?.cnt || 0;
    }
    if (tablesList.includes('user_profiles')) {
      const [uRows]: any = await connection.query('SELECT COUNT(*) as cnt FROM user_profiles');
      userCount = uRows[0]?.cnt || 0;
    }

    await connection.end();

    return res.json({
      success: true,
      message: 'Connected to MySQL Database Successfully!',
      responseTimeMs: connectionTimeMs,
      config: maskedConfig,
      details: {
        serverTime: pingRows[0]?.serverTime,
        mysqlVersion: pingRows[0]?.mysqlVersion,
        tablesFound: tablesList,
        counts: {
          products: productCount,
          orders: orderCount,
          tickets: ticketCount,
          users: userCount,
        },
      },
    });
  } catch (err: any) {
    if (connection) {
      try { await connection.end(); } catch (e) {}
    }

    const responseTimeMs = Date.now() - startTime;
    const errorCode = err.code || 'UNKNOWN_ERROR';
    const errorMessage = err.message || String(err);
    const errno = err.errno;
    const sqlState = err.sqlState;

    const suggestions: string[] = [];
    if (errorCode === 'ECONNREFUSED') {
      suggestions.push("Connection refused. On Hostinger web hosting/cPanel, set DB_HOST='localhost' or '127.0.0.1' instead of remote domain.");
      suggestions.push("Check if port 3306 is correct and MySQL server is running.");
    } else if (errorCode === 'ER_ACCESS_DENIED_ERROR') {
      suggestions.push("Access denied. Verify database username and password in Hostinger hPanel > MySQL Databases.");
      suggestions.push(`Ensure user '${user}' has been assigned ALL PRIVILEGES to database '${database}' in Hostinger.`);
    } else if (errorCode === 'ER_BAD_DB_ERROR') {
      suggestions.push(`Database '${database}' does not exist. Check exact database name in Hostinger MySQL Databases.`);
    } else if (errorCode === 'ENOTFOUND') {
      suggestions.push(`Host '${host}' could not be resolved. If hosted on Hostinger, use 'localhost'.`);
    } else if (errorCode === 'ETIMEDOUT') {
      suggestions.push("Connection timed out. Hostinger blocks remote connections from external IPs by default.");
      suggestions.push("If connecting from outside Hostinger, add '%' or your server IP in Hostinger hPanel > Remote MySQL.");
      suggestions.push("If app is hosted directly on Hostinger, set DB_HOST='localhost'.");
    } else {
      suggestions.push("Verify your Hostinger MySQL database credentials in hPanel > Databases.");
      suggestions.push("Make sure MySQL user is created and assigned to the database.");
    }

    return res.status(200).json({
      success: false,
      message: `Database Connection Failed (${errorCode})`,
      responseTimeMs,
      config: maskedConfig,
      error: {
        code: errorCode,
        errno,
        sqlState,
        message: errorMessage,
      },
      suggestions,
    });
  }
});

// Download SQL dump for Hostinger MySQL phpMyAdmin
app.get('/api/mysql/download-products-sql', (req, res) => {
  const filePath = path.join(process.cwd(), 'products_dump.sql');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="products_dump.sql"');
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'SQL dump file not generated yet.' });
  }
});

// ==================== PRODUCTS API ====================
app.get('/api/products', async (_req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    const [rows]: any = await pool.query('SELECT * FROM products ORDER BY Sr_No_ DESC');
    const products = rows.map((r: any) => {
      let extra = {};
      if (r.data) {
        try {
          if (typeof r.data === 'string') extra = JSON.parse(r.data);
          else if (typeof r.data === 'object') extra = r.data;
        } catch (e) {}
      }

      const id = String(r.Stock_NO || r.id || r.CERT_NO || r.Sr_No_ || `prod_${Math.random()}`);
      const carat = Number(r.Carat || r.carat || 0);
      const price = Number(r.Amount || r.price || r.Pr_Ct || 0);
      const cut = r.Cut || r.cut || 'EX';
      const color = r.Color || r.color || 'F';
      const clarity = r.Clarity || r.clarity || 'VS1';
      const certification = r.Lab || r.certification || 'GIA';
      const certId = String(r.CERT_NO || r.certId || '');
      const image = r.ImageLink || r.image || '';
      const certificateLink = r.CertificateLink || '';
      const videoLink = r.VideoLink || r.Videomp4Link || r.video360 || '';
      const name = r.name || (carat && r.Shape ? `${carat}ct ${r.Shape} Diamond` : `Diamond ${id}`);
      const description = r.description || r.FancyColorDescription || `${carat}ct ${color} ${clarity} ${r.Shape || 'Diamond'} certified by ${certification}`;
      const stock = Number(r.stock) || 1;
      const status = r.status || 'In Stock';

      return {
        ...r,
        ...extra,
        id,
        name,
        cut,
        color,
        clarity,
        carat,
        certification,
        certId,
        price,
        stock,
        image,
        images: [image].filter(Boolean),
        video360: videoLink,
        description,
        status,

        // Exact MySQL Schema Field Alignment
        Sr_No_: r.Sr_No_,
        Stock_NO: r.Stock_NO || id,
        Shape: r.Shape || 'ROUND',
        Carat: carat,
        Clarity: clarity,
        Color: color,
        Color_Shade: r.Color_Shade || '',
        Rap_Rate: Number(r.Rap_Rate || 0),
        Rap_Vlu: Number(r.Rap_Vlu || 0),
        Rap__: Number(r.Rap__ || 0),
        Pr_Ct: Number(r.Pr_Ct || 0),
        Amount: price,
        TD_: Number(r.TD_ || 0),
        Tab_: Number(r.Tab_ || 0),
        Cut: cut,
        Polish: r.Polish || 'EX',
        Symmetry: r.Symmetry || 'EX',
        Fluorescent: r.Fluorescent || 'N',
        Measurement: r.Measurement || '',
        Lab: certification,
        H_A: r.H_A || '',
        CUL: r.CUL || 'N',
        Girdle: r.Girdle || '',
        Girdle_: Number(r.Girdle_ || 0),
        BIT: r.BIT || '',
        BIC: r.BIC || '',
        WIT: r.WIT || '',
        WIC: r.WIC || '',
        MILKY: r.MILKY || '',
        LIns: r.LIns || '',
        LUS: r.LUS || '',
        OPPV: r.OPPV || '',
        OPTA: r.OPTA || '',
        OPCR: r.OPCR || '',
        CA: Number(r.CA || 0),
        CH: Number(r.CH || 0),
        PA: Number(r.PA || 0),
        PHP: Number(r.PHP || 0),
        CERT_NO: certId,
        Location: r.Location || '',
        RO: r.RO || '',
        EC: r.EC || '',
        Keytosymbol: r.Keytosymbol || '',
        FancyColorDescription: r.FancyColorDescription || '',
        ImageLink: image,
        CertificateLink: certificateLink,
        VideoLink: videoLink,
        Videomp4Link: r.Videomp4Link || videoLink
      };
    });
    res.json(products);
  } catch (err: any) {
    console.error('Error fetching products from Hostinger MySQL:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    const p = req.body;
    const dataJson = JSON.stringify(p);
    const stockNo = String(p.Stock_NO || p.id || p.certId || `SN-${Date.now()}`);
    const certNo = String(p.CERT_NO || p.certId || '');
    const amount = Number(p.Amount || p.price || 0);
    const carat = Number(p.Carat || p.carat || 1.0);

    const query = `
      INSERT INTO products (
        Stock_NO, Shape, Carat, Clarity, Color, Color_Shade, Rap_Rate, Rap_Vlu, Rap__,
        Pr_Ct, Amount, TD_, Tab_, Cut, Polish, Symmetry, Fluorescent, Measurement, Lab,
        H_A, CUL, Girdle, Girdle_, BIT, BIC, WIT, WIC, MILKY, LIns, LUS, OPPV, OPTA, OPCR,
        CA, CH, PA, PHP, CERT_NO, Location, RO, EC, Keytosymbol, FancyColorDescription,
        ImageLink, CertificateLink, VideoLink, Videomp4Link, id, name, price, stock, image, description, status, data
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Shape=VALUES(Shape), Carat=VALUES(Carat), Clarity=VALUES(Clarity), Color=VALUES(Color),
        Amount=VALUES(Amount), price=VALUES(price), CERT_NO=VALUES(CERT_NO), ImageLink=VALUES(ImageLink),
        data=VALUES(data), status=VALUES(status)
    `;

    await pool.execute(query, [
      stockNo, p.Shape || 'ROUND', carat, p.Clarity || p.clarity || 'VS1', p.Color || p.color || 'F', p.Color_Shade || '',
      Number(p.Rap_Rate || 0), Number(p.Rap_Vlu || 0), Number(p.Rap__ || 0), Number(p.Pr_Ct || 0), amount,
      Number(p.TD_ || 0), Number(p.Tab_ || 0), p.Cut || p.cut || 'EX', p.Polish || 'EX', p.Symmetry || 'EX',
      p.Fluorescent || 'N', p.Measurement || '', p.Lab || p.certification || 'GIA', p.H_A || '', p.CUL || 'N',
      p.Girdle || '', Number(p.Girdle_ || 0), p.BIT || '', p.BIC || '', p.WIT || '', p.WIC || '', p.MILKY || '',
      p.LIns || '', p.LUS || '', p.OPPV || '', p.OPTA || '', p.OPCR || '', Number(p.CA || 0), Number(p.CH || 0),
      Number(p.PA || 0), Number(p.PHP || 0), certNo, p.Location || '', p.RO || '', p.EC || '', p.Keytosymbol || '',
      p.FancyColorDescription || '', p.ImageLink || p.image || '', p.CertificateLink || '', p.VideoLink || p.video360 || '',
      p.Videomp4Link || '', p.id || stockNo, p.name || `${carat}ct Diamond`, amount, Number(p.stock || 1),
      p.ImageLink || p.image || '', p.description || '', p.status || 'In Stock', dataJson
    ]);

    res.json({ success: true, product: p });
  } catch (err: any) {
    console.error('Error saving product to Hostinger MySQL:', err);
    res.status(500).json({ error: err.message || 'Failed to save product' });
  }
});

app.post('/api/products/batch', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    const products: any[] = req.body.products || [];
    if (!Array.isArray(products) || products.length === 0) {
      return res.json({ success: true, count: 0 });
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const query = `
        INSERT INTO products (
          Stock_NO, Shape, Carat, Clarity, Color, Color_Shade, Rap_Rate, Rap_Vlu, Rap__,
          Pr_Ct, Amount, TD_, Tab_, Cut, Polish, Symmetry, Fluorescent, Measurement, Lab,
          H_A, CUL, Girdle, Girdle_, BIT, BIC, WIT, WIC, MILKY, LIns, LUS, OPPV, OPTA, OPCR,
          CA, CH, PA, PHP, CERT_NO, Location, RO, EC, Keytosymbol, FancyColorDescription,
          ImageLink, CertificateLink, VideoLink, Videomp4Link, id, name, price, stock, image, description, status, data
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          Shape=VALUES(Shape), Carat=VALUES(Carat), Clarity=VALUES(Clarity), Color=VALUES(Color),
          Amount=VALUES(Amount), price=VALUES(price), CERT_NO=VALUES(CERT_NO), ImageLink=VALUES(ImageLink),
          data=VALUES(data), status=VALUES(status)
      `;
      for (const p of products) {
        const stockNo = String(p.Stock_NO || p.id || p.certId || `SN-${Date.now()}`);
        const certNo = String(p.CERT_NO || p.certId || '');
        const amount = Number(p.Amount || p.price || 0);
        const carat = Number(p.Carat || p.carat || 1.0);

        await connection.execute(query, [
          stockNo, p.Shape || 'ROUND', carat, p.Clarity || p.clarity || 'VS1', p.Color || p.color || 'F', p.Color_Shade || '',
          Number(p.Rap_Rate || 0), Number(p.Rap_Vlu || 0), Number(p.Rap__ || 0), Number(p.Pr_Ct || 0), amount,
          Number(p.TD_ || 0), Number(p.Tab_ || 0), p.Cut || p.cut || 'EX', p.Polish || 'EX', p.Symmetry || 'EX',
          p.Fluorescent || 'N', p.Measurement || '', p.Lab || p.certification || 'GIA', p.H_A || '', p.CUL || 'N',
          p.Girdle || '', Number(p.Girdle_ || 0), p.BIT || '', p.BIC || '', p.WIT || '', p.WIC || '', p.MILKY || '',
          p.LIns || '', p.LUS || '', p.OPPV || '', p.OPTA || '', p.OPCR || '', Number(p.CA || 0), Number(p.CH || 0),
          Number(p.PA || 0), Number(p.PHP || 0), certNo, p.Location || '', p.RO || '', p.EC || '', p.Keytosymbol || '',
          p.FancyColorDescription || '', p.ImageLink || p.image || '', p.CertificateLink || '', p.VideoLink || p.video360 || '',
          p.Videomp4Link || '', p.id || stockNo, p.name || `${carat}ct Diamond`, amount, Number(p.stock || 1),
          p.ImageLink || p.image || '', p.description || '', p.status || 'In Stock', JSON.stringify(p)
        ]);
      }
      await connection.commit();
      res.json({ success: true, count: products.length });
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Error saving batch products to Hostinger MySQL:', err);
    res.status(500).json({ error: err.message || 'Failed to save product batch' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    await pool.execute('DELETE FROM products WHERE Stock_NO = ? OR id = ? OR Sr_No_ = ?', [req.params.id, req.params.id, req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// ==================== ORDERS API ====================
app.get('/api/orders', async (_req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    const [rows]: any = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    const orders = rows.map((r: any) => {
      let extra = {};
      if (r.data) {
        try { extra = JSON.parse(r.data); } catch (e) {}
      }
      return {
        id: r.id,
        customerId: r.customerId,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        totalAmount: r.totalAmount,
        paymentMethod: r.paymentMethod,
        paymentStatus: r.paymentStatus,
        shippingStatus: r.shippingStatus,
        createdAt: r.createdAt,
        ...extra,
      };
    });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    const o = req.body;
    const dataJson = JSON.stringify(o);
    const query = `
      INSERT INTO orders (id, customerId, customerName, customerEmail, totalAmount, paymentMethod, paymentStatus, shippingStatus, data, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        customerId = VALUES(customerId), customerName = VALUES(customerName), customerEmail = VALUES(customerEmail),
        totalAmount = VALUES(totalAmount), paymentMethod = VALUES(paymentMethod), paymentStatus = VALUES(paymentStatus),
        shippingStatus = VALUES(shippingStatus), data = VALUES(data), createdAt = VALUES(createdAt)
    `;
    await pool.execute(query, [
      o.id || `ORD-${Date.now()}`,
      o.customerId || '',
      o.customerName || 'Guest',
      o.customerEmail || '',
      o.totalAmount || 0,
      o.paymentMethod || 'Credit Card',
      o.paymentStatus || 'Pending',
      o.shippingStatus || 'Processing',
      dataJson,
      o.createdAt || new Date().toISOString()
    ]);
    res.json({ success: true, order: o });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    await pool.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete order' });
  }
});

// ==================== TICKETS API ====================
app.get('/api/tickets', async (_req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    const [rows]: any = await pool.query('SELECT * FROM tickets ORDER BY id DESC');
    const tickets = rows.map((r: any) => {
      let extra = {};
      if (r.data) {
        try { extra = JSON.parse(r.data); } catch (e) {}
      }
      return {
        id: r.id,
        userId: r.userId,
        userName: r.userName,
        userEmail: r.userEmail,
        subject: r.subject,
        status: r.status,
        createdAt: r.createdAt,
        ...extra,
      };
    });
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch tickets' });
  }
});

app.post('/api/tickets', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    const t = req.body;
    const dataJson = JSON.stringify(t);
    const query = `
      INSERT INTO tickets (id, userId, userName, userEmail, subject, status, data, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        userId = VALUES(userId), userName = VALUES(userName), userEmail = VALUES(userEmail),
        subject = VALUES(subject), status = VALUES(status), data = VALUES(data), createdAt = VALUES(createdAt)
    `;
    await pool.execute(query, [
      t.id || `TICK-${Date.now()}`,
      t.userId || '',
      t.userName || 'Customer',
      t.userEmail || '',
      t.subject || '',
      t.status || 'Open',
      dataJson,
      t.createdAt || new Date().toISOString()
    ]);
    res.json({ success: true, ticket: t });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save ticket' });
  }
});

// ==================== USER PROFILES API ====================
app.get('/api/users', async (_req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    const [rows]: any = await pool.query('SELECT * FROM user_profiles ORDER BY id DESC');
    const users = rows.map((r: any) => {
      let extra = {};
      if (r.data) {
        try { extra = JSON.parse(r.data); } catch (e) {}
      }
      return {
        id: r.id,
        username: r.username,
        email: r.email,
        fullName: r.fullName,
        role: r.role,
        status: r.status,
        createdAt: r.createdAt,
        ...extra,
      };
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    const [rows]: any = await pool.query('SELECT * FROM user_profiles WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const r = rows[0];
    let extra = {};
    if (r.data) {
      try { extra = JSON.parse(r.data); } catch (e) {}
    }
    res.json({
      id: r.id,
      username: r.username,
      email: r.email,
      fullName: r.fullName,
      role: r.role,
      status: r.status,
      createdAt: r.createdAt,
      ...extra,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user' });
  }
});

app.post('/api/users', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    const u = req.body;
    const dataJson = JSON.stringify(u);
    const query = `
      INSERT INTO user_profiles (id, username, email, fullName, role, status, data, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        username = VALUES(username), email = VALUES(email), fullName = VALUES(fullName),
        role = VALUES(role), status = VALUES(status), data = VALUES(data), createdAt = VALUES(createdAt)
    `;
    await pool.execute(query, [
      u.id || `user_${Date.now()}`,
      u.username || '',
      u.email || '',
      u.fullName || '',
      u.role || 'Guest',
      u.status || 'Active',
      dataJson,
      u.createdAt || new Date().toISOString()
    ]);
    res.json({ success: true, user: u });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database pool unavailable' });
  try {
    await pool.execute('DELETE FROM user_profiles WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running with Hostinger MySQL integration on http://0.0.0.0:${PORT}`);
  });
}

startServer();
