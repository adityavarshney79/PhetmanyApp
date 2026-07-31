-- ============================================================
-- HOSTINGER MYSQL DATABASE COMPLETE SCHEMA & DATA DUMP
-- Replicated from Firestore (9 Collections) for Hostinger MySQL / phpMyAdmin
-- Generated for User Hostinger Migration
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ------------------------------------------------------------
-- 1. TABLE STRUCTURE FOR: user_profiles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `fullName` VARCHAR(255) DEFAULT NULL,
  `role` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(100) DEFAULT 'Active',
  `walletBalance` DOUBLE DEFAULT 0,
  `data` LONGTEXT DEFAULT NULL,
  `createdAt` VARCHAR(255) DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `user_profiles` (`id`, `username`, `email`, `fullName`, `role`, `status`, `walletBalance`, `data`, `createdAt`) VALUES
('admin_master_1', 'savji_phetmany', 'savjidholakia@phetmany.co', 'Savji Dholakia', 'AdminMaster', 'Active', 0, '{"id":"admin_master_1","username":"savji_phetmany","email":"savjidholakia@phetmany.co","fullName":"Savji Dholakia","role":"AdminMaster","createdAt":"2026-01-01T09:00:00Z","lastLogin":"2026-07-05T10:15:00Z","status":"Active","walletBalance":0}', '2026-01-01T09:00:00Z'),
('super_admin_1', 'ghanshyam_admin', 'ghanshyam@phetmany.co', 'Ghanshyam Dholakia', 'Super Administrator', 'Active', 0, '{"id":"super_admin_1","username":"ghanshyam_admin","email":"ghanshyam@phetmany.co","fullName":"Ghanshyam Dholakia","role":"Super Administrator","createdAt":"2026-01-10T09:00:00Z","lastLogin":"2026-07-05T10:30:00Z","status":"Active","walletBalance":0}', '2026-01-10T09:00:00Z'),
('store_manager_1', 'rajesh_mgr', 'rajesh.patel@phetmany.co', 'Rajesh Patel', 'Store Manager', 'Active', 0, '{"id":"store_manager_1","username":"rajesh_mgr","email":"rajesh.patel@phetmany.co","fullName":"Rajesh Patel","role":"Store Manager","createdAt":"2026-02-15T11:00:00Z","lastLogin":"2026-07-05T08:00:00Z","status":"Active","walletBalance":0}', '2026-02-15T11:00:00Z'),
('tech_dev_1', 'kartik_dev', 'kartik.dev@phetmany.co', 'Kartik Kheni', 'Technical/Dev', 'Active', 0, '{"id":"tech_dev_1","username":"kartik_dev","email":"kartik.dev@phetmany.co","fullName":"Kartik Kheni","role":"Technical/Dev","createdAt":"2026-03-01T10:00:00Z","lastLogin":"2026-07-05T11:01:23Z","status":"Active","walletBalance":0}', '2026-03-01T10:00:00Z'),
('content_editor_1', 'meera_editor', 'meera.shah@phetmany.co', 'Meera Shah', 'Content Editor', 'Active', 0, '{"id":"content_editor_1","username":"meera_editor","email":"meera.shah@phetmany.co","fullName":"Meera Shah","role":"Content Editor","createdAt":"2026-03-20T14:00:00Z","lastLogin":"2026-07-04T16:45:00Z","status":"Active","walletBalance":0}', '2026-03-20T14:00:00Z'),
('cust_support_1', 'amit_support', 'amit.sharma@phetmany.co', 'Amit Sharma', 'Customer Support', 'Active', 0, '{"id":"cust_support_1","username":"amit_support","email":"amit.sharma@phetmany.co","fullName":"Amit Sharma","role":"Customer Support","createdAt":"2026-04-05T09:30:00Z","lastLogin":"2026-07-05T09:12:00Z","status":"Active","walletBalance":0}', '2026-04-05T09:30:00Z'),
('vip_customer_1', 'john_vip', 'john.smith@diamondtrade.com', 'John Smith (VIP)', 'VIP/Loyalty Member', 'Active', 150000, '{"id":"vip_customer_1","username":"john_vip","email":"john.smith@diamondtrade.com","fullName":"John Smith (VIP)","role":"VIP/Loyalty Member","createdAt":"2026-05-12T16:00:00Z","lastLogin":"2026-07-05T07:30:00Z","status":"Active","walletBalance":150000}', '2026-05-12T16:00:00Z'),
('b2b_partner_1', 'jewelry_traders_ltd', 'purchasing@jewelrytraders.com', 'Jewelry Traders Ltd', 'Wholesale/B2B Partner', 'Active', 0, '{"id":"b2b_partner_1","username":"jewelry_traders_ltd","email":"purchasing@jewelrytraders.com","fullName":"Jewelry Traders Ltd","role":"Wholesale/B2B Partner","createdAt":"2026-06-01T08:00:00Z","lastLogin":"2026-07-05T06:00:00Z","status":"Active","walletBalance":0}', '2026-06-01T08:00:00Z')
ON DUPLICATE KEY UPDATE
  `username` = VALUES(`username`), `email` = VALUES(`email`), `fullName` = VALUES(`fullName`),
  `role` = VALUES(`role`), `status` = VALUES(`status`), `walletBalance` = VALUES(`walletBalance`), `data` = VALUES(`data`);


-- ------------------------------------------------------------
-- 2. TABLE STRUCTURE FOR: wallet_transactions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` VARCHAR(255) NOT NULL,
  `userId` VARCHAR(255) DEFAULT NULL,
  `username` VARCHAR(255) DEFAULT NULL,
  `userEmail` VARCHAR(255) DEFAULT NULL,
  `amount` DOUBLE DEFAULT 0,
  `paymentGateway` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(100) DEFAULT 'Pending',
  `paymentSlipUrl` TEXT DEFAULT NULL,
  `upiTransactionId` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `adminFeedback` TEXT DEFAULT NULL,
  `createdAt` VARCHAR(255) DEFAULT NULL,
  `updatedAt` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `wallet_transactions` (`id`, `userId`, `username`, `userEmail`, `amount`, `paymentGateway`, `status`, `paymentSlipUrl`, `upiTransactionId`, `notes`, `adminFeedback`, `createdAt`, `updatedAt`) VALUES
('tx_seed_1', 'vip_customer_1', 'john_vip', 'john.smith@diamondtrade.com', 150000, 'Wire Transfer', 'Approved', 'https://raavsolutions.com/phetmanyapp/images/sample_receipt_1.jpg', NULL, 'Premium Diamond Wire transfer - invoice PM-2026-99', 'Verified with Siam Commercial Bank bank statement.', '2026-07-24T20:25:00Z', '2026-07-24T20:25:00Z'),
('tx_seed_2', 'b2b_partner_1', 'jewelry_traders_ltd', 'purchasing@jewelrytraders.com', 500000, 'Wire Transfer', 'Pending', 'https://raavsolutions.com/phetmanyapp/images/sample_receipt_2.jpg', NULL, 'Bulk deposit for upcoming diamond auctions', NULL, '2026-07-27T18:25:00Z', '2026-07-27T18:25:00Z'),
('tx_seed_3', 'guest_demo_user', 'demo_shopper', 'shopper@phetmany.co', 45000, 'UPI', 'Pending', NULL, 'UPI-9921-8812-7721', 'Quick wallet credit for ring setting', NULL, '2026-07-27T19:25:00Z', '2026-07-27T19:25:00Z'),
('tx_seed_4', 'vip_customer_1', 'john_vip', 'john.smith@diamondtrade.com', 80000, 'Wire Transfer', 'Rejected', 'https://raavsolutions.com/phetmanyapp/images/sample_receipt_3.jpg', NULL, 'Adding money for side stones', 'Discrepancy: Uploaded receipt is from July 2025 (stale date) and doesn\'t match current ledger amount.', '2026-07-26T20:25:00Z', '2026-07-26T21:25:00Z')
ON DUPLICATE KEY UPDATE
  `userId` = VALUES(`userId`), `username` = VALUES(`username`), `userEmail` = VALUES(`userEmail`),
  `amount` = VALUES(`amount`), `paymentGateway` = VALUES(`paymentGateway`), `status` = VALUES(`status`),
  `paymentSlipUrl` = VALUES(`paymentSlipUrl`), `upiTransactionId` = VALUES(`upiTransactionId`),
  `notes` = VALUES(`notes`), `adminFeedback` = VALUES(`adminFeedback`), `updatedAt` = VALUES(`updatedAt`);


-- ------------------------------------------------------------
-- 3. TABLE STRUCTURE FOR: products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `Sr_No_` INT AUTO_INCREMENT PRIMARY KEY,
  `Stock_NO` VARCHAR(50) DEFAULT NULL,
  `Shape` VARCHAR(50) DEFAULT NULL,
  `Carat` DECIMAL(10,2) DEFAULT 0,
  `Clarity` VARCHAR(20) DEFAULT NULL,
  `Color` VARCHAR(20) DEFAULT NULL,
  `Color_Shade` VARCHAR(20) DEFAULT NULL,
  `Rap_Rate` INT DEFAULT 0,
  `Rap_Vlu` INT DEFAULT 0,
  `Rap__` DECIMAL(10,2) DEFAULT 0,
  `Pr_Ct` DECIMAL(10,2) DEFAULT 0,
  `Amount` DECIMAL(10,2) DEFAULT 0,
  `TD_` DECIMAL(5,2) DEFAULT 0,
  `Tab_` DECIMAL(5,2) DEFAULT 0,
  `Cut` VARCHAR(10) DEFAULT NULL,
  `Polish` VARCHAR(10) DEFAULT NULL,
  `Symmetry` VARCHAR(10) DEFAULT NULL,
  `Fluorescent` VARCHAR(20) DEFAULT NULL,
  `Measurement` VARCHAR(50) DEFAULT NULL,
  `Lab` VARCHAR(20) DEFAULT NULL,
  `H_A` VARCHAR(10) DEFAULT NULL,
  `CUL` VARCHAR(10) DEFAULT NULL,
  `Girdle` VARCHAR(50) DEFAULT NULL,
  `Girdle_` INT DEFAULT 0,
  `BIT` VARCHAR(10) DEFAULT NULL,
  `BIC` VARCHAR(10) DEFAULT NULL,
  `WIT` VARCHAR(10) DEFAULT NULL,
  `WIC` VARCHAR(10) DEFAULT NULL,
  `MILKY` VARCHAR(10) DEFAULT NULL,
  `LIns` VARCHAR(20) DEFAULT NULL,
  `LUS` VARCHAR(10) DEFAULT NULL,
  `OPPV` VARCHAR(10) DEFAULT NULL,
  `OPTA` VARCHAR(10) DEFAULT NULL,
  `OPCR` VARCHAR(10) DEFAULT NULL,
  `CA` DECIMAL(5,2) DEFAULT 0,
  `CH` DECIMAL(5,2) DEFAULT 0,
  `PA` DECIMAL(5,2) DEFAULT 0,
  `PHP` DECIMAL(5,2) DEFAULT 0,
  `CERT_NO` VARCHAR(50) DEFAULT NULL,
  `Location` VARCHAR(50) DEFAULT NULL,
  `RO` VARCHAR(10) DEFAULT NULL,
  `EC` VARCHAR(10) DEFAULT NULL,
  `Keytosymbol` VARCHAR(255) DEFAULT NULL,
  `FancyColorDescription` VARCHAR(255) DEFAULT NULL,
  `ImageLink` TEXT DEFAULT NULL,
  `CertificateLink` TEXT DEFAULT NULL,
  `VideoLink` TEXT DEFAULT NULL,
  `Videomp4Link` TEXT DEFAULT NULL,
  `id` VARCHAR(255) DEFAULT NULL,
  `name` TEXT DEFAULT NULL,
  `price` DOUBLE DEFAULT 0,
  `stock` INT DEFAULT 1,
  `image` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `status` VARCHAR(100) DEFAULT 'In Stock',
  `data` LONGTEXT DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_stockNo` (`Stock_NO`),
  KEY `idx_certNo` (`CERT_NO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (`id`, `name`, `cut`, `color`, `clarity`, `carat`, `certification`, `certId`, `price`, `stock`, `image`, `description`, `status`, `data`) VALUES
('prod_2651873', '0.72ct Emerald Cut Diamond', 'EX', 'E', 'VVS1', 0.72, 'GIA', '1553482006', 1005.93, 5, 'https://d3at7kzws0mw3g.cloudfront.net/images/diamond/262354-148.jpg', 'An exquisite emerald-cut diamond weighing 0.72 carats, displaying stunning optical precision. Rated E in color and VVS1 in clarity. Certified by GIA with outstanding fire, excellent polish, and very good symmetry.', 'In Stock', '{"id":"prod_2651873","name":"0.72ct Emerald Cut Diamond","cut":"EX","color":"E","clarity":"VVS1","carat":0.72,"certification":"GIA","certId":"1553482006","price":1005.93,"stock":5,"image":"https://d3at7kzws0mw3g.cloudfront.net/images/diamond/262354-148.jpg","status":"In Stock","Stock_NO":"2651873","Shape":"EMERALD"}'),
('prod_eternal_1', 'The Eternal Flame Brilliant', 'Excellent', 'D', 'FL', 2.54, 'GIA', 'GIA-254911802', 850000, 2, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400', 'An absolute paragon of natural perfection. This D-Flawless round brilliant-cut diamond is GIA-certified with triple Excellent grading (Cut, Polish, Symmetry). It possesses breathtaking fire and uncompromised structural integrity.', 'In Stock', '{"id":"prod_eternal_1","name":"The Eternal Flame Brilliant","cut":"Excellent","color":"D","clarity":"FL","carat":2.54,"certification":"GIA","certId":"GIA-254911802","price":850000,"stock":2,"image":"https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400","status":"In Stock","Shape":"ROUND"}'),
('prod_royal_oval', 'PHETMANY Royal Oval Cut', 'Excellent', 'E', 'IF', 3.12, 'GIA', 'GIA-992014589', 1250000, 1, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400', 'An extraordinary oval cut diamond of magnificent scale and brilliance. The internally flawless (IF) rating ensures complete optical transparency, refracting light into a breathtaking, dance-like pattern.', 'In Stock', '{"id":"prod_royal_oval","name":"PHETMANY Royal Oval Cut","cut":"Excellent","color":"E","clarity":"IF","carat":3.12,"certification":"GIA","certId":"GIA-992014589","price":1250000,"stock":1,"image":"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400","status":"In Stock","Shape":"OVAL"}'),
('prod_siam_pear', 'Siam Majesty Pear Cut', 'Very Good', 'F', 'VVS1', 1.85, 'IGI', 'IGI-503418902', 490000, 4, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400', 'Featuring an elegant elongated teardrop contour, the Siam Majesty Pear Cut diamond exhibits outstanding scintillation. Its VVS1 clarity represents near-perfect molecular alignment under 10x magnification.', 'In Stock', '{"id":"prod_siam_pear","name":"Siam Majesty Pear Cut","cut":"Very Good","color":"F","clarity":"VVS1","carat":1.85,"certification":"IGI","certId":"IGI-503418902","price":490000,"stock":4,"image":"https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400","status":"In Stock","Shape":"PEAR"}'),
('prod_cushion_star', 'Lanna Star Antique Cushion', 'Excellent', 'G', 'VS1', 2.05, 'GIA', 'GIA-440219582', 580000, 2, 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=400', 'Combining old-world charm with modern optical precision, this cushion-cut diamond features rounded corners and large facets that accentuate deep, rich flashes of white and colored dispersion.', 'In Stock', '{"id":"prod_cushion_star","name":"Lanna Star Antique Cushion","cut":"Excellent","color":"G","clarity":"VS1","carat":2.05,"certification":"GIA","certId":"GIA-440219582","price":580000,"stock":2,"image":"https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=400","status":"In Stock","Shape":"CUSHION"}'),
('prod_princess_cut_1', 'Imperial Princess Brilliant', 'Excellent', 'D', 'VVS2', 1.5, 'GIA', 'GIA-618294012', 380000, 3, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400', 'A sharp, modern square princess cut diamond with exceptional light performance. D color and VVS2 clarity certified by GIA.', 'In Stock', '{"id":"prod_princess_cut_1","name":"Imperial Princess Brilliant","cut":"Excellent","color":"D","clarity":"VVS2","carat":1.5,"certification":"GIA","certId":"GIA-618294012","price":380000,"stock":3,"status":"In Stock","Shape":"PRINCESS"}'),
('prod_radiant_cut_1', 'Golden Sunburst Radiant', 'Excellent', 'F', 'VS1', 2.2, 'GIA', 'GIA-732918405', 620000, 2, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400', 'A vibrant 2.20 carat radiant cut diamond combining the lines of an emerald cut with the brilliance of a round diamond.', 'In Stock', '{"id":"prod_radiant_cut_1","name":"Golden Sunburst Radiant","cut":"Excellent","color":"F","clarity":"VS1","carat":2.2,"certification":"GIA","certId":"GIA-732918405","price":620000,"stock":2,"status":"In Stock","Shape":"RADIANT"}'),
('prod_marquise_1', 'Empress Marquise Cut', 'Very Good', 'E', 'VVS1', 1.3, 'GIA', 'GIA-829104712', 410000, 1, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400', 'Slender and graceful marquise cut diamond. Maximizes carat weight illusion with elongated elegance and intense optical brilliance.', 'In Stock', '{"id":"prod_marquise_1","name":"Empress Marquise Cut","cut":"Very Good","color":"E","clarity":"VVS1","carat":1.3,"certification":"GIA","certId":"GIA-829104712","price":410000,"stock":1,"status":"In Stock","Shape":"MARQUISE"}'),
('prod_heart_cut_1', 'Passion Heart Shape Diamond', 'Excellent', 'F', 'VS2', 1.75, 'GIA', 'GIA-194028374', 450000, 2, 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=400', 'Symmetrically carved heart cut diamond with sweet proportions and radiant scintillation. Certified by GIA.', 'In Stock', '{"id":"prod_heart_cut_1","name":"Passion Heart Shape Diamond","cut":"Excellent","color":"F","clarity":"VS2","carat":1.75,"certification":"GIA","certId":"GIA-194028374","price":450000,"stock":2,"status":"In Stock","Shape":"HEART"}'),
('prod_asscher_1', 'Royal Asscher Vintage Cut', 'Excellent', 'D', 'IF', 2.1, 'GIA', 'GIA-301928475', 920000, 1, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400', 'A mesmerizing step-cut Asscher diamond featuring concentric square hall-of-mirrors reflection and D-IF perfection.', 'In Stock', '{"id":"prod_asscher_1","name":"Royal Asscher Vintage Cut","cut":"Excellent","color":"D","clarity":"IF","carat":2.1,"certification":"GIA","certId":"GIA-301928475","price":920000,"stock":1,"status":"In Stock","Shape":"ASSCHER"}'),
('prod_round_flawless_2', 'Celestial Round Brilliant', '3EX', 'D', 'IF', 1.01, 'GIA', 'GIA-582910482', 320000, 5, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400', 'The classic 1-carat benchmark. Pure D-IF GIA triple excellent round diamond with hearts and arrows alignment.', 'In Stock', '{"id":"prod_round_flawless_2","name":"Celestial Round Brilliant","cut":"3EX","color":"D","clarity":"IF","carat":1.01,"certification":"GIA","certId":"GIA-582910482","price":320000,"stock":5,"status":"In Stock","Shape":"ROUND"}'),
('prod_oval_vvs2', 'Emerald Isle Oval Cut', 'Excellent', 'E', 'VVS2', 1.6, 'GIA', 'GIA-920193847', 460000, 3, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400', '1.60 carat oval cut diamond with excellent ratio and fire. E color, VVS2 clarity certified by GIA.', 'In Stock', '{"id":"prod_oval_vvs2","name":"Emerald Isle Oval Cut","cut":"Excellent","color":"E","clarity":"VVS2","carat":1.6,"certification":"GIA","certId":"GIA-920193847","price":460000,"stock":3,"status":"In Stock","Shape":"OVAL"}')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`), `cut` = VALUES(`cut`), `color` = VALUES(`color`), `clarity` = VALUES(`clarity`),
  `carat` = VALUES(`carat`), `certification` = VALUES(`certification`), `certId` = VALUES(`certId`),
  `price` = VALUES(`price`), `stock` = VALUES(`stock`), `image` = VALUES(`image`),
  `description` = VALUES(`description`), `status` = VALUES(`status`), `data` = VALUES(`data`);


-- ------------------------------------------------------------
-- 4. TABLE STRUCTURE FOR: orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(255) NOT NULL,
  `customerId` VARCHAR(255) DEFAULT NULL,
  `customerName` VARCHAR(255) DEFAULT NULL,
  `customerEmail` VARCHAR(255) DEFAULT NULL,
  `totalAmount` DOUBLE DEFAULT 0,
  `paymentMethod` VARCHAR(100) DEFAULT NULL,
  `paymentStatus` VARCHAR(100) DEFAULT NULL,
  `shippingStatus` VARCHAR(100) DEFAULT NULL,
  `data` LONGTEXT DEFAULT NULL,
  `createdAt` VARCHAR(255) DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customerId` (`customerId`),
  KEY `idx_paymentStatus` (`paymentStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `orders` (`id`, `customerId`, `customerName`, `customerEmail`, `totalAmount`, `paymentMethod`, `paymentStatus`, `shippingStatus`, `data`, `createdAt`) VALUES
('ord_1001', 'guest_demo', 'Kittisak Prasert', 'kittisak@gmail.com', 490000, 'PromptPay', 'Paid', 'Shipped', '{"id":"ord_1001","customerId":"guest_demo","customerName":"Kittisak Prasert","customerEmail":"kittisak@gmail.com","totalAmount":490000,"paymentMethod":"PromptPay","paymentStatus":"Paid","shippingStatus":"Shipped","invoiceNumber":"INV-2026-0001","createdAt":"2026-07-02T10:30:00Z","trackingNumber":"THAIPOST-EM98725142TH"}', '2026-07-02T10:30:00Z'),
('ord_1002', 'cust_support_1', 'Siriporn Techawong', 'siriporn@phetmany.co', 850000, 'TrueMoney', 'Pending', 'Processing', '{"id":"ord_1002","customerId":"cust_support_1","customerName":"Siriporn Techawong","customerEmail":"siriporn@phetmany.co","totalAmount":850000,"paymentMethod":"TrueMoney","paymentStatus":"Pending","shippingStatus":"Processing","invoiceNumber":"INV-2026-0002","createdAt":"2026-07-04T16:00:00Z"}', '2026-07-04T16:00:00Z')
ON DUPLICATE KEY UPDATE
  `customerId` = VALUES(`customerId`), `customerName` = VALUES(`customerName`), `customerEmail` = VALUES(`customerEmail`),
  `totalAmount` = VALUES(`totalAmount`), `paymentMethod` = VALUES(`paymentMethod`), `paymentStatus` = VALUES(`paymentStatus`),
  `shippingStatus` = VALUES(`shippingStatus`), `data` = VALUES(`data`);


-- ------------------------------------------------------------
-- 5. TABLE STRUCTURE FOR: tickets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` VARCHAR(255) NOT NULL,
  `userId` VARCHAR(255) DEFAULT NULL,
  `userName` VARCHAR(255) DEFAULT NULL,
  `userEmail` VARCHAR(255) DEFAULT NULL,
  `subject` TEXT DEFAULT NULL,
  `status` VARCHAR(100) DEFAULT 'Open',
  `data` LONGTEXT DEFAULT NULL,
  `createdAt` VARCHAR(255) DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tickets` (`id`, `userId`, `userName`, `userEmail`, `subject`, `status`, `data`, `createdAt`) VALUES
('tkt_101', 'guest_demo', 'Kittisak Prasert', 'kittisak@gmail.com', 'GIA Certificate authenticity inquiry', 'Open', '{"id":"tkt_101","userId":"guest_demo","userName":"Kittisak Prasert","userEmail":"kittisak@gmail.com","subject":"GIA Certificate authenticity inquiry","status":"Open","createdAt":"2026-07-03T09:00:00Z","messages":[{"id":"msg_1","sender":"user","senderName":"Kittisak Prasert","text":"Hello, I bought the Siam Majesty Pear Cut. Can I double check how to verify my GIA certificate on the official GIA website?","timestamp":"2026-07-03T09:00:00Z"}]}', '2026-07-03T09:00:00Z')
ON DUPLICATE KEY UPDATE
  `userId` = VALUES(`userId`), `userName` = VALUES(`userName`), `userEmail` = VALUES(`userEmail`),
  `subject` = VALUES(`subject`), `status` = VALUES(`status`), `data` = VALUES(`data`);


-- ------------------------------------------------------------
-- 6. TABLE STRUCTURE FOR: home_banners
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `home_banners` (
  `id` VARCHAR(255) NOT NULL,
  `image` TEXT NOT NULL,
  `title` TEXT DEFAULT NULL,
  `active` TINYINT(1) DEFAULT 1,
  `createdAt` VARCHAR(255) DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `home_banners` (`id`, `image`, `title`, `active`, `createdAt`) VALUES
('banner_1', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200', 'VIEW OUR UNIQUELY MESMERISING TRAPEZOID CUT', 1, '2026-01-01T00:00:00Z'),
('banner_2', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200', 'EXCLUSIVE DIAMOND NECKLACES & FINE JEWELRY', 1, '2026-01-02T00:00:00Z'),
('banner_3', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200', 'COLLECTION OF HAND-PICKED EXQUISITE GEMSTONES', 1, '2026-01-03T00:00:00Z')
ON DUPLICATE KEY UPDATE
  `image` = VALUES(`image`), `title` = VALUES(`title`), `active` = VALUES(`active`);


-- ------------------------------------------------------------
-- 7. TABLE STRUCTURE FOR: affiliate_settings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `affiliate_settings` (
  `id` VARCHAR(255) NOT NULL,
  `benefits` LONGTEXT DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `affiliate_settings` (`id`, `benefits`) VALUES
('global_benefits', '["Flexible Triple-tier Commission Structure (Combine Per-Order, Per-Product & Percentages!)","Special Exclusive Discounts (Give 5% - 20% discount coupons to your clients & followers)","Real-time Analytics Dashboard (Detailed clicks, usage, referred orders, and payout tracking)","Instant Referral URL Generator with active source parameters tracking","Dedicated Gemologist Concierge support for closing high-ticket diamond deals"]')
ON DUPLICATE KEY UPDATE
  `benefits` = VALUES(`benefits`);


-- ------------------------------------------------------------
-- 8. TABLE STRUCTURE FOR: affiliates
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `affiliates` (
  `id` VARCHAR(255) NOT NULL,
  `userId` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `fullName` VARCHAR(255) DEFAULT NULL,
  `couponCode` VARCHAR(100) DEFAULT NULL,
  `discountPercent` DOUBLE DEFAULT 0,
  `commissionPerProduct` DOUBLE DEFAULT 0,
  `commissionPerOrder` DOUBLE DEFAULT 0,
  `commissionPercent` DOUBLE DEFAULT 0,
  `status` VARCHAR(100) DEFAULT 'Active',
  `clicks` INT DEFAULT 0,
  `data` LONGTEXT DEFAULT NULL,
  `createdAt` VARCHAR(255) DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_couponCode` (`couponCode`),
  KEY `idx_userId` (`userId`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `affiliates` (`id`, `userId`, `email`, `fullName`, `couponCode`, `discountPercent`, `commissionPerProduct`, `commissionPerOrder`, `commissionPercent`, `status`, `clicks`, `data`, `createdAt`) VALUES
('user_aff_01', 'user_01', 'affiliate1@phetmany.com', 'Aditya Varshney', 'ADITYA10', 10, 500, 1000, 5, 'Active', 142, '{"id":"user_aff_01","userId":"user_01","email":"affiliate1@phetmany.com","fullName":"Aditya Varshney","couponCode":"ADITYA10","discountPercent":10,"commissionPerProduct":500,"commissionPerOrder":1000,"commissionPercent":5,"status":"Active","clicks":142,"createdAt":"2026-06-27T20:25:00Z"}', '2026-06-27T20:25:00Z'),
('user_aff_02', 'user_02', 'partner@wholesale.com', 'Sarah Jenkins (Diamond Broker)', 'SARAHGLOW', 15, 1000, 2000, 8, 'Active', 89, '{"id":"user_aff_02","userId":"user_02","email":"partner@wholesale.com","fullName":"Sarah Jenkins (Diamond Broker)","couponCode":"SARAHGLOW","discountPercent":15,"commissionPerProduct":1000,"commissionPerOrder":2000,"commissionPercent":8,"status":"Active","clicks":89,"createdAt":"2026-07-12T20:25:00Z"}', '2026-07-12T20:25:00Z')
ON DUPLICATE KEY UPDATE
  `userId` = VALUES(`userId`), `email` = VALUES(`email`), `fullName` = VALUES(`fullName`),
  `couponCode` = VALUES(`couponCode`), `discountPercent` = VALUES(`discountPercent`),
  `commissionPerProduct` = VALUES(`commissionPerProduct`), `commissionPerOrder` = VALUES(`commissionPerOrder`),
  `commissionPercent` = VALUES(`commissionPercent`), `status` = VALUES(`status`), `clicks` = VALUES(`clicks`), `data` = VALUES(`data`);


-- ------------------------------------------------------------
-- 9. TABLE STRUCTURE FOR: referred_orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `referred_orders` (
  `id` VARCHAR(255) NOT NULL,
  `affiliateId` VARCHAR(255) DEFAULT NULL,
  `orderId` VARCHAR(255) DEFAULT NULL,
  `customerName` VARCHAR(255) DEFAULT NULL,
  `orderTotal` DOUBLE DEFAULT 0,
  `discountAmount` DOUBLE DEFAULT 0,
  `commissionEarned` DOUBLE DEFAULT 0,
  `commissionBreakdown` LONGTEXT DEFAULT NULL,
  `payoutStatus` VARCHAR(100) DEFAULT 'Unpaid',
  `payoutDate` VARCHAR(255) DEFAULT NULL,
  `payoutNotes` TEXT DEFAULT NULL,
  `createdAt` VARCHAR(255) DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_affiliateId` (`affiliateId`),
  KEY `idx_orderId` (`orderId`),
  KEY `idx_payoutStatus` (`payoutStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `referred_orders` (`id`, `affiliateId`, `orderId`, `customerName`, `orderTotal`, `discountAmount`, `commissionEarned`, `commissionBreakdown`, `payoutStatus`, `payoutDate`, `payoutNotes`, `createdAt`) VALUES
('ref_ord_101', 'user_aff_01', 'ord_5412', 'Chaiwat Mongkol', 450000, 45000, 24000, '{"perProduct":500,"perOrder":1000,"percent":22500}', 'Paid', '2026-07-22T20:25:00Z', 'Settle via Bank Transfer Ref #BT9921', '2026-07-17T20:25:00Z'),
('ref_ord_102', 'user_aff_01', 'ord_9872', 'Somchai Thani', 180000, 18000, 10500, '{"perProduct":500,"perOrder":1000,"percent":9000}', 'Unpaid', NULL, NULL, '2026-07-24T20:25:00Z')
ON DUPLICATE KEY UPDATE
  `affiliateId` = VALUES(`affiliateId`), `orderId` = VALUES(`orderId`), `customerName` = VALUES(`customerName`),
  `orderTotal` = VALUES(`orderTotal`), `discountAmount` = VALUES(`discountAmount`),
  `commissionEarned` = VALUES(`commissionEarned`), `commissionBreakdown` = VALUES(`commissionBreakdown`),
  `payoutStatus` = VALUES(`payoutStatus`), `payoutDate` = VALUES(`payoutDate`), `payoutNotes` = VALUES(`payoutNotes`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
