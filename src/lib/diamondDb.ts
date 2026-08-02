import { Product, Order, SupportTicket } from '../types';
import { firestoreDb } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  limit
} from 'firebase/firestore';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_2651873',
    name: '0.72ct Emerald Cut Diamond',
    cut: 'EX',
    color: 'E',
    clarity: 'VVS1',
    carat: 0.720,
    certification: 'GIA',
    certId: '1553482006',
    price: 1005.93,
    stock: 5,
    image: 'https://d3at7kzws0mw3g.cloudfront.net/images/diamond/262354-148.jpg',
    images: ['https://d3at7kzws0mw3g.cloudfront.net/images/diamond/262354-148.jpg'],
    video360: 'https://d3at7kzws0mw3g.cloudfront.net/video/Vision360.html?d=262354-148',
    description: 'An exquisite emerald-cut diamond weighing 0.72 carats, displaying stunning optical precision. Rated E in color and VVS1 in clarity. Certified by GIA with outstanding fire, excellent polish, and very good symmetry.',
    status: 'In Stock',
    Sr_No_: 1,
    Stock_NO: '2651873',
    Shape: 'EMERALD',
    Color_Shade: 'WH',
    Rap_Rate: 3700.00,
    Rap_Vlu: 2664.00,
    Rap__: -62.24,
    Pr_Ct: 1397.12,
    Amount: 1005.93,
    TD_: 66.30,
    Tab_: 67.00,
    Polish: 'EX',
    Symmetry: 'VG',
    Fluorescent: 'M',
    Measurement: '6.25x4.13x2.74',
    Lab: 'GIA',
    H_A: '',
    CUL: 'N',
    Girdle: 'STK - VTK',
    Girdle_: 3.88,
    BIT: 'BT0',
    BIC: 'BC0',
    WIT: 'WT0',
    WIC: 'WC0',
    MILKY: 'M0',
    LIns: 'L.I',
    LUS: 'EX',
    OPPV: 'PO0',
    OPTA: 'TO0',
    OPCR: 'CO0',
    CA: 0.00,
    CH: 13.77,
    PA: 0.00,
    PHP: 48.49,
    CERT_NO: '1553482006',
    Location: 'UPCOMING',
    RO: 'NA',
    EC: 'E0',
    Keytosymbol: 'Pinpoint / Feather',
    FancyColorDescription: '',
    ImageLink: 'https://d3at7kzws0mw3g.cloudfront.net/images/diamond/262354-148.jpg',
    CertificateLink: 'https://d3at7kzws0mw3g.cloudfront.net/certificates/1553482006.jpg',
    VideoLink: 'https://d3at7kzws0mw3g.cloudfront.net/video/Vision360.html?d=262354-148',
    Videomp4Link: 'https://d3at7kzws0mw3g.cloudfront.net/video/mp4/262354-148.mp4'
  },
  {
    id: 'prod_eternal_1',
    name: 'The Eternal Flame Brilliant',
    cut: 'Excellent',
    color: 'D',
    clarity: 'FL',
    carat: 2.54,
    certification: 'GIA',
    certId: 'GIA-254911802',
    price: 850000,
    stock: 2,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400'
    ],
    video360: 'https://raavsolutions.com/phetmanyapp/videos/eternal_flame_360.mp4',
    description: 'An absolute paragon of natural perfection. This D-Flawless round brilliant-cut diamond is GIA-certified with triple Excellent grading (Cut, Polish, Symmetry). It possesses breathtaking fire and uncompromised structural integrity.',
    status: 'In Stock',
    Sr_No_: 2,
    Stock_NO: 'ET-2549118',
    Shape: 'ROUND',
    Color_Shade: 'WH',
    Rap_Rate: 334645.00,
    Rap_Vlu: 850000.00,
    Rap__: 0.00,
    Pr_Ct: 334645.00,
    Amount: 850000.00,
    TD_: 61.20,
    Tab_: 57.00,
    Polish: 'EX',
    Symmetry: 'EX',
    Fluorescent: 'N',
    Measurement: '8.75x8.79x5.36',
    Lab: 'GIA',
    H_A: '3EX H&A',
    CUL: 'N',
    Girdle: 'MED',
    Girdle_: 3.50,
    BIT: 'BT0',
    BIC: 'BC0',
    WIT: 'WT0',
    WIC: 'WC0',
    MILKY: 'M0',
    LIns: 'L.I',
    LUS: 'EX',
    OPPV: 'PO0',
    OPTA: 'TO0',
    OPCR: 'CO0',
    CA: 34.50,
    CH: 15.00,
    PA: 40.80,
    PHP: 45.00,
    CERT_NO: '254911802',
    Location: 'BANGKOK',
    RO: 'NA',
    EC: 'E0',
    Keytosymbol: 'None',
    FancyColorDescription: '',
    ImageLink: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
    CertificateLink: 'https://www.gia.edu/report-check?reportno=254911802',
    VideoLink: 'https://raavsolutions.com/phetmanyapp/videos/eternal_flame_360.mp4'
  },
  {
    id: 'prod_royal_oval',
    name: 'PHETMANY Royal Oval Cut',
    cut: 'Excellent',
    color: 'E',
    clarity: 'IF',
    carat: 3.12,
    certification: 'GIA',
    certId: 'GIA-992014589',
    price: 1250000,
    stock: 1,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=400'
    ],
    video360: 'https://raavsolutions.com/phetmanyapp/videos/royal_oval_360.mp4',
    description: 'An extraordinary oval cut diamond of magnificent scale and brilliance. The internally flawless (IF) rating ensures complete optical transparency, refracting light into a breathtaking, dance-like pattern.',
    status: 'In Stock',
    Sr_No_: 3,
    Stock_NO: 'RO-9920145',
    Shape: 'OVAL',
    Color_Shade: 'WH',
    Rap_Rate: 400641.00,
    Rap_Vlu: 1250000.00,
    Rap__: 0.00,
    Pr_Ct: 400641.00,
    Amount: 1250000.00,
    TD_: 62.80,
    Tab_: 58.00,
    Polish: 'EX',
    Symmetry: 'EX',
    Fluorescent: 'N',
    Measurement: '11.45x8.12x5.10',
    Lab: 'GIA',
    H_A: '',
    CUL: 'N',
    Girdle: 'MED-STK',
    Girdle_: 3.60,
    BIT: 'BT0',
    BIC: 'BC0',
    WIT: 'WT0',
    WIC: 'WC0',
    MILKY: 'M0',
    LIns: 'L.I',
    LUS: 'EX',
    OPPV: 'PO0',
    OPTA: 'TO0',
    OPCR: 'CO0',
    CA: 35.00,
    CH: 14.50,
    PA: 40.20,
    PHP: 44.50,
    CERT_NO: '992014589',
    Location: 'HONG KONG',
    RO: 'NA',
    EC: 'E0',
    Keytosymbol: 'None',
    FancyColorDescription: '',
    ImageLink: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400',
    CertificateLink: 'https://www.gia.edu/report-check?reportno=992014589',
    VideoLink: 'https://raavsolutions.com/phetmanyapp/videos/royal_oval_360.mp4'
  },
  {
    id: 'prod_siam_pear',
    name: 'Siam Majesty Pear Cut',
    cut: 'Very Good',
    color: 'F',
    clarity: 'VVS1',
    carat: 1.85,
    certification: 'IGI',
    certId: 'IGI-503418902',
    price: 490000,
    stock: 4,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400',
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400'],
    video360: '',
    description: 'Featuring an elegant elongated teardrop contour, the Siam Majesty Pear Cut diamond exhibits outstanding scintillation. Its VVS1 clarity represents near-perfect molecular alignment under 10x magnification.',
    status: 'In Stock',
    Sr_No_: 4,
    Stock_NO: 'SM-5034189',
    Shape: 'PEAR',
    Color_Shade: 'WH',
    Rap_Rate: 264864.00,
    Rap_Vlu: 490000.00,
    Rap__: 0.00,
    Pr_Ct: 264864.00,
    Amount: 490000.00,
    TD_: 61.50,
    Tab_: 59.00,
    Polish: 'VG',
    Symmetry: 'VG',
    Fluorescent: 'F',
    Measurement: '9.80x6.40x3.93',
    Lab: 'IGI',
    H_A: '',
    CUL: 'N',
    Girdle: 'MED-THK',
    Girdle_: 4.00,
    BIT: 'BT0',
    BIC: 'BC0',
    WIT: 'WT0',
    WIC: 'WC0',
    MILKY: 'M0',
    LIns: 'L.I',
    LUS: 'EX',
    OPPV: 'PO0',
    OPTA: 'TO0',
    OPCR: 'CO0',
    CA: 34.00,
    CH: 14.00,
    PA: 41.00,
    PHP: 46.00,
    CERT_NO: '503418902',
    Location: 'UPCOMING',
    RO: 'NA',
    EC: 'E0',
    Keytosymbol: 'Pinpoint',
    FancyColorDescription: '',
    ImageLink: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400',
    CertificateLink: 'https://www.igi.org/reports/verify-your-report?r=503418902',
    VideoLink: ''
  },
  {
    id: 'prod_cushion_star',
    name: 'Lanna Star Antique Cushion',
    cut: 'Excellent',
    color: 'G',
    clarity: 'VS1',
    carat: 2.05,
    certification: 'GIA',
    certId: 'GIA-440219582',
    price: 580000,
    stock: 2,
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=400',
    images: ['https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=400'],
    video360: 'https://raavsolutions.com/phetmanyapp/videos/cushion_star_360.mp4',
    description: 'Combining old-world charm with modern optical precision, this cushion-cut diamond features rounded corners and large facets that accentuate deep, rich flashes of white and colored dispersion.',
    status: 'In Stock',
    Sr_No_: 5,
    Stock_NO: 'LS-4402195',
    Shape: 'CUSHION',
    Color_Shade: 'WH',
    Rap_Rate: 282926.00,
    Rap_Vlu: 580000.00,
    Rap__: 0.00,
    Pr_Ct: 282926.00,
    Amount: 580000.00,
    TD_: 64.20,
    Tab_: 56.00,
    Polish: 'EX',
    Symmetry: 'EX',
    Fluorescent: 'N',
    Measurement: '7.85x7.40x4.75',
    Lab: 'GIA',
    H_A: '',
    CUL: 'N',
    Girdle: 'MED-VTK',
    Girdle_: 3.90,
    BIT: 'BT0',
    BIC: 'BC0',
    WIT: 'WT0',
    WIC: 'WC0',
    MILKY: 'M0',
    LIns: 'L.I',
    LUS: 'EX',
    OPPV: 'PO0',
    OPTA: 'TO0',
    OPCR: 'CO0',
    CA: 33.50,
    CH: 15.50,
    PA: 40.50,
    PHP: 43.00,
    CERT_NO: '440219582',
    Location: 'BANGKOK',
    RO: 'NA',
    EC: 'E0',
    Keytosymbol: 'Feather',
    FancyColorDescription: '',
    ImageLink: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=400',
    CertificateLink: 'https://www.gia.edu/report-check?reportno=440219582',
    VideoLink: 'https://raavsolutions.com/phetmanyapp/videos/cushion_star_360.mp4'
  },
  {
    id: 'prod_princess_cut_1',
    name: 'Imperial Princess Brilliant',
    cut: 'Excellent',
    color: 'D',
    clarity: 'VVS2',
    carat: 1.50,
    certification: 'GIA',
    certId: 'GIA-618294012',
    price: 380000,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
    images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400'],
    video360: '',
    description: 'A sharp, modern square princess cut diamond with exceptional light performance. D color and VVS2 clarity certified by GIA.',
    status: 'In Stock',
    Sr_No_: 6,
    Stock_NO: 'PR-6182940',
    Shape: 'PRINCESS',
    Color_Shade: 'WH',
    Rap_Rate: 253333.00,
    Rap_Vlu: 380000.00,
    Pr_Ct: 253333.00,
    Amount: 380000.00,
    TD_: 71.0,
    Tab_: 69.0,
    Polish: 'EX',
    Symmetry: 'EX',
    Lab: 'GIA',
    CERT_NO: '618294012',
    Location: 'BANGKOK',
    ImageLink: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'prod_radiant_cut_1',
    name: 'Golden Sunburst Radiant',
    cut: 'Excellent',
    color: 'F',
    clarity: 'VS1',
    carat: 2.20,
    certification: 'GIA',
    certId: 'GIA-732918405',
    price: 620000,
    stock: 2,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400',
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400'],
    video360: '',
    description: 'A vibrant 2.20 carat radiant cut diamond combining the lines of an emerald cut with the brilliance of a round diamond.',
    status: 'In Stock',
    Sr_No_: 7,
    Stock_NO: 'RD-7329184',
    Shape: 'RADIANT',
    Color_Shade: 'WH',
    Rap_Rate: 281818.00,
    Amount: 620000.00,
    Polish: 'EX',
    Symmetry: 'EX',
    Lab: 'GIA',
    CERT_NO: '732918405',
    Location: 'HONG KONG',
    ImageLink: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'prod_marquise_1',
    name: 'Empress Marquise Cut',
    cut: 'Very Good',
    color: 'E',
    clarity: 'VVS1',
    carat: 1.30,
    certification: 'GIA',
    certId: 'GIA-829104712',
    price: 410000,
    stock: 1,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400',
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400'],
    video360: '',
    description: 'Slender and graceful marquise cut diamond. Maximizes carat weight illusion with elongated elegance and intense optical brilliance.',
    status: 'In Stock',
    Sr_No_: 8,
    Stock_NO: 'MQ-8291047',
    Shape: 'MARQUISE',
    Color_Shade: 'WH',
    Rap_Rate: 315384.00,
    Amount: 410000.00,
    Polish: 'VG',
    Symmetry: 'VG',
    Lab: 'GIA',
    CERT_NO: '829104712',
    Location: 'SURAT',
    ImageLink: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'prod_heart_cut_1',
    name: 'Passion Heart Shape Diamond',
    cut: 'Excellent',
    color: 'F',
    clarity: 'VS2',
    carat: 1.75,
    certification: 'GIA',
    certId: 'GIA-194028374',
    price: 450000,
    stock: 2,
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=400',
    images: ['https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=400'],
    video360: '',
    description: 'Symmetrically carved heart cut diamond with sweet proportions and radiant scintillation. Certified by GIA.',
    status: 'In Stock',
    Sr_No_: 9,
    Stock_NO: 'HT-1940283',
    Shape: 'HEART',
    Color_Shade: 'WH',
    Amount: 450000.00,
    Polish: 'EX',
    Symmetry: 'EX',
    Lab: 'GIA',
    CERT_NO: '194028374',
    Location: 'BANGKOK',
    ImageLink: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'prod_asscher_1',
    name: 'Royal Asscher Vintage Cut',
    cut: 'Excellent',
    color: 'D',
    clarity: 'IF',
    carat: 2.10,
    certification: 'GIA',
    certId: 'GIA-301928475',
    price: 920000,
    stock: 1,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
    images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400'],
    video360: '',
    description: 'A mesmerizing step-cut Asscher diamond featuring concentric square hall-of-mirrors reflection and D-IF perfection.',
    status: 'In Stock',
    Sr_No_: 10,
    Stock_NO: 'AS-3019284',
    Shape: 'ASSCHER',
    Color_Shade: 'WH',
    Amount: 920000.00,
    Polish: 'EX',
    Symmetry: 'EX',
    Lab: 'GIA',
    CERT_NO: '301928475',
    Location: 'HONG KONG',
    ImageLink: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'prod_round_flawless_2',
    name: 'Celestial Round Brilliant',
    cut: '3EX',
    color: 'D',
    clarity: 'IF',
    carat: 1.01,
    certification: 'GIA',
    certId: 'GIA-582910482',
    price: 320000,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400',
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400'],
    video360: '',
    description: 'The classic 1-carat benchmark. Pure D-IF GIA triple excellent round diamond with hearts and arrows alignment.',
    status: 'In Stock',
    Sr_No_: 11,
    Stock_NO: 'RD-5829104',
    Shape: 'ROUND',
    Color_Shade: 'WH',
    Amount: 320000.00,
    Polish: 'EX',
    Symmetry: 'EX',
    Lab: 'GIA',
    CERT_NO: '582910482',
    Location: 'BANGKOK',
    ImageLink: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'prod_oval_vvs2',
    name: 'Emerald Isle Oval Cut',
    cut: 'Excellent',
    color: 'E',
    clarity: 'VVS2',
    carat: 1.60,
    certification: 'GIA',
    certId: 'GIA-920193847',
    price: 460000,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400',
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400'],
    video360: '',
    description: '1.60 carat oval cut diamond with excellent ratio and fire. E color, VVS2 clarity certified by GIA.',
    status: 'In Stock',
    Sr_No_: 12,
    Stock_NO: 'OV-9201938',
    Shape: 'OVAL',
    Color_Shade: 'WH',
    Amount: 460000.00,
    Polish: 'EX',
    Symmetry: 'EX',
    Lab: 'GIA',
    CERT_NO: '920193847',
    Location: 'BANGKOK',
    ImageLink: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400'
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_1001',
    customerId: 'guest_demo',
    customerName: 'Kittisak Prasert',
    customerEmail: 'kittisak@gmail.com',
    items: [
      {
        product: INITIAL_PRODUCTS[2], // Pear cut
        quantity: 1
      }
    ],
    totalAmount: 490000,
    paymentMethod: 'PromptPay',
    paymentStatus: 'Paid',
    shippingStatus: 'Shipped',
    shippingAddress: {
      fullName: 'Kittisak Prasert',
      phone: '081-234-5678',
      street: '123 Sukhumvit Rd, Khlong Toei',
      city: 'Bangkok',
      state: 'Bangkok',
      zipCode: '10110',
      country: 'Thailand'
    },
    invoiceNumber: 'INV-2026-0001',
    createdAt: '2026-07-02T10:30:00Z',
    trackingNumber: 'THAIPOST-EM98725142TH',
    trackingHistory: [
      { status: 'Processing', timestamp: '2026-07-02T10:45:00Z', note: 'Order paid successfully via PromptPay QR.' },
      { status: 'Shipped', timestamp: '2026-07-03T14:20:00Z', note: 'Package dispatched via Thailand Post EMS. Air transit initiated.' }
    ]
  },
  {
    id: 'ord_1002',
    customerId: 'cust_support_1',
    customerName: 'Siriporn Techawong',
    customerEmail: 'siriporn@phetmany.co',
    items: [
      {
        product: INITIAL_PRODUCTS[0], // Eternal Flame
        quantity: 1
      }
    ],
    totalAmount: 850000,
    paymentMethod: 'TrueMoney',
    paymentStatus: 'Pending',
    shippingStatus: 'Processing',
    shippingAddress: {
      fullName: 'Siriporn Techawong',
      phone: '089-876-5432',
      street: '55/9 Ratchadapisek Road, Huai Khwang',
      city: 'Bangkok',
      state: 'Bangkok',
      zipCode: '10310',
      country: 'Thailand'
    },
    invoiceNumber: 'INV-2026-0002',
    createdAt: '2026-07-04T16:00:00Z',
    trackingHistory: [
      { status: 'Processing', timestamp: '2026-07-04T16:05:00Z', note: 'Order created. Awaiting TrueMoney wallet payment validation.' }
    ]
  }
];

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tkt_101',
    userId: 'guest_demo',
    userName: 'Kittisak Prasert',
    userEmail: 'kittisak@gmail.com',
    subject: 'GIA Certificate authenticity inquiry',
    status: 'Open',
    createdAt: '2026-07-03T09:00:00Z',
    messages: [
      {
        id: 'msg_1',
        sender: 'user',
        senderName: 'Kittisak Prasert',
        text: 'Hello, I bought the Siam Majesty Pear Cut. Can I double check how to verify my GIA certificate on the official GIA website?',
        timestamp: '2026-07-03T09:00:00Z'
      },
      {
        id: 'msg_2',
        sender: 'support',
        senderName: 'PHETMANY Support',
        text: 'Hello Kittisak! Thank you for your purchase. You can visit gia.edu, click on Report Check, and enter your Report Number (which is engraved on the girdle of your diamond and printed on the physical certificate we sent you). For your Pear cut, the report is GIA-503418902.',
        timestamp: '2026-07-03T09:30:00Z'
      }
    ]
  }
];

// Helper functions for Local Storage persistence & Firestore Synchronization

// --- Simple IndexedDB Cache Wrapper for Large Catalogs ---
const IDB_NAME = 'phetmany_db_v2';
const IDB_VERSION = 1;
const STORE_PRODUCTS = 'products';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (e) => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(STORE_PRODUCTS)) {
        dbInstance.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProductsToIndexedDB(products: Product[]): Promise<void> {
  try {
    const dbInstance = await openIDB();
    const tx = dbInstance.transaction(STORE_PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTS);
    store.clear();
    for (const p of products) {
      store.put(p);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        dbInstance.close();
        resolve();
      };
      tx.onerror = () => {
        dbInstance.close();
        reject(tx.error);
      };
    });
  } catch (e) {
    console.error('Failed to save to IndexedDB:', e);
  }
}

export async function getProductsFromIndexedDB(): Promise<Product[]> {
  try {
    const dbInstance = await openIDB();
    const tx = dbInstance.transaction(STORE_PRODUCTS, 'readonly');
    const store = tx.objectStore(STORE_PRODUCTS);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        dbInstance.close();
        resolve(request.result || []);
      };
      request.onerror = () => {
        dbInstance.close();
        reject(request.error);
      };
    });
  } catch (e) {
    console.error('Failed to read from IndexedDB:', e);
    return [];
  }
}

// In-Memory Synchronous Cache
export let cachedProducts: Product[] = [];

export async function clearIndexedDBAndCache(): Promise<void> {
  cachedProducts = [];
  try {
    localStorage.removeItem('phetmany_products');
    localStorage.removeItem('phetmany_orders');
    localStorage.removeItem('phetmany_tickets');
  } catch (e) {}
  try {
    const dbInstance = await openIDB();
    const tx = dbInstance.transaction(STORE_PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTS);
    store.clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        dbInstance.close();
        resolve();
      };
      tx.onerror = () => {
        dbInstance.close();
        reject(tx.error);
      };
    });
  } catch (e) {
    console.warn('Failed to clear IndexedDB:', e);
  }
}

export function clearLocalProductCache(): void {
  cachedProducts = [];
  try {
    localStorage.removeItem('phetmany_products');
  } catch (e) {}
  clearIndexedDBAndCache().catch(console.error);
}

// Clear any existing cached products on load
clearLocalProductCache();

// --- Asynchronous Database Operations (Firestore Database ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b) ---

// PRODUCTS (Firestore)
export async function fetchProductsFromDb(): Promise<Product[]> {
  // 0. Cache-First: Return from memory cache if available (0 Firestore reads)
  if (cachedProducts && cachedProducts.length > 0) {
    return cachedProducts;
  }

  // Check local IndexedDB cache first before hitting network (0 Firestore reads)
  const dbList = await getProductsFromIndexedDB();
  if (dbList.length > 0) {
    cachedProducts = dbList;
    return dbList;
  }

  try {
    const productsCol = collection(firestoreDb, 'products');
    const q = query(productsCol, limit(100));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const list: Product[] = snapshot.docs.map(d => d.data() as Product);
      cachedProducts = list;
      try {
        if (list.length <= 1000) {
          localStorage.setItem('phetmany_products', JSON.stringify(list));
        }
      } catch (e) {}
      await saveProductsToIndexedDB(list);
      return list;
    }

    // Seed Firestore if products collection is empty
    console.log('Firestore products collection empty. Seeding initial products into ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b...');
    await saveProductsToDbInBatches(INITIAL_PRODUCTS);
    cachedProducts = INITIAL_PRODUCTS;
    return INITIAL_PRODUCTS;
  } catch (e: any) {
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit exceeded') || e?.message?.includes('Free daily read units')) {
      console.warn("⚠️ GCP Firestore free tier daily read quota limit reached (50,000 daily read units). Falling back to IndexedDB/LocalStorage cache.");
    } else {
      console.warn("Firestore fetch products error, relying on cache/IndexedDB:", e);
    }
  }

  // Fallback to local IndexedDB or initial products
  const fallbackList = await getProductsFromIndexedDB();
  if (fallbackList.length > 0) {
    cachedProducts = fallbackList;
    return fallbackList;
  }
  return getProducts();
}

// Backward compatibility alias
export const fetchProductsFromFirestore = fetchProductsFromDb;

export async function fetchProductsFromDbPaged(
  page: number,
  pageSize: number
): Promise<{ products: Product[]; total: number }> {
  const allProducts = await fetchProductsFromDb();
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    products: allProducts.slice(start, end),
    total: allProducts.length,
  };
}

// Backward compatibility alias
export const fetchProductsFromFirestorePaged = fetchProductsFromDbPaged;

export async function saveProductsToDb(products: Product[]): Promise<void> {
  await saveProductsToDbInBatches(products);
}

// Backward compatibility alias
export const saveProductsToFirestore = saveProductsToDb;

export async function saveProductsToDbInBatches(
  productsToSave: Product[],
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<void> {
  const batchSize = 100;
  const total = productsToSave.length;
  let current = 0;

  for (let i = 0; i < total; i += batchSize) {
    const chunk = productsToSave.slice(i, i + batchSize);

    try {
      const batch = writeBatch(firestoreDb);
      for (const prod of chunk) {
        const docRef = doc(firestoreDb, 'products', prod.id);
        batch.set(docRef, prod);
      }
      await batch.commit();
    } catch (err) {
      console.warn('Firestore batch save error:', err);
    }

    current += chunk.length;
    if (onProgress) {
      onProgress(Math.round((current / total) * 100), current, total);
    }
  }
}

// Backward compatibility alias
export const saveProductsToFirestoreInBatches = saveProductsToDbInBatches;

export async function deleteProductFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(firestoreDb, 'products', id));
  } catch (error) {
    console.error("Failed to delete product from Firestore:", error);
  }
}

// Backward compatibility alias
export const deleteProductFromFirestore = deleteProductFromDb;

// ORDERS (Firestore)
export async function fetchOrdersFromDb(): Promise<Order[]> {
  try {
    const ordersCol = collection(firestoreDb, 'orders');
    const snapshot = await getDocs(ordersCol);
    if (!snapshot.empty) {
      const list: Order[] = snapshot.docs.map(d => d.data() as Order);
      localStorage.setItem('phetmany_orders', JSON.stringify(list));
      return list;
    }

    // Seed Firestore if empty
    console.log('Firestore orders empty. Seeding initial orders into ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b...');
    await saveOrdersToDb(INITIAL_ORDERS);
    return INITIAL_ORDERS;
  } catch (e) {
    console.warn("Firestore fetch orders error:", e);
  }

  return getOrders();
}

// Backward compatibility alias
export const fetchOrdersFromFirestore = fetchOrdersFromDb;

export async function saveOrdersToDb(orders: Order[]): Promise<void> {
  for (const o of orders) {
    try {
      await setDoc(doc(firestoreDb, 'orders', o.id), o);
    } catch (e) {
      console.warn('Firestore save order error:', e);
    }
  }
}

// Backward compatibility alias
export const saveOrdersToFirestore = saveOrdersToDb;

// TICKETS (Firestore)
export async function fetchTicketsFromDb(): Promise<SupportTicket[]> {
  try {
    const ticketsCol = collection(firestoreDb, 'tickets');
    const snapshot = await getDocs(ticketsCol);
    if (!snapshot.empty) {
      const list: SupportTicket[] = snapshot.docs.map(d => d.data() as SupportTicket);
      localStorage.setItem('phetmany_tickets', JSON.stringify(list));
      return list;
    }

    // Seed Firestore if empty
    console.log('Firestore tickets empty. Seeding initial support tickets into ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b...');
    await saveTicketsToDb(INITIAL_TICKETS);
    return INITIAL_TICKETS;
  } catch (e) {
    console.warn("Firestore fetch tickets error:", e);
  }

  return getTickets();
}

// Backward compatibility alias
export const fetchTicketsFromFirestore = fetchTicketsFromDb;

export async function saveTicketsToDb(tickets: SupportTicket[]): Promise<void> {
  for (const t of tickets) {
    try {
      await setDoc(doc(firestoreDb, 'tickets', t.id), t);
    } catch (e) {
      console.warn('Firestore save ticket error:', e);
    }
  }
}

// Backward compatibility alias
export const saveTicketsToFirestore = saveTicketsToDb;


// --- Synchronous Storage Interfaces (Syncs to Firestore in background) ---

export function getProducts(): Product[] {
  if (cachedProducts && cachedProducts.length > 0) {
    return cachedProducts;
  }
  const local = localStorage.getItem('phetmany_products');
  if (!local) {
    return cachedProducts || [];
  }
  try {
    cachedProducts = JSON.parse(local);
    return cachedProducts;
  } catch (e) {
    return [];
  }
}

export function saveProducts(products: Product[]): void {
  cachedProducts = products;
  try {
    localStorage.setItem('phetmany_products', JSON.stringify(products));
  } catch (e) {
    console.warn("localStorage quota exceeded in saveProducts, relying on memory and IndexedDB:", e);
  }
  saveProductsToIndexedDB(products).catch(console.error);
  saveProductsToDbInBatches(products).catch(console.error);
}

export function addProduct(product: Product): void {
  const products = getProducts();
  products.unshift(product);
  cachedProducts = products;
  try {
    localStorage.setItem('phetmany_products', JSON.stringify(products));
  } catch (e) {
    console.warn("localStorage quota exceeded in addProduct, relying on memory and IndexedDB:", e);
  }
  saveProductsToIndexedDB(products).catch(console.error);
  setDoc(doc(firestoreDb, 'products', product.id), product).catch(console.error);
}

export function updateProduct(id: string, updates: Partial<Product>): void {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index > -1) {
    const updated = { ...products[index], ...updates };
    products[index] = updated;
    cachedProducts = products;
    try {
      localStorage.setItem('phetmany_products', JSON.stringify(products));
    } catch (e) {
      console.warn("localStorage quota exceeded in updateProduct, relying on memory and IndexedDB:", e);
    }
    saveProductsToIndexedDB(products).catch(console.error);
    setDoc(doc(firestoreDb, 'products', id), updated, { merge: true }).catch(console.error);
  }
}

export function deleteProduct(id: string): void {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  cachedProducts = filtered;
  try {
    localStorage.setItem('phetmany_products', JSON.stringify(filtered));
  } catch (e) {
    console.warn("localStorage quota exceeded in deleteProduct, relying on memory and IndexedDB:", e);
  }
  saveProductsToIndexedDB(filtered).catch(console.error);
  deleteProductFromDb(id).catch(console.error);
}

export function getOrders(): Order[] {
  const local = localStorage.getItem('phetmany_orders');
  if (!local) {
    localStorage.setItem('phetmany_orders', JSON.stringify(INITIAL_ORDERS));
    saveOrdersToDb(INITIAL_ORDERS).catch(console.error);
    return INITIAL_ORDERS;
  }
  try {
    return JSON.parse(local);
  } catch (e) {
    return INITIAL_ORDERS;
  }
}

export function saveOrders(orders: Order[]): void {
  localStorage.setItem('phetmany_orders', JSON.stringify(orders));
  saveOrdersToDb(orders).catch(console.error);
}

export function addOrder(order: Order): void {
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
}

export function updateOrder(id: string, updates: Partial<Order>): void {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index > -1) {
    orders[index] = { ...orders[index], ...updates };
    saveOrders(orders);
  }
}

export function getTickets(): SupportTicket[] {
  const local = localStorage.getItem('phetmany_tickets');
  if (!local) {
    localStorage.setItem('phetmany_tickets', JSON.stringify(INITIAL_TICKETS));
    saveTicketsToDb(INITIAL_TICKETS).catch(console.error);
    return INITIAL_TICKETS;
  }
  try {
    return JSON.parse(local);
  } catch (e) {
    return INITIAL_TICKETS;
  }
}

export function saveTickets(tickets: SupportTicket[]): void {
  localStorage.setItem('phetmany_tickets', JSON.stringify(tickets));
  saveTicketsToDb(tickets).catch(console.error);
}

export function addTicket(ticket: SupportTicket): void {
  const tickets = getTickets();
  tickets.unshift(ticket);
  saveTickets(tickets);
}

export function addTicketMessage(ticketId: string, text: string, sender: 'user' | 'support', senderName: string): void {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index > -1) {
    const newMessage = {
      id: 'msg_' + Date.now(),
      sender,
      senderName,
      text,
      timestamp: new Date().toISOString()
    };
    tickets[index].messages.push(newMessage);
    tickets[index].status = sender === 'user' ? 'Open' : 'Pending';
    saveTickets(tickets);
  }
}


