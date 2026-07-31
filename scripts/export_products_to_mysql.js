import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query, startAfter } from 'firebase/firestore';
import fs from 'fs';
import mysql from 'mysql2/promise';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Hostinger MySQL Config
const dbConfig = {
  host: process.env.DB_HOST || '193.203.184.233',
  user: process.env.DB_USER || 'u513407224_aditya',
  password: process.env.DB_PASSWORD || '6e>Lq1Qs~7N',
  database: process.env.DB_NAME || 'u513407224_phetmanyapp',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  connectTimeout: 10000,
};

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? '0' : val;
  if (typeof val === 'boolean') return val ? '1' : '0';
  const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, "\\r").replace(/\n/g, "\\n");
  return `'${str}'`;
}

async function runExport() {
  console.log("=== Starting Streamed Firestore Export for 27,000+ Products ===");
  
  let pool = null;
  try {
    pool = await mysql.createPool(dbConfig);
    console.log("Connected to Hostinger MySQL pool successfully!");
  } catch (err) {
    console.warn("Hostinger MySQL connection notice:", err.message);
  }

  const batchSize = 500; // Small batch size to strictly prevent Firestore 128MB quota limits
  let totalExported = 0;
  let lastDoc = null;
  let fileIndex = 1;
  let fileRowCount = 0;
  let currentFileValues = [];

  const createTableSql = `-- ============================================================
-- HOSTINGER MYSQL PRODUCTS TABLE DUMP (PART ${fileIndex})
-- Target: MySQL / MariaDB (phpMyAdmin Compatible)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS \`products\` (
  \`Sr_No_\` INT AUTO_INCREMENT PRIMARY KEY,
  \`Stock_NO\` VARCHAR(50) DEFAULT NULL,
  \`Shape\` VARCHAR(50) DEFAULT NULL,
  \`Carat\` DECIMAL(10,2) DEFAULT 0,
  \`Clarity\` VARCHAR(20) DEFAULT NULL,
  \`Color\` VARCHAR(20) DEFAULT NULL,
  \`Color_Shade\` VARCHAR(20) DEFAULT NULL,
  \`Rap_Rate\` INT DEFAULT 0,
  \`Rap_Vlu\` INT DEFAULT 0,
  \`Rap__\` DECIMAL(10,2) DEFAULT 0,
  \`Pr_Ct\` DECIMAL(10,2) DEFAULT 0,
  \`Amount\` DECIMAL(10,2) DEFAULT 0,
  \`TD_\` DECIMAL(5,2) DEFAULT 0,
  \`Tab_\` DECIMAL(5,2) DEFAULT 0,
  \`Cut\` VARCHAR(10) DEFAULT NULL,
  \`Polish\` VARCHAR(10) DEFAULT NULL,
  \`Symmetry\` VARCHAR(10) DEFAULT NULL,
  \`Fluorescent\` VARCHAR(20) DEFAULT NULL,
  \`Measurement\` VARCHAR(50) DEFAULT NULL,
  \`Lab\` VARCHAR(20) DEFAULT NULL,
  \`H_A\` VARCHAR(10) DEFAULT NULL,
  \`CUL\` VARCHAR(10) DEFAULT NULL,
  \`Girdle\` VARCHAR(50) DEFAULT NULL,
  \`Girdle_\` INT DEFAULT 0,
  \`BIT\` VARCHAR(10) DEFAULT NULL,
  \`BIC\` VARCHAR(10) DEFAULT NULL,
  \`WIT\` VARCHAR(10) DEFAULT NULL,
  \`WIC\` VARCHAR(10) DEFAULT NULL,
  \`MILKY\` VARCHAR(10) DEFAULT NULL,
  \`LIns\` VARCHAR(20) DEFAULT NULL,
  \`LUS\` VARCHAR(10) DEFAULT NULL,
  \`OPPV\` VARCHAR(10) DEFAULT NULL,
  \`OPTA\` VARCHAR(10) DEFAULT NULL,
  \`OPCR\` VARCHAR(10) DEFAULT NULL,
  \`CA\` DECIMAL(5,2) DEFAULT 0,
  \`CH\` DECIMAL(5,2) DEFAULT 0,
  \`PA\` DECIMAL(5,2) DEFAULT 0,
  \`PHP\` DECIMAL(5,2) DEFAULT 0,
  \`CERT_NO\` VARCHAR(50) DEFAULT NULL,
  \`Location\` VARCHAR(50) DEFAULT NULL,
  \`RO\` VARCHAR(10) DEFAULT NULL,
  \`EC\` VARCHAR(10) DEFAULT NULL,
  \`Keytosymbol\` VARCHAR(255) DEFAULT NULL,
  \`FancyColorDescription\` VARCHAR(255) DEFAULT NULL,
  \`ImageLink\` TEXT DEFAULT NULL,
  \`CertificateLink\` TEXT DEFAULT NULL,
  \`VideoLink\` TEXT DEFAULT NULL,
  \`Videomp4Link\` TEXT DEFAULT NULL,
  \`id\` VARCHAR(255) DEFAULT NULL,
  \`name\` TEXT DEFAULT NULL,
  \`price\` DOUBLE DEFAULT 0,
  \`stock\` INT DEFAULT 1,
  \`image\` TEXT DEFAULT NULL,
  \`description\` TEXT DEFAULT NULL,
  \`status\` VARCHAR(100) DEFAULT 'In Stock',
  \`data\` LONGTEXT DEFAULT NULL,
  \`updatedAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_stockNo\` (\`Stock_NO\`),
  KEY \`idx_certNo\` (\`CERT_NO\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  let currentHeader = createTableSql;

  while (true) {
    let q;
    if (lastDoc) {
      q = query(collection(db, 'products'), startAfter(lastDoc), limit(batchSize));
    } else {
      q = query(collection(db, 'products'), limit(batchSize));
    }

    let snap;
    try {
      snap = await getDocs(q);
    } catch (fErr) {
      console.error("Error fetching page from Firestore:", fErr);
      break;
    }

    if (snap.empty) {
      console.log("Reached end of Firestore collection.");
      break;
    }

    console.log(`Fetched page of ${snap.size} items. Total processed: ${totalExported + snap.size}`);

    const mysqlBatchRows = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const id = String(doc.id || data.id || data.Stock_NO || `prod_${totalExported + 1}`);
      
      const carat = parseFloat(data.carat || data.Carat || data.Weight || 0) || 0;
      const shape = data.Shape || data.shape || 'Diamond';
      const name = data.name || data.Title || `${carat}ct ${shape} Diamond`;
      const cut = data.cut || data.Cut || data.Cut_Grade || data.CutGrade || 'EX';
      const color = data.color || data.Color || 'F';
      const clarity = data.clarity || data.Clarity || 'VS1';
      const cert = data.certification || data.Lab || data.Certification || 'GIA';
      const certId = String(data.certId || data.CertificateNo || data.Cert_No || data.Certificate_No || '');
      const price = parseFloat(data.price || data.Amount || data.Price || 0) || 0;
      const stock = parseInt(data.stock || data.Stock || 1, 10) || 1;
      const image = data.image || data.ImageLink || data.Image_URL || data.image_url || '';
      const desc = data.description || data.Description || `${carat}ct ${color} ${clarity} ${shape} certified by ${cert}`;
      const status = data.status || 'In Stock';
      const rawJson = JSON.stringify(data);

      const valStr = `(${escapeSql(id)}, ${escapeSql(name)}, ${escapeSql(cut)}, ${escapeSql(color)}, ${escapeSql(clarity)}, ${carat}, ${escapeSql(cert)}, ${escapeSql(certId)}, ${price}, ${stock}, ${escapeSql(image)}, ${escapeSql(desc)}, ${escapeSql(status)}, ${escapeSql(rawJson)})`;
      
      currentFileValues.push(valStr);
      mysqlBatchRows.push({ id, name, cut, color, clarity, carat, cert, certId, price, stock, image, desc, status, rawJson });

      totalExported++;
      fileRowCount++;
    }

    // Direct insert into Hostinger MySQL DB in chunks of 100
    if (pool && mysqlBatchRows.length > 0) {
      try {
        const queryVals = mysqlBatchRows.map(r => 
          `(${escapeSql(r.id)}, ${escapeSql(r.name)}, ${escapeSql(r.cut)}, ${escapeSql(r.color)}, ${escapeSql(r.clarity)}, ${r.carat}, ${escapeSql(r.cert)}, ${escapeSql(r.certId)}, ${r.price}, ${r.stock}, ${escapeSql(r.image)}, ${escapeSql(r.desc)}, ${escapeSql(r.status)}, ${escapeSql(r.rawJson)})`
        ).join(',\n');
        
        const sql = `INSERT INTO products (id, name, cut, color, clarity, carat, certification, certId, price, stock, image, description, status, data) VALUES \n${queryVals}\nON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock), data=VALUES(data);`;
        await pool.query(sql);
      } catch (mErr) {
        console.warn("Direct MySQL replication batch note:", mErr.message);
      }
    }

    // Write file every 5,000 items so each SQL file is ~5MB (optimal for phpMyAdmin import)
    if (fileRowCount >= 5000) {
      const fileName = `products_part${fileIndex}.sql`;
      const fileSql = `${currentHeader}INSERT INTO products (id, name, cut, color, clarity, carat, certification, certId, price, stock, image, description, status, data) VALUES \n${currentFileValues.join(',\n')}\nON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock), data=VALUES(data);\n\nSET FOREIGN_KEY_CHECKS = 1;\nCOMMIT;\n`;
      
      fs.writeFileSync(`./${fileName}`, fileSql, 'utf8');
      console.log(`=== CREATED DUMP FILE: ./${fileName} (${fileRowCount} products) ===`);

      // Also create a master products_dump.sql if fileIndex === 1
      if (fileIndex === 1) {
        fs.writeFileSync(`./products_dump.sql`, fileSql, 'utf8');
      }

      fileIndex++;
      fileRowCount = 0;
      currentFileValues = [];
      currentHeader = `-- HOSTINGER MYSQL PRODUCTS TABLE DUMP (PART ${fileIndex})\n\nSET FOREIGN_KEY_CHECKS = 0;\nSTART TRANSACTION;\n\n`;
    }

    lastDoc = snap.docs[snap.docs.length - 1];
  }

  // Write remaining items to file
  if (currentFileValues.length > 0) {
    const fileName = fileIndex === 1 ? 'products_dump.sql' : `products_part${fileIndex}.sql`;
    const fileSql = `${currentHeader}INSERT INTO products (id, name, cut, color, clarity, carat, certification, certId, price, stock, image, description, status, data) VALUES \n${currentFileValues.join(',\n')}\nON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock), data=VALUES(data);\n\nSET FOREIGN_KEY_CHECKS = 1;\nCOMMIT;\n`;
    
    fs.writeFileSync(`./${fileName}`, fileSql, 'utf8');
    console.log(`=== CREATED DUMP FILE: ./${fileName} (${fileRowCount} products) ===`);
    
    if (fileIndex > 1) {
      // Create a unified products_all_parts.sql or combined list
      console.log(`All ${fileIndex} part files created successfully.`);
    }
  }

  if (pool) {
    await pool.end();
  }

  console.log(`\n============================================================`);
  console.log(`FINISHED! Total products exported from Firestore: ${totalExported}`);
  console.log(`SQL Dump Files generated in root directory!`);
  console.log(`============================================================\n`);
  process.exit(0);
}

runExport().catch(err => {
  console.error("Fatal export error:", err);
  process.exit(1);
});
