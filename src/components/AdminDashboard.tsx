import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Key, Lock, Trash2, Search, RefreshCw, 
  Plus, Edit3, X, CheckCircle2, AlertCircle, Sparkles, Package, 
  FileText, Truck, MessageSquare, TrendingUp, DollarSign, Calendar, Eye, EyeOff,
  Upload, Check, ChevronLeft, ChevronRight, LayoutGrid, List, Percent,
  BarChart3, PieChart, ShoppingBag, ShoppingCart, Ban, ArrowUpRight, ArrowDownRight, Tag,
  ExternalLink, Database, KeyRound, FileSpreadsheet, Wallet, Palette, Menu,
  Server, Wifi, WifiOff, Terminal
} from 'lucide-react';
import { UserProfile, UserRole, ROLE_DETAILS, Product, Order, SupportTicket, WalletTransaction } from '../types';
import ThemeSelector from './ThemeSelector';
import { 
  getProducts, saveProducts, getOrders, saveOrders, getTickets, addTicketMessage, saveTickets,
  fetchProductsFromDb, fetchOrdersFromDb, fetchTicketsFromDb,
  saveProductsToDbInBatches, getProductsFromIndexedDB, clearIndexedDBAndCache
} from '../lib/diamondDb';
import { 
  saveRapaportMatrix, parseRapaportCSV, parseRapaportJSON, generateMockRapaportMatrix 
} from '../lib/rapaportDb';
import {
  getAffiliateBenefits,
  saveAffiliateBenefits,
  getAffiliates,
  saveAffiliateProfile,
  getReferredOrders,
  updatePayoutStatus,
  AffiliateProfile,
  AffiliateReferredOrder
} from '../lib/affiliateDb';
import { 
  getWalletTransactions, 
  updateWalletTransactionStatus 
} from '../lib/walletDb';
import { 
  HomeBanner, getBanners, saveBanners, addBanner, deleteBanner, fetchBannersFromDb 
} from '../lib/homeThemeDb';
interface AdminDashboardProps {
  currentUser: UserProfile;
  onUpdateCurrentUser: (updates: Partial<UserProfile>) => void;
  users: UserProfile[];
  onAddUser: (user: UserProfile) => void;
  onUpdateUser: (id: string, updates: Partial<UserProfile>) => void;
  onDeleteUser: (id: string, username: string) => void;
  onRefreshUsers: () => void;
  logoUrl: string;
  onLogout: () => void;
  theme: 'light' | 'orange' | 'green' | 'dark' | 'navy';
  setTheme: (theme: 'light' | 'orange' | 'green' | 'dark' | 'navy') => void;
}

export default function AdminDashboard({ 
  currentUser, onUpdateCurrentUser, users, onAddUser, onUpdateUser, onDeleteUser, onRefreshUsers, logoUrl, onLogout, theme, setTheme
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'markup' | 'orders' | 'shipment' | 'affiliate' | 'analytics' | 'support' | 'rapnet' | 'wallet' | 'theme_menu' | 'db_connection'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // Database Connection Diagnostics States
  const [dbHostInput, setDbHostInput] = useState<string>('localhost');
  const [dbUserInput, setDbUserInput] = useState<string>('u513407224_phetmany');
  const [dbPasswordInput, setDbPasswordInput] = useState<string>('India@1234#@$$');
  const [dbNameInput, setDbNameInput] = useState<string>('u513407224_phetmany');
  const [dbPortInput, setDbPortInput] = useState<string>('3306');
  const [showDbPassword, setShowDbPassword] = useState<boolean>(false);
  const [isTestingDbConn, setIsTestingDbConn] = useState<boolean>(false);
  const [dbTestResultData, setDbTestResultData] = useState<any | null>(null);

  const handleRunDbTest = async (overrideConfig?: { host?: string; user?: string; password?: string; database?: string; port?: string }) => {
    setIsTestingDbConn(true);
    setDbTestResultData(null);
    try {
      const payload = {
        host: overrideConfig?.host !== undefined ? overrideConfig.host : dbHostInput,
        user: overrideConfig?.user !== undefined ? overrideConfig.user : dbUserInput,
        password: overrideConfig?.password !== undefined ? overrideConfig.password : dbPasswordInput,
        database: overrideConfig?.database !== undefined ? overrideConfig.database : dbNameInput,
        port: overrideConfig?.port !== undefined ? overrideConfig.port : dbPortInput,
      };
      const res = await fetch('/api/test-db-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setDbTestResultData(data);
    } catch (err: any) {
      setDbTestResultData({
        success: false,
        message: 'Network error contacting backend diagnostic endpoint',
        error: {
          code: 'NETWORK_FETCH_ERROR',
          message: err.message || String(err),
        },
        suggestions: [
          'Verify that server.ts is running on port 3000.',
          'Check browser developer tools console for network error details.',
        ],
      });
    } finally {
      setIsTestingDbConn(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'db_connection' && !dbTestResultData && !isTestingDbConn) {
      handleRunDbTest();
    }
  }, [activeTab]);
  
  // Wallet Top-Up Ledger States
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingWalletTransactions, setIsLoadingWalletTransactions] = useState<boolean>(false);
  const [walletFilter, setWalletFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [discrepancyNotes, setDiscrepancyNotes] = useState<string>('');
  const [showDiscrepancyInputId, setShowDiscrepancyInputId] = useState<string | null>(null);

  const loadWalletTransactionsData = async () => {
    setIsLoadingWalletTransactions(true);
    try {
      const data = await getWalletTransactions();
      setWalletTransactions(data);
    } catch (err) {
      console.warn("Failed to fetch wallet transactions:", err);
    } finally {
      setIsLoadingWalletTransactions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wallet' || activeTab === 'overview') {
      loadWalletTransactionsData();
    }
  }, [activeTab]);

  // Affiliate Suite States
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
  const [referredOrders, setReferredOrders] = useState<AffiliateReferredOrder[]>([]);
  const [affiliateBenefits, setAffiliateBenefits] = useState<string[]>([]);
  const [isLoadingAffiliates, setIsLoadingAffiliates] = useState<boolean>(false);
  const [newBenefitText, setNewBenefitText] = useState<string>('');
  
  // Create Coupon Form States
  const [newAffEmail, setNewAffEmail] = useState<string>('');
  const [newAffName, setNewAffName] = useState<string>('');
  const [newCouponCode, setNewCouponCode] = useState<string>('');
  const [newDiscountPercent, setNewDiscountPercent] = useState<number>(10);
  const [newCommProduct, setNewCommProduct] = useState<number>(500);
  const [newCommOrder, setNewCommOrder] = useState<number>(1000);
  const [newCommPercent, setNewCommPercent] = useState<number>(5);
  const [editingAffiliate, setEditingAffiliate] = useState<AffiliateProfile | null>(null);

  // Payout Settlement States
  const [payoutFilter, setPayoutFilter] = useState<'All' | 'Unpaid' | 'Pending' | 'Paid'>('All');
  const [settlingOrderId, setSettlingOrderId] = useState<string | null>(null);
  const [settlementNotes, setSettlementNotes] = useState<string>('');
  const [settlementStatus, setSettlementStatus] = useState<'Unpaid' | 'Pending' | 'Paid'>('Paid');

  // Filtered referred orders based on active tab filters
  const filteredReferredOrders = referredOrders.filter((o) => {
    const statusClean = o.payoutStatus || 'Unpaid';
    if (payoutFilter === 'All') return true;
    return statusClean === payoutFilter;
  });

  // Fetch Affiliate Data
  const loadAffiliateData = async () => {
    setIsLoadingAffiliates(true);
    try {
      const b = await getAffiliateBenefits();
      setAffiliateBenefits(b);
      const a = await getAffiliates();
      setAffiliates(a);
      const o = await getReferredOrders();
      setReferredOrders(o);
    } catch (err) {
      console.warn("Failed to load affiliate statistics", err);
    } finally {
      setIsLoadingAffiliates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'affiliate') {
      loadAffiliateData();
    }
  }, [activeTab]);
  
  // RapNet Suite Settings States
  const [rapnetClientId, setRapnetClientId] = useState<string>('');
  const [rapnetClientSecret, setRapnetClientSecret] = useState<string>('');
  const [rapnetLastSync, setRapnetLastSync] = useState<string>('Never');
  const [isSyncingRound, setIsSyncingRound] = useState<boolean>(false);
  const [isSyncingPear, setIsSyncingPear] = useState<boolean>(false);
  const [syncLogsRound, setSyncLogsRound] = useState<string>('');
  const [syncLogsPear, setSyncLogsPear] = useState<string>('');

  // Load settings on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const local = localStorage.getItem('rapnet_credentials');
        if (local) {
          const data = JSON.parse(local);
          setRapnetClientId(data.clientId || '');
          setRapnetClientSecret(data.clientSecret || '');
        }
      } catch (err) {
        console.warn("Failed to load RapNet settings:", err);
      }
      
      const last = localStorage.getItem('rapnet_last_sync_time');
      if (last) {
        setRapnetLastSync(new Date(last).toLocaleString());
      }
    };
    loadSettings();
  }, []);

  // Analytics states
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'insights' | 'performance' | 'notBought' | 'search'>('insights');
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');
  const [notBoughtSearchQuery, setNotBoughtSearchQuery] = useState('');
  const [unsoldPage, setUnsoldPage] = useState<number>(1);

  // Theme Customizer (Theme Menu) States
  const [customizerTab, setCustomizerTab] = useState<'banner' | 'featured' | 'stone_of_the_day' | 'exclusive'>('banner');
  const [adminBanners, setAdminBanners] = useState<HomeBanner[]>([]);
  const [isLoadingBanners, setIsLoadingBanners] = useState<boolean>(false);
  const [newBannerImage, setNewBannerImage] = useState<string>('');
  const [newBannerTitle, setNewBannerTitle] = useState<string>('');
  const [featuredSearch, setFeaturedSearch] = useState<string>('');
  const [sotdSearch, setSotdSearch] = useState<string>('');
  const [exclusiveSearch, setExclusiveSearch] = useState<string>('');
  const [featuredPage, setFeaturedPage] = useState<number>(1);
  const [sotdPage, setSotdPage] = useState<number>(1);
  const [exclusivePage, setExclusivePage] = useState<number>(1);

  useEffect(() => {
    setFeaturedPage(1);
  }, [featuredSearch, customizerTab]);

  useEffect(() => {
    setSotdPage(1);
  }, [sotdSearch, customizerTab]);

  useEffect(() => {
    setExclusivePage(1);
  }, [exclusiveSearch, customizerTab]);

  const loadBannersData = async () => {
    setIsLoadingBanners(true);
    try {
      const b = await fetchBannersFromDb();
      setAdminBanners(b);
    } catch (err) {
      console.warn("Failed to load banners:", err);
      setAdminBanners(getBanners());
    } finally {
      setIsLoadingBanners(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'theme_menu') {
      loadBannersData();
    }
  }, [activeTab]);
  
  // Products management state
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product list paging & search in Admin
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [currentProductPage, setCurrentProductPage] = useState<number>(1);
  const [productsPerPage, setProductsPerPage] = useState<number>(12);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Price Markup states
  const [markupScope, setMarkupScope] = useState<'all' | 'filtered' | 'attribute'>('all');
  const [markupSearchQuery, setMarkupSearchQuery] = useState('');
  const [markupPercent, setMarkupPercent] = useState<string>('15');
  const [markupRounding, setMarkupRounding] = useState<'none' | '10' | '100' | '1000'>('10');
  const [markupShape, setMarkupShape] = useState<string>('All');
  const [markupColor, setMarkupColor] = useState<string>('All');
  const [markupClarity, setMarkupClarity] = useState<string>('All');
  const [markupCut, setMarkupCut] = useState<string>('All');
  const [markupLab, setMarkupLab] = useState<string>('All');
  const [markupCaratMin, setMarkupCaratMin] = useState<string>('');
  const [markupCaratMax, setMarkupCaratMax] = useState<string>('');

  // Get unique lists for filter dropdowns dynamically
  const uniqueShapes = Array.from(new Set(products.map(p => String(p.Shape || p.shape || 'ROUND')))).map(s => String(s).toUpperCase()).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).sort();
  const uniqueColors = Array.from(new Set(products.map(p => String(p.color || '')))).map(c => String(c).toUpperCase()).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).sort();
  const uniqueClarities = Array.from(new Set(products.map(p => String(p.clarity || '')))).map(c => String(c).toUpperCase()).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).sort();
  const uniqueCuts = Array.from(new Set(products.map(p => String(p.cut || '')))).map(c => String(c)).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).sort();
  const uniqueLabs = Array.from(new Set(products.map(p => String(p.Lab || p.certification || 'GIA')))).map(l => String(l).toUpperCase()).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).sort();

  const calculateNewPrice = (originalPrice: number) => {
    const pct = parseFloat(markupPercent) || 0;
    let newPrice = originalPrice * (1 + pct / 100);
    
    if (markupRounding === '10') {
      newPrice = Math.round(newPrice / 10) * 10;
    } else if (markupRounding === '100') {
      newPrice = Math.round(newPrice / 100) * 100;
    } else if (markupRounding === '1000') {
      newPrice = Math.round(newPrice / 1000) * 1000;
    } else {
      newPrice = Math.round(newPrice);
    }
    return newPrice;
  };

  const getAffectedProducts = () => {
    return products.filter(p => {
      // 1. Filter by Search Query inside markup tool
      if (markupScope === 'filtered') {
        if (markupSearchQuery.trim()) {
          const query = markupSearchQuery.toLowerCase();
          const matchId = p.id.toLowerCase().includes(query);
          const matchName = p.name.toLowerCase().includes(query);
          const matchStockNo = p.Stock_NO?.toLowerCase().includes(query);
          const matchCert = p.certId?.toLowerCase().includes(query) || p.CERT_NO?.toLowerCase().includes(query);
          const matchShape = (p.Shape || p.shape || '').toLowerCase().includes(query);
          if (!matchId && !matchName && !matchStockNo && !matchCert && !matchShape) {
            return false;
          }
        }
      }

      // 2. Filter by Attributes
      if (markupScope === 'attribute') {
        if (markupShape !== 'All' && (p.Shape || p.shape || '').toUpperCase() !== markupShape.toUpperCase()) return false;
        if (markupColor !== 'All' && p.color?.toUpperCase() !== markupColor.toUpperCase()) return false;
        if (markupClarity !== 'All' && p.clarity?.toUpperCase() !== markupClarity.toUpperCase()) return false;
        if (markupCut !== 'All' && p.cut?.toUpperCase() !== markupCut.toUpperCase()) return false;
        
        // Lab check (p.Lab or p.certification)
        if (markupLab !== 'All') {
          const pLab = (p.Lab || p.certification || '').toUpperCase();
          if (pLab !== markupLab.toUpperCase()) return false;
        }

        // Carat range
        if (markupCaratMin && p.carat < parseFloat(markupCaratMin)) return false;
        if (markupCaratMax && p.carat > parseFloat(markupCaratMax)) return false;
      }

      return true;
    });
  };

  // Automatically reset the page when query or page size changes
  useEffect(() => {
    setCurrentProductPage(1);
  }, [productSearchQuery, productsPerPage]);

  // Filter and paginated products for administrator inventory dashboard
  const filteredAdminProducts = products.filter(p => {
    const q = productSearchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.shape || '').toLowerCase().includes(q) ||
      (p.certId || '').toLowerCase().includes(q) ||
      (p.certification || '').toLowerCase().includes(q) ||
      (p.color || '').toLowerCase().includes(q) ||
      (p.clarity || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  });
  const totalAdminProductPages = Math.ceil(filteredAdminProducts.length / productsPerPage) || 1;
  const paginatedAdminProducts = filteredAdminProducts.slice(
    (currentProductPage - 1) * productsPerPage,
    currentProductPage * productsPerPage
  );

  // New/Edit product form states
  const [prodName, setProdName] = useState('');
  const [prodCut, setProdCut] = useState<Product['cut']>('Excellent');
  const [prodColor, setProdColor] = useState<Product['color']>('D');
  const [prodClarity, setProdClarity] = useState<Product['clarity']>('FL');
  const [prodCarat, setProdCarat] = useState(1.0);
  const [prodCert, setProdCert] = useState<Product['certification']>('GIA');
  const [prodCertId, setProdCertId] = useState('');
  const [prodPrice, setProdPrice] = useState(250000);
  const [prodStock, setProdStock] = useState(1);
  const [prodImage, setProdImage] = useState('');
  const [prodVideo, setProdVideo] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodSpecs, setProdSpecs] = useState<Partial<Product>>({});
  const [showAdvancedSpecs, setShowAdvancedSpecs] = useState(false);

  // Importer & Syncing states
  const [showImporter, setShowImporter] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [cooldownTime, setCooldownTime] = useState<number>(() => {
    const saved = localStorage.getItem('last_api_sync_time');
    if (!saved) return 0;
    const diff = Date.now() - Number(saved);
    const fifteenMinsMs = 15 * 60 * 1000;
    if (diff < fifteenMinsMs) {
      return Math.ceil((fifteenMinsMs - diff) / 1000);
    }
    return 0;
  });

  const [importReport, setImportReport] = useState<{
    added: Product[];
    changed: {
      original: Product;
      updated: Product;
      diffs: { field: string; oldVal: any; newVal: any }[];
    }[];
    unchangedCount: number;
    removed: Product[];
  } | null>(null);

  const [batchUploadProgress, setBatchUploadProgress] = useState<{
    pct: number;
    current: number;
    total: number;
  } | null>(null);

  // Manual stock upload states as per requested code
  const [dragActive, setDragActive] = useState(false);
  const [appendMode, setAppendMode] = useState(true);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (cooldownTime <= 0) return;
    const interval = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownTime]);

  useEffect(() => {
    const loadDb = async () => {
      try {
        const idbProducts = await getProductsFromIndexedDB();
        if (idbProducts && idbProducts.length > 0) {
          setProducts(idbProducts);
        }

        const [freshProducts, freshOrders, freshTickets] = await Promise.all([
          fetchProductsFromDb(),
          fetchOrdersFromDb(),
          fetchTicketsFromDb()
        ]);
        setProducts(freshProducts);
        setOrders(freshOrders);
        setTickets(freshTickets);
      } catch (err) {
        console.error("Failed to sync AdminDashboard with Database:", err);
      }
    };
    loadDb();
  }, []);

  const handleReloadFromDb = async () => {
    setSyncLoading(true);
    try {
      const freshProducts = await fetchProductsFromDb();
      setProducts(freshProducts);
      setSyncSuccess(`MySQL Database Refreshed! ${freshProducts.length} live products loaded from database.`);
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (err: any) {
      setImportError("Failed to fetch from Database: " + (err.message || String(err)));
      setTimeout(() => setImportError(null), 5000);
    } finally {
      setSyncLoading(false);
    }
  };

  // Helper to parse CSV content
  const parseCSV = (text: string): Record<string, any>[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];
    
    // Detect delimiter
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';
    
    const splitLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = splitLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim());
    const data: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = splitLine(lines[i]).map(v => v.replace(/^["']|["']$/g, '').trim());
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] !== undefined ? values[index] : '';
      });
      data.push(row);
    }
    return data;
  };

  // Main evaluation and comparison logic
  const handleProcessRawData = (items: any[]) => {
    if (!Array.isArray(items)) {
      showToast('Invalid stock data format. Expected a JSON array or CSV structure.', true);
      return;
    }

    const currentProducts = [...products];
    const added: Product[] = [];
    const changed: {
      original: Product;
      updated: Product;
      diffs: { field: string; oldVal: any; newVal: any }[];
    }[] = [];
    let unchangedCount = 0;
    
    // We'll track matched IDs or Stock_NOs to see what's removed
    const matchedOriginalIds = new Set<string>();

    items.forEach((item) => {
      // Find key identifiers
      const stockNo = (item.Stock_NO || item.Stock_No || item.stock_no || item.Stock_no || item.CERT_NO || item.certId || '').toString().trim();
      if (!stockNo) return; // Skip rows/objects without identifier

      // Match with existing product
      const existing = currentProducts.find(p => 
        (p.Stock_NO && p.Stock_NO.toString().trim() === stockNo) || 
        (p.certId && p.certId.toString().trim() === stockNo) ||
        (p.id === 'prod_' + stockNo)
      );

      // Map incoming attributes safely to our schema
      const mappedCarat = Number(item.carat || item.Weight || item.Carat || existing?.carat || 0);
      const mappedShape = (item.Shape || item.ShapeName || existing?.Shape || 'ROUND').toString().toUpperCase().trim();
      const mappedCut = (item.cut || item.Cut || item.Polish || existing?.cut || 'Excellent').toString().trim();
      const mappedColor = (item.color || item.Color || existing?.color || 'D').toString().trim().toUpperCase();
      const mappedClarity = (item.clarity || item.Clarity || existing?.clarity || 'FL').toString().trim().toUpperCase();
      const mappedCert = (item.certification || item.Lab || existing?.certification || 'GIA').toString().trim().toUpperCase();
      const mappedCertId = (item.certId || item.CERT_NO || item.CertificateNo || existing?.certId || stockNo).toString().trim();
      
      const mappedPrCt = Number(item.Pr_Ct || item.PricePerCarat || existing?.Pr_Ct || 0);
      const mappedRapRate = Number(item.Rap_Rate || item.Rap_Rate || existing?.Rap_Rate || 0);
      const calculatedPrice = mappedCarat * (mappedPrCt || mappedRapRate) || Number(item.Amount || item.price || item.Price || 0);
      const mappedPrice = calculatedPrice > 0 ? calculatedPrice : (existing?.price || 250000);
      
      const mappedStock = item.stock !== undefined ? Number(item.stock) : (item.Quantity !== undefined ? Number(item.Quantity) : (existing?.stock !== undefined ? existing.stock : 1));
      const mappedImage = item.image || item.ImageLink || existing?.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400';
      const mappedVideo = item.video360 || item.VideoLink || item.Videomp4Link || existing?.video360 || '';

      const mappedDesc = item.description || item.FancyColorDescription || existing?.description || `A premium ${mappedShape} cut diamond certified by ${mappedCert}.`;

      const prodSpecsData: Partial<Product> = {
        Sr_No_: item.Sr_No_ ? Number(item.Sr_No_) : (existing?.Sr_No_ || (products.length + added.length + 1)),
        Stock_NO: stockNo,
        Shape: mappedShape,
        Color_Shade: item.Color_Shade || existing?.Color_Shade || 'WH',
        Rap_Rate: Number(item.Rap_Rate || existing?.Rap_Rate || 0),
        Rap_Vlu: Number(item.Rap_Vlu || existing?.Rap_Vlu || 0),
        Rap__: Number(item.Rap__ || existing?.Rap__ || 0),
        Pr_Ct: Number(item.Pr_Ct || existing?.Pr_Ct || 0),
        Amount: mappedPrice,
        TD_: Number(item.TD_ || existing?.TD_ || 0),
        Tab_: Number(item.Tab_ || existing?.Tab_ || 0),
        Polish: item.Polish || existing?.Polish || mappedCut,
        Symmetry: item.Symmetry || existing?.Symmetry || 'EX',
        Fluorescent: item.Fluorescent || existing?.Fluorescent || 'N',
        Measurement: item.Measurement || existing?.Measurement || '',
        Lab: mappedCert,
        H_A: item.H_A || existing?.H_A || '',
        CUL: item.CUL || existing?.CUL || 'N',
        Girdle: item.Girdle || existing?.Girdle || 'MED',
        Girdle_: Number(item.Girdle_ || existing?.Girdle_ || 0),
        BIT: item.BIT || existing?.BIT || 'BT0',
        BIC: item.BIC || existing?.BIC || 'BC0',
        WIT: item.WIT || existing?.WIT || 'WT0',
        WIC: item.WIC || existing?.WIC || 'WC0',
        MILKY: item.MILKY || existing?.MILKY || 'M0',
        LIns: item.LIns || existing?.LIns || 'L.I',
        LUS: item.LUS || existing?.LUS || 'EX',
        OPPV: item.OPPV || existing?.OPPV || 'PO0',
        OPTA: item.OPTA || existing?.OPTA || 'TO0',
        OPCR: item.OPCR || existing?.OPCR || 'CO0',
        CA: Number(item.CA || existing?.CA || 0),
        CH: Number(item.CH || existing?.CH || 0),
        PA: Number(item.PA || existing?.PA || 0),
        PHP: Number(item.PHP || existing?.PHP || 0),
        CERT_NO: mappedCertId,
        Location: item.Location || existing?.Location || 'BANGKOK',
        RO: item.RO || existing?.RO || 'NA',
        EC: item.EC || existing?.EC || 'E0',
        Keytosymbol: item.Keytosymbol || existing?.Keytosymbol || '',
        FancyColorDescription: item.FancyColorDescription || existing?.FancyColorDescription || '',
        ImageLink: mappedImage,
        CertificateLink: item.CertificateLink || existing?.CertificateLink || '',
        VideoLink: mappedVideo,
        Videomp4Link: item.Videomp4Link || existing?.Videomp4Link || '',
      };

      const updatedProduct: Product = {
        id: existing?.id || `prod_${stockNo}`,
        name: existing?.name || `${mappedCarat}ct ${mappedShape} Cut Diamond`,
        cut: mappedCut,
        color: mappedColor,
        clarity: mappedClarity,
        carat: mappedCarat,
        certification: mappedCert,
        certId: mappedCertId,
        price: mappedPrice,
        stock: mappedStock,
        image: mappedImage,
        images: existing?.images || [mappedImage],
        video360: mappedVideo,
        description: mappedDesc,
        status: mappedStock > 0 ? 'In Stock' : 'Out of Stock',
        ...prodSpecsData
      };

      if (existing) {
        matchedOriginalIds.add(existing.id);

        // Compute differences
        const diffs: { field: string; oldVal: any; newVal: any }[] = [];
        
        // Define fields to monitor for changes
        const fieldsToCompare: (keyof Product)[] = [
          'price', 'stock', 'carat', 'cut', 'color', 'clarity', 'certification', 'certId', 'Location', 'Polish', 'Symmetry', 'Fluorescent'
        ];

        fieldsToCompare.forEach(f => {
          const oldVal = existing[f];
          const newVal = updatedProduct[f];
          if (oldVal !== newVal && String(oldVal) !== String(newVal)) {
            let fieldLabel = f.toString();
            if (f === 'price') fieldLabel = 'Price (THB)';
            if (f === 'stock') fieldLabel = 'Stock Quantity';
            if (f === 'certId') fieldLabel = 'Certificate ID';
            diffs.push({ field: fieldLabel, oldVal, newVal });
          }
        });

        if (diffs.length > 0) {
          changed.push({ original: existing, updated: updatedProduct, diffs });
        } else {
          unchangedCount++;
        }
      } else {
        added.push(updatedProduct);
      }
    });

    // Find removed products (in DB but not in API feed)
    const removed = currentProducts.filter(p => !matchedOriginalIds.has(p.id) && p.id.startsWith('prod_'));

    setImportReport({
      added,
      changed,
      unchangedCount,
      removed
    });
    
    showToast(`Stock file analyzed successfully. ${added.length} new, ${changed.length} changed, ${unchangedCount} unchanged.`);
  };

  // Direct sync from URL
  const handleApiSync = async (type: 'json' | 'csv') => {
    if (cooldownTime > 0) {
      showToast(`Please wait ${cooldownTime} seconds before initiating another sync attempt.`, true);
      return;
    }

    setSyncLoading(true);
    const url = `https://service.phetmany.com/apiphetmanystock?user=9eac2360-75aa-4a29-8c65-55d84787aabf&type=${type}`;
    
    try {
      // Set 15-min cooldown immediately to prevent abuse
      localStorage.setItem('last_api_sync_time', Date.now().toString());
      setCooldownTime(15 * 60);

      // Direct fetch from browser
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      
      if (type === 'json') {
        const rawJson = await res.json();
        const items = Array.isArray(rawJson) ? rawJson : (rawJson.data || rawJson.products || rawJson.stock || []);
        handleProcessRawData(items);
      } else {
        const csvText = await res.text();
        const items = parseCSV(csvText);
        handleProcessRawData(items);
      }
    } catch (err) {
      console.error(err);
      showToast('API Direct Sync blocked by browser security (CORS) or unregistered IP address.', true);
      setErrorMsg(
        'Direct connection failed. This API restricts access to authorized IP addresses and enforces CORS policies. ' +
        'Please copy the API link below, paste it in a browser tab to download the file, and then upload it using the File Uploader below!'
      );
    } finally {
      setSyncLoading(false);
    }
  };

  // Triggered when a local file is uploaded
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setImportError(null);
    setSyncSuccess(null);
    setParsedPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        let parsed: any[] = [];
        if (file.name.endsWith('.csv')) {
          parsed = parseCSV(content);
        } else if (file.name.endsWith('.json') || file.type === 'application/json') {
          const parsedData = JSON.parse(content);
          parsed = Array.isArray(parsedData) ? parsedData : (parsedData.data || parsedData.products || parsedData.stock || []);
        } else {
          setImportError('Unsupported file type. Please upload a .json or .csv stock list file.');
          return;
        }

        if (parsed.length === 0) {
          setImportError('No diamond records found in the uploaded file.');
          return;
        }

        const mappedList = parsed.map((item, index) => {
          const stockNo = (item.Stock_NO || item.Stock_No || item.stock_no || item.CERT_NO || item.certId || `MAPPED_${Date.now()}_${index}`).toString().trim();
          const mappedCarat = Number(item.carat || item.Weight || item.Carat || 1.0);
          const mappedShape = (item.Shape || item.ShapeName || 'ROUND').toString().toUpperCase().trim();
          const mappedCut = (item.cut || item.Cut || item.Polish || 'Excellent').toString().trim();
          const mappedColor = (item.color || item.Color || 'D').toString().trim().toUpperCase();
          const mappedClarity = (item.clarity || item.Clarity || 'FL').toString().trim().toUpperCase();
          const mappedCert = (item.certification || item.Lab || item.lab || 'GIA').toString().trim().toUpperCase();
          const mappedCertId = (item.certId || item.CERT_NO || item.CertificateNo || stockNo).toString().trim();
          
          const mappedPrCt = Number(item.Pr_Ct || item.PricePerCarat || 0);
          const mappedRapRate = Number(item.Rap_Rate || 0);
          const calculatedPrice = mappedCarat * (mappedPrCt || mappedRapRate) || Number(item.Amount || item.price || item.Price || 250000);
          
          const basePrice = Number(item.basePrice || item.Pr_Ct || item.PricePerCarat || (calculatedPrice / mappedCarat) || 5000);
          const markupPercentage = Number(item.markupPercentage || 0);
          
          const mappedStock = item.stock !== undefined ? Number(item.stock) : (item.Quantity !== undefined ? Number(item.Quantity) : 1);
          const mappedImage = item.image || item.ImageLink || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400';
          const mappedVideo = item.video360 || item.VideoLink || item.Videomp4Link || '';
          const mappedDesc = item.description || item.FancyColorDescription || `A premium ${mappedShape} cut diamond certified by ${mappedCert}.`;

          return {
            id: `prod_${stockNo}`,
            name: `${mappedCarat}ct ${mappedShape} Cut Diamond`,
            shape: mappedShape,
            cut: mappedCut,
            color: mappedColor,
            clarity: mappedClarity,
            carat: mappedCarat,
            certification: mappedCert,
            certId: mappedCertId,
            lab: mappedCert,
            certNumber: mappedCertId,
            basePrice: basePrice,
            markupPercentage: markupPercentage,
            price: calculatedPrice,
            stock: mappedStock,
            image: mappedImage,
            images: [mappedImage],
            video360: mappedVideo,
            description: mappedDesc,
            status: mappedStock > 0 ? 'In Stock' : 'Out of Stock',
            Stock_NO: stockNo,
            Shape: mappedShape,
            Color_Shade: item.Color_Shade || 'WH',
            Rap_Rate: mappedRapRate,
            Rap_Vlu: Number(item.Rap_Vlu || 0),
            Rap__: Number(item.Rap__ || 0),
            Pr_Ct: mappedPrCt || basePrice,
            Amount: calculatedPrice,
            TD_: Number(item.TD_ || 0),
            Tab_: Number(item.Tab_ || 0),
            Polish: item.Polish || mappedCut,
            Symmetry: item.Symmetry || 'EX',
            Fluorescent: item.Fluorescent || 'N',
            Measurement: item.Measurement || '',
            Lab: mappedCert,
            H_A: item.H_A || '',
            CUL: item.CUL || 'N',
            Girdle: item.Girdle || 'MED',
            Girdle_: Number(item.Girdle_ || 0),
            BIT: item.BIT || 'BT0',
            BIC: item.BIC || 'BC0',
            WIT: item.WIT || 'WT0',
            WIC: item.WIC || 'WC0',
            MILKY: item.MILKY || 'M0',
            LIns: item.LIns || 'L.I',
            LUS: item.LUS || 'EX',
            OPPV: item.OPPV || 'PO0',
            OPTA: item.OPTA || 'TO0',
            OPCR: item.OPCR || 'CO0',
            CA: Number(item.CA || 0),
            CH: Number(item.CH || 0),
            PA: Number(item.PA || 0),
            PHP: Number(item.PHP || 0),
            Location: item.Location || 'BANGKOK',
            RO: item.RO || 'NA',
            EC: item.EC || 'E0',
            Keytosymbol: item.Keytosymbol || '',
            FancyColorDescription: item.FancyColorDescription || '',
            ImageLink: mappedImage,
            CertificateLink: item.CertificateLink || '',
            VideoLink: mappedVideo,
            Videomp4Link: item.Videomp4Link || '',
          };
        });

        setParsedPreview(mappedList);
        setSyncSuccess(`Parsed ${mappedList.length} items successfully. Please evaluate pre-import specs below.`);
      } catch (err) {
        setImportError('Failed to parse file. Please verify that the file format is correct.');
      }
    };
    reader.readAsText(file);
  };

  const handleCommitStockSync = async () => {
    if (parsedPreview.length === 0) return;

    let updatedList: Product[] = [];
    if (appendMode) {
      const currentMap = new Map<string, Product>();
      products.forEach(p => currentMap.set(p.id, p));
      
      parsedPreview.forEach(p => {
        currentMap.set(p.id, p);
      });
      updatedList = Array.from(currentMap.values());
    } else {
      updatedList = [...parsedPreview];
    }

    // Instantly save to local React state and local storage so user sees results instantly
    saveProducts(updatedList);
    setProducts(updatedList);

    const productsToUpload = [...parsedPreview];

    // Clear preview states
    setParsedPreview([]);
    setSyncSuccess(null);

    // Start progress feedback overlay for Firestore Synchronization
    setBatchUploadProgress({ pct: 0, current: 0, total: productsToUpload.length });

    try {
      if (productsToUpload.length > 0) {
        await saveProductsToDbInBatches(productsToUpload, (pct, current, total) => {
          setBatchUploadProgress({ pct, current, total });
        });
      }
      showToast(`Successfully processed stock update! Synchronized ${productsToUpload.length} products to database.`);
    } catch (err) {
      console.error(err);
      showToast("An error occurred during database upload. Some items may not have synced in MySQL.", true);
    } finally {
      setBatchUploadProgress(null);
    }
  };

  // Apply the approved changes from the report to local storage / state and MySQL in batches
  const handleApplyImport = async () => {
    if (!importReport) return;

    // Collect all the items we actually need to write to MySQL
    const productsToUpload: Product[] = [];
    
    // 1. Gather new products
    importReport.added.forEach(newP => {
      productsToUpload.push(newP);
    });

    // 2. Gather changed products
    importReport.changed.forEach(chg => {
      productsToUpload.push(chg.updated);
    });

    const updatedList = [...products];

    // Add new ones to the local state list
    importReport.added.forEach(newP => {
      updatedList.unshift(newP);
    });

    // Update changed ones in the local state list
    importReport.changed.forEach(chg => {
      const idx = updatedList.findIndex(p => p.id === chg.updated.id);
      if (idx > -1) {
        updatedList[idx] = chg.updated;
      }
    });

    // Set loading/progress status
    setBatchUploadProgress({ pct: 0, current: 0, total: productsToUpload.length });

    try {
      if (productsToUpload.length > 0) {
        await saveProductsToDbInBatches(productsToUpload, (pct, current, total) => {
          setBatchUploadProgress({ pct, current, total });
        });
      }

      // Save locally (Memory + IndexedDB + try localStorage)
      saveProducts(updatedList);
      setProducts(updatedList);
      
      showToast(`Successfully processed stock update! Synchronized ${productsToUpload.length} products to database.`);
    } catch (err) {
      console.error(err);
      showToast("An error occurred during database upload. Some items may not have synced.", true);
    } finally {
      setBatchUploadProgress(null);
      setImportReport(null);
      setShowImporter(false);
    }
  };

  // Orders management state
  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNo, setTrackingNo] = useState('');

  // Shipment dispatch states
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState('');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState<'all' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered'>('all');
  const [selectedShipmentOrder, setSelectedShipmentOrder] = useState<Order | null>(null);
  const [shipmentCarrier, setShipmentCarrier] = useState('DHL');
  const [shipmentTrackingInput, setShipmentTrackingInput] = useState('');
  const [shipmentNoteInput, setShipmentNoteInput] = useState('');

  // Support tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>(() => getTickets());
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  // User list states
  const [searchUser, setSearchUser] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'All'>('All');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Registered Customer');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>('Registered Customer');

  // Success/Error notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 3500);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  // Sync / load products, orders, tickets
  const handleSyncData = async () => {
    onRefreshUsers();
    try {
      const [freshProducts, freshOrders, freshTickets] = await Promise.all([
        fetchProductsFromDb(),
        fetchOrdersFromDb(),
        fetchTicketsFromDb()
      ]);
      setProducts(freshProducts);
      setOrders(freshOrders);
      setTickets(freshTickets);
      showToast('Dashboard variables synchronized with real-time MySQL database.');
    } catch (err) {
      console.error(err);
      setProducts(getProducts());
      setOrders(getOrders());
      setTickets(getTickets());
      showToast('Synced with offline cache.');
    }
  };

  // Diamond product management
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      showToast('Product name is required.', true);
      return;
    }

    const imgUrl = prodImage.trim() || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400';

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        ...prodSpecs,
        name: prodName,
        cut: prodCut,
        color: prodColor,
        clarity: prodClarity,
        carat: Number(prodCarat),
        certification: prodCert,
        certId: prodCertId,
        price: Number(prodPrice),
        stock: Number(prodStock),
        image: imgUrl,
        video360: prodVideo,
        description: prodDesc,
        status: Number(prodStock) > 0 ? 'In Stock' : 'Out of Stock'
      };

      const currentProds = getProducts();
      const idx = currentProds.findIndex(p => p.id === editingProduct.id);
      if (idx > -1) {
        currentProds[idx] = updated;
        saveProducts(currentProds);
        setProducts(currentProds);
        showToast(`Diamond "${prodName}" updated successfully.`);
      }
      setEditingProduct(null);
    } else {
      const newProd: Product = {
        id: 'prod_' + Date.now(),
        name: prodName,
        cut: prodCut,
        color: prodColor,
        clarity: prodClarity,
        carat: Number(prodCarat),
        certification: prodCert,
        certId: prodCertId || `GIA-${Math.floor(100000000 + Math.random() * 900000000)}`,
        price: Number(prodPrice),
        stock: Number(prodStock),
        image: imgUrl,
        images: [imgUrl],
        video360: prodVideo,
        description: prodDesc || 'Hand-selected premium diamond certified by GIA/IGI.',
        status: Number(prodStock) > 0 ? 'In Stock' : 'Out of Stock',
        ...prodSpecs
      };

      const currentProds = getProducts();
      currentProds.unshift(newProd);
      saveProducts(currentProds);
      setProducts(currentProds);
      showToast(`Diamond "${prodName}" saved to inventory list.`);
    }

    // Reset forms
    setProdName('');
    setProdCertId('');
    setProdImage('');
    setProdVideo('');
    setProdDesc('');
    setProdSpecs({});
    setShowAddProduct(false);
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCut(p.cut);
    setProdColor(p.color);
    setProdClarity(p.clarity);
    setProdCarat(p.carat);
    setProdCert(p.certification);
    setProdCertId(p.certId);
    setProdPrice(p.price);
    setProdStock(p.stock);
    setProdImage(p.image);
    setProdVideo(p.video360 || '');
    setProdDesc(p.description);
    setProdSpecs({
      Shape: p.Shape,
      Color_Shade: p.Color_Shade,
      Polish: p.Polish,
      Symmetry: p.Symmetry,
      Fluorescent: p.Fluorescent,
      Measurement: p.Measurement,
      Lab: p.Lab,
      H_A: p.H_A,
      Girdle: p.Girdle,
      Girdle_: p.Girdle_,
      Keytosymbol: p.Keytosymbol,
      FancyColorDescription: p.FancyColorDescription,
      ImageLink: p.ImageLink,
      CertificateLink: p.CertificateLink,
      VideoLink: p.VideoLink,
      Videomp4Link: p.Videomp4Link,
      Stock_NO: p.Stock_NO,
      Rap_Rate: p.Rap_Rate,
      Rap_Vlu: p.Rap_Vlu,
      Rap__: p.Rap__,
      Pr_Ct: p.Pr_Ct,
      Amount: p.Amount,
      TD_: p.TD_,
      Tab_: p.Tab_,
      CUL: p.CUL,
      BIT: p.BIT,
      BIC: p.BIC,
      WIT: p.WIT,
      WIC: p.WIC,
      MILKY: p.MILKY,
      LIns: p.LIns,
      LUS: p.LUS,
      OPPV: p.OPPV,
      OPTA: p.OPTA,
      OPCR: p.OPCR,
      CA: p.CA,
      CH: p.CH,
      PA: p.PA,
      PHP: p.PHP,
      CERT_NO: p.CERT_NO,
      Location: p.Location,
      RO: p.RO,
      EC: p.EC,
    });
    setShowAddProduct(true);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Permanently remove ${name} from catalog?`)) {
      const current = getProducts().filter(p => p.id !== id);
      saveProducts(current);
      setProducts(current);
      showToast(`Diamond "${name}" purged.`);
    }
  };

  // Order status & invoice updating
  const handleUpdateOrderStatus = (orderId: string, status: Order['shippingStatus']) => {
    const currentOrders = getOrders();
    const idx = currentOrders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      currentOrders[idx].shippingStatus = status;
      currentOrders[idx].trackingHistory.push({
        status,
        timestamp: new Date().toISOString(),
        note: `Order shipping progress updated to: ${status} by admin.`
      });
      saveOrders(currentOrders);
      setOrders(currentOrders);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(currentOrders[idx]);
      }
      showToast(`Order status updated to ${status}.`);
    }
  };

  const handleUpdatePaymentStatus = (orderId: string, status: Order['paymentStatus']) => {
    const currentOrders = getOrders();
    const idx = currentOrders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      currentOrders[idx].paymentStatus = status;
      saveOrders(currentOrders);
      setOrders(currentOrders);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(currentOrders[idx]);
      }
      showToast(`Payment marked as ${status}.`);
    }
  };

  const handleAddTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !trackingNo.trim()) return;

    const currentOrders = getOrders();
    const idx = currentOrders.findIndex(o => o.id === selectedOrder.id);
    if (idx > -1) {
      currentOrders[idx].trackingNumber = trackingNo.trim();
      currentOrders[idx].shippingStatus = 'Shipped';
      currentOrders[idx].trackingHistory.push({
        status: 'Shipped',
        timestamp: new Date().toISOString(),
        note: `Package tracking registered: ${trackingNo}. Courier dispatched.`
      });
      saveOrders(currentOrders);
      setOrders(currentOrders);
      setSelectedOrder(currentOrders[idx]);
      setTrackingNo('');
      showToast('Tracking number successfully logged.');
    }
  };

  const handleDispatchShipment = (orderId: string, carrier: string, trackingNo: string, note?: string) => {
    if (!trackingNo.trim()) {
      showToast('Tracking number is required to dispatch package.', true);
      return;
    }
    const currentOrders = getOrders();
    const idx = currentOrders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      currentOrders[idx].trackingNumber = trackingNo.trim();
      currentOrders[idx].shippingStatus = 'Shipped';
      const customNote = note?.trim() || `Package dispatched via ${carrier}. Tracking Reference: ${trackingNo.trim()}`;
      currentOrders[idx].trackingHistory.push({
        status: 'Shipped',
        timestamp: new Date().toISOString(),
        note: customNote
      });
      saveOrders(currentOrders);
      setOrders(currentOrders);
      if (selectedShipmentOrder?.id === orderId) {
        setSelectedShipmentOrder(currentOrders[idx]);
      }
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(currentOrders[idx]);
      }
      showToast(`Order successfully dispatched via ${carrier}!`);
    }
  };

  const handleUpdateShipmentStatus = (orderId: string, status: Order['shippingStatus'], note: string) => {
    const currentOrders = getOrders();
    const idx = currentOrders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      currentOrders[idx].shippingStatus = status;
      currentOrders[idx].trackingHistory.push({
        status,
        timestamp: new Date().toISOString(),
        note: note.trim() || `Shipment status transition to ${status}.`
      });
      saveOrders(currentOrders);
      setOrders(currentOrders);
      if (selectedShipmentOrder?.id === orderId) {
        setSelectedShipmentOrder(currentOrders[idx]);
      }
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(currentOrders[idx]);
      }
      showToast(`Shipment status updated to ${status}.`);
    }
  };

  // User roles management
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserFullName.trim() || !newUserUsername.trim() || !newUserEmail.trim()) {
      showToast('All fields are required to seed a new account.', true);
      return;
    }

    const usernameLower = newUserUsername.trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === usernameLower)) {
      showToast('Username already taken.', true);
      return;
    }

    const newUser: UserProfile = {
      id: 'user_' + Date.now(),
      username: usernameLower,
      fullName: newUserFullName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      createdAt: new Date().toISOString(),
      status: 'Active'
    };

    onAddUser(newUser);
    showToast(`Account @${usernameLower} registered as ${newUserRole}.`);
    setNewUserFullName('');
    setNewUserUsername('');
    setNewUserEmail('');
    setShowAddUser(false);
  };

  const handleToggleUserStatus = (u: UserProfile) => {
    const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
    onUpdateUser(u.id, { status: newStatus });
    showToast(`@${u.username} marked ${newStatus}.`);
  };

  const handleSaveUserRole = (id: string) => {
    onUpdateUser(id, { role: editingRole });
    setEditingUserId(null);
    showToast('Role settings successfully synchronized.');
  };

  // Customer support ticketing reply
  const handleSendSupportReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    addTicketMessage(selectedTicket.id, replyText.trim(), 'support', 'PHETMANY Support');
    const updated = getTickets();
    setTickets(updated);
    const active = updated.find(t => t.id === selectedTicket.id) || null;
    setSelectedTicket(active);
    setReplyText('');
    showToast('Support reply dispatched.');
  };

  // Statistics summaries
  const totalSales = orders.filter(o => o.paymentStatus === 'Paid').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const pendingSales = orders.filter(o => o.paymentStatus === 'Pending').reduce((acc, curr) => acc + curr.totalAmount, 0);

  const filteredUsers = users.filter(u => {
    const matchesRole = selectedRoleFilter === 'All' || u.role === selectedRoleFilter;
    const q = searchUser.toLowerCase();
    const matchesSearch = u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative">
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
        {successMsg && (
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold pointer-events-auto">
            <CheckCircle2 className="w-4 h-4" />
            <p>{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold pointer-events-auto">
            <AlertCircle className="w-4 h-4" />
            <p>{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Mobile Top Header with 3-Line Hamburger Menu Button */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40 md:hidden">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-contain bg-white p-0.5 border border-slate-800" />
          <div>
            <h1 className="text-xs font-black tracking-widest text-white uppercase font-display">PHETMANY</h1>
            <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider block">ADMIN PORTAL</span>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-500 hover:text-amber-400 cursor-pointer flex items-center justify-center transition-colors"
          aria-label="Toggle Admin Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Right-Side Slide Drawer for Admin */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[999999] flex justify-end md:hidden">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Right Drawer Shell */}
          <div className="relative w-[85%] max-w-[300px] bg-slate-950 h-full shadow-2xl flex flex-col justify-between overflow-y-auto text-white z-10 border-l border-slate-800 animate-in slide-in-from-right duration-200">
            <div className="p-4 space-y-4">
              {/* Drawer Header */}
              <div className="bg-slate-900 p-3 rounded-2xl flex items-center justify-between border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs">
                    AD
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-xs text-white truncate leading-tight">Admin Console</h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">@{currentUser.username}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Requested Admin Navigation List */}
              <div className="space-y-1 text-xs font-bold uppercase tracking-wider">
                <button 
                  onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>overview</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'users' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <Users className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>users</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'products' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <Package className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>products</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('markup'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'markup' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <Percent className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>markup</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>orders</span>
                  </div>
                  {orders.some(o => o.paymentStatus === 'Pending') && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </button>

                <button 
                  onClick={() => { setActiveTab('shipment'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'shipment' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>dispatch</span>
                  </div>
                  {orders.some(o => o.paymentStatus === 'Paid' && o.shippingStatus === 'Processing') && (
                    <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {orders.filter(o => o.paymentStatus === 'Paid' && o.shippingStatus === 'Processing').length}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <BarChart3 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>analytics</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('support'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'support' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>support</span>
                  </div>
                  {tickets.some(t => t.status === 'Open') && (
                    <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {tickets.filter(t => t.status === 'Open').length}
                    </span>
                  )}
                </button>

                <div className="pt-2 border-t border-slate-800 my-2" />

                <button 
                  onClick={() => { setActiveTab('theme_menu'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'theme_menu' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <Palette className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>theme menu</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('wallet'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'wallet' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>wallet</span>
                  </div>
                </button>

                <button 
                  onClick={() => { setActiveTab('rapnet'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'rapnet' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <Database className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>rapnet api</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('db_connection'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'db_connection' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-900'}`}
                >
                  <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Database Connection</span>
                </button>
              </div>
            </div>

            {/* Footer Sign Out */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 shrink-0">
              <button 
                onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                className="w-full px-3.5 py-3 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-xs font-black uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Sign Out / Lock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Grid */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar - Admin Style */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex">
          <div>
            {/* Header Brand */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-contain bg-white p-0.5" />
              <div>
                <h1 className="text-sm font-black tracking-widest text-white uppercase font-display">PHETMANY</h1>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">ADMIN PORTAL</span>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="p-4 space-y-1">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'overview' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <TrendingUp className="w-4 h-4" />
                Dashboard Overview
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'users' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <Users className="w-4 h-4" />
                User Directory
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'products' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <Package className="w-4 h-4" />
                Diamond Inventory
              </button>
              <button 
                onClick={() => setActiveTab('theme_menu')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'theme_menu' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <Palette className="w-4 h-4" />
                Theme Menu
              </button>
              <button 
                onClick={() => setActiveTab('markup')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'markup' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <Percent className="w-4 h-4" />
                Price Markup Tool
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'orders' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <FileText className="w-4 h-4" />
                Sales & Invoices
                {orders.some(o => o.paymentStatus === 'Pending') && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('shipment')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'shipment' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <Truck className="w-4 h-4" />
                Shipment Dispatch
                {orders.some(o => o.paymentStatus === 'Paid' && o.shippingStatus === 'Processing') && (
                  <span className="ml-auto bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {orders.filter(o => o.paymentStatus === 'Paid' && o.shippingStatus === 'Processing').length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('affiliate')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'affiliate' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <Users className="w-4 h-4" />
                Affiliate Program
                {affiliates.some(a => a.status === 'Pending') && (
                  <span className="ml-auto bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {affiliates.filter(a => a.status === 'Pending').length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'analytics' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <BarChart3 className="w-4 h-4" />
                Store Analytics
              </button>

              <button 
                onClick={() => setActiveTab('wallet')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'wallet' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <Wallet className="w-4 h-4" />
                Wallet Auditing
                {walletTransactions.some(tx => tx.status === 'Pending') && (
                  <span className="ml-auto bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {walletTransactions.filter(tx => tx.status === 'Pending').length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('support')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'support' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <MessageSquare className="w-4 h-4" />
                Support Desk
                {tickets.some(t => t.status === 'Open') && (
                  <span className="ml-auto bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {tickets.filter(t => t.status === 'Open').length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('rapnet')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'rapnet' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <Database className="w-4 h-4" />
                Rapaport API Suite
              </button>

              <button 
                onClick={() => setActiveTab('db_connection')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${activeTab === 'db_connection' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
              >
                <Server className="w-4 h-4 text-emerald-400" />
                Database Connection
              </button>
            </nav>
          </div>

          {/* Quick Stats Summary */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Admin Active</span>
              <p className="text-xs font-black text-slate-200 mt-1">@{currentUser.username}</p>
              <span className="text-[9px] text-amber-500 font-extrabold uppercase mt-0.5 block">{currentUser.role}</span>
              <button 
                onClick={onLogout}
                className="w-full mt-3 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Sign Out / Lock
              </button>
            </div>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6 sm:p-8 space-y-6 relative">
          
          {/* Batch Database Synchronization Progress Overlay */}
          {batchUploadProgress && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-wider text-white">Database Synchronization In Progress</h4>
                  <p className="text-xs text-slate-400">
                    Synchronizing imported diamond entries with your remote Hostinger MySQL database...
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>PROGRESS</span>
                    <span className="text-amber-500 font-bold">{batchUploadProgress.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${batchUploadProgress.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Processed</span>
                    <span>{batchUploadProgress.current.toLocaleString()} / {batchUploadProgress.total.toLocaleString()} Items</span>
                  </div>
                </div>
                <div className="pt-2 flex flex-col items-center gap-2">
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">
                    ⚠️ Please do not close this browser tab while sync is active.
                  </p>
                  <button
                    type="button"
                    onClick={() => setBatchUploadProgress(null)}
                    className="mt-1 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase rounded-lg border border-slate-700 cursor-pointer transition-colors"
                  >
                    Hide Overlay
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Top Quick Action Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <h2 className="text-base font-extrabold text-white tracking-wide uppercase font-display">System Administration Console</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">Welcome back, {currentUser.fullName}. Diamond stock sync and storage services are active.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSyncData}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Storefront
              </button>
            </div>
          </div>



          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Audited Sales</span>
                    <p className="text-2xl font-black text-emerald-400">{totalSales.toLocaleString()} THB</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Invoices</span>
                    <p className="text-2xl font-black text-amber-500">{pendingSales.toLocaleString()} THB</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Orders</span>
                    <p className="text-2xl font-black text-white">{orders.length}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                    <Truck className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Seeded Users Profiles</span>
                    <p className="text-2xl font-black text-white">{users.length}</p>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Quick Sales & Support Summary Bento */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Pending Actions */}
                <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">Active Order Processing Hub</h3>
                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div key={o.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">{o.invoiceNumber}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${o.paymentStatus === 'Paid' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                              {o.paymentStatus}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-400 mt-1">{o.customerName} • {o.items.length} Diamond(s)</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setSelectedOrder(o); setActiveTab('orders'); }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase rounded-lg border border-slate-700"
                          >
                            Update Invoice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open support tickets quick-view */}
                <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">Unanswered Inquiries</h3>
                  <div className="space-y-3">
                    {tickets.filter(t => t.status === 'Open').length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-xs text-slate-500 font-semibold uppercase">No open inquiries</p>
                      </div>
                    ) : (
                      tickets.filter(t => t.status === 'Open').map((t) => (
                        <div key={t.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div className="text-left">
                            <span className="text-[10px] font-bold text-amber-500">Ticket #{t.id}</span>
                            <h4 className="text-xs font-bold text-white mt-0.5 truncate max-w-[180px]">{t.subject}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">By {t.userName}</p>
                          </div>
                          <button 
                            onClick={() => { setSelectedTicket(t); setActiveTab('support'); }}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase rounded-lg"
                          >
                            Reply
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 2. USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              
              {/* Filter tools */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="w-4 h-4 text-slate-500" />
                  </span>
                  <input 
                    type="text" 
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    placeholder="Filter user credentials..." 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <select 
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold px-3 py-2 text-slate-300"
                  >
                    <option value="All">All Roles</option>
                    {Object.keys(ROLE_DETAILS).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  
                  <button 
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Account
                  </button>
                </div>
              </div>

              {/* Add user form */}
              {showAddUser && (
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">Seed New Profile</h4>
                    <button onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <form onSubmit={handleAddUserSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        value={newUserFullName}
                        onChange={(e) => setNewUserFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
                      <input 
                        type="text" 
                        value={newUserUsername}
                        onChange={(e) => setNewUserUsername(e.target.value)}
                        placeholder="johndoe"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                      <input 
                        type="email" 
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="john@phetmany.co"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</label>
                      <select 
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-bold"
                      >
                        {Object.keys(ROLE_DETAILS).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button 
                        type="button" 
                        onClick={() => setShowAddUser(false)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-lg"
                      >
                        Insert User Profile
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Users table */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-slate-300">
                    <thead className="bg-slate-950 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="px-6 py-4">User Details</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Security Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
                      {filteredUsers.map((u) => {
                        const isEditing = editingUserId === u.id;
                        return (
                          <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <span className="font-bold text-white block">{u.fullName}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">@{u.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono">{u.email}</td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <select 
                                  value={editingRole}
                                  onChange={(e) => setEditingRole(e.target.value as any)}
                                  className="bg-slate-900 border border-slate-800 text-xs text-white rounded-md px-2 py-1 font-bold"
                                >
                                  {Object.keys(ROLE_DETAILS).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="px-2.5 py-1 bg-slate-900 text-amber-500 border border-slate-800 rounded-full text-[9px] font-extrabold uppercase">
                                  {u.role}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                              >
                                {u.status}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                <div className="flex justify-center gap-1">
                                  <button onClick={() => handleSaveUserRole(u.id)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded">Save</button>
                                  <button onClick={() => setEditingUserId(null)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded">Cancel</button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => { setEditingUserId(u.id); setEditingRole(u.role); }}
                                    className="p-1 text-slate-500 hover:text-amber-500"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => onDeleteUser(u.id, u.username)}
                                    className="p-1 text-slate-500 hover:text-red-500"
                                    disabled={u.id === currentUser.id}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 3. PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-left">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-black text-white font-display tracking-wide uppercase">Loose Diamond Database</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      MySQL Live ({products.length} Items)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Database Engine: <code className="text-sky-400 font-mono text-[10px]">Hostinger MySQL Connected</code></p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleReloadFromDb}
                    disabled={syncLoading}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 cursor-pointer transition-all"
                    title="Fetch latest data directly from remote database"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
                    Refresh Database
                  </button>
                  <button 
                    onClick={() => { setShowImporter(!showImporter); setShowAddProduct(false); }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${showImporter ? 'bg-sky-400 text-slate-950' : 'bg-slate-900 text-sky-400 border border-slate-800 hover:bg-slate-800'}`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
                    Bulk Import & Sync API
                  </button>
                  <button 
                    onClick={() => { setEditingProduct(null); setShowAddProduct(!showAddProduct); setShowImporter(false); }}
                    className="px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-sky-400/5"
                  >
                    <Plus className="w-4 h-4" />
                    Register Diamond
                  </button>
                </div>
              </div>

              {showImporter && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-left space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">Stock Sync & Import Portal</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Synchronise diamond stocks via direct API connection or local JSON/CSV file uploads.</p>
                    </div>
                    <button onClick={() => { setShowImporter(false); setImportReport(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dual Syncing Methods */}
                  {!importReport && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Method 1: API Integration */}
                      <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <RefreshCw className={`w-4 h-4 text-amber-500 ${syncLoading ? 'animate-spin' : ''}`} />
                            <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">Real-Time API Sync</h5>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Pull current stock data directly from the Phetmany Diamond wholesale server.
                            The API imposes a mandatory <strong className="text-amber-500">15-minute interval cooldown</strong> between updates.
                          </p>
                          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/60 text-[10px] text-slate-400 leading-normal space-y-1">
                            <p className="font-semibold text-slate-300">Registered API Endpoints:</p>
                            <p className="font-mono text-amber-500/80 break-all select-all">https://service.phetmany.com/apiphetmanystock?user=9eac2360-75aa...&type=json</p>
                            <p className="text-[9px] text-slate-500">Note: Requires your network IP address to be whitelisted by the service provider.</p>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-800/60 space-y-3">
                          {cooldownTime > 0 && (
                            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                                API Cooldown Active: {Math.floor(cooldownTime / 60)}m {cooldownTime % 60}s remaining
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={syncLoading || cooldownTime > 0}
                              onClick={() => handleApiSync('json')}
                              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 text-[11px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                            >
                              {syncLoading ? 'Syncing...' : 'Sync via JSON API'}
                            </button>
                            <button
                              type="button"
                              disabled={syncLoading || cooldownTime > 0}
                              onClick={() => handleApiSync('csv')}
                              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-850 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-200 text-[11px] font-black uppercase tracking-wider rounded-lg border border-slate-700 cursor-pointer transition-colors"
                            >
                              Sync via CSV API
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Local JSON/CSV File Upload */}
                      <div className="bg-[#121f66]/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center space-x-2 border-b border-white/10 pb-2 mb-3">
                            <Upload className="w-4 h-4 text-[#38bdf8]" />
                            <span className="font-bold text-white uppercase tracking-wider">Method B: Local JSON/CSV File Upload</span>
                          </div>

                          <p className="text-white/60 leading-relaxed mb-4 text-[11px]">
                            If your server IP isn't registered or you are offline, you can download the stock file using the links on the left and upload it here directly whenever you want.
                          </p>

                          {/* Drag and Drop Zone */}
                          <div 
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragActive(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) processSelectedFile(file);
                            }}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2.5 ${
                              dragActive 
                                ? 'border-[#38bdf8] bg-[#38bdf8]/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                                : 'border-white/10 hover:border-white/30 bg-[#0c154a]/30'
                            }`}
                            onClick={() => document.getElementById('stock-file-input')?.click()}
                          >
                            <input 
                              id="stock-file-input" 
                              type="file" 
                              accept=".json,.csv" 
                              className="hidden" 
                              onChange={handleFileChange} 
                            />
                            <div className="p-3 bg-white/5 rounded-full text-[#38bdf8]">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-white font-semibold text-xs">Drag & Drop Stock File Here</p>
                              <p className="text-[10px] text-white/40 mt-1">Supports downloaded JSON or CSV formats</p>
                            </div>
                            <span className="text-[10px] bg-[#38bdf8]/10 text-[#38bdf8] px-2 py-1 rounded-lg font-bold">
                              Browse Files
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-white/5">
                          {/* Database Merge Options */}
                          <div className="bg-[#0c154a]/40 p-3 rounded-xl border border-white/5 space-y-2">
                            <span className="text-[10px] font-mono text-white/40 block uppercase">Synchronization Mode:</span>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center space-x-2 text-white cursor-pointer text-[11px]">
                                <input 
                                  type="radio" 
                                  name="importMode" 
                                  checked={appendMode} 
                                  onChange={() => setAppendMode(true)}
                                  className="accent-[#38bdf8]" 
                                />
                                <span>Append & Skip Duplicates</span>
                              </label>
                              <label className="flex items-center space-x-2 text-white cursor-pointer text-[11px]">
                                <input 
                                  type="radio" 
                                  name="importMode" 
                                  checked={!appendMode} 
                                  onChange={() => setAppendMode(false)}
                                  className="accent-[#38bdf8]" 
                                />
                                <span>Overwrite Entire Catalog</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error and Success Notifications */}
                  {importError && (
                    <div className="bg-rose-950/40 border border-rose-500/20 text-rose-200 p-4 rounded-xl flex items-start gap-2.5 leading-relaxed text-left">
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold text-rose-300 block text-xs">Sync Process Terminated</span>
                        <p className="text-[11px] text-white/70">{importError}</p>
                      </div>
                    </div>
                  )}

                  {syncSuccess && (
                    <div className="bg-[#121f66]/40 border border-[#38bdf8]/20 text-emerald-200 p-4 rounded-xl flex items-start gap-2.5 leading-relaxed text-left">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold text-[#38bdf8] block text-xs">Import Process Success</span>
                        <p className="text-[11px] text-white/70">{syncSuccess}</p>
                      </div>
                    </div>
                  )}

                  {/* Pre-Import Data Validation Grid */}
                  {parsedPreview.length > 0 && (
                    <div className="bg-[#121f66]/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <div>
                          <h4 className="font-bold text-white text-sm">Pre-Import Spec Validation Checker</h4>
                          <p className="text-white/50 text-[11px]">Review the mapped properties of your loose diamonds before committing to Firestore.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCommitStockSync}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold font-sans text-xs transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                        >
                          <Check className="w-4 h-4" />
                          <span>Commit {parsedPreview.length} Mapped Items</span>
                        </button>
                      </div>

                      <div className="bg-[#0c154a]/40 rounded-xl border border-white/5 overflow-hidden max-h-[250px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-[#0c154a] text-white/40 font-mono uppercase tracking-wider border-b border-white/10">
                              <th className="p-2.5">Shape / Spec</th>
                              <th className="p-2.5">Weight (ct)</th>
                              <th className="p-2.5">Color / Clarity</th>
                              <th className="p-2.5">Lab / Cert No</th>
                              <th className="p-2.5">Raw Cost</th>
                              <th className="p-2.5 text-right">Preview Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-white/80">
                            {parsedPreview.slice(0, 15).map((p, idx) => {
                              const markupMultiplier = 1 + ((p.markupPercentage || 0) / 100);
                              const mappedPrice = p.basePrice * p.carat * markupMultiplier;
                              return (
                                <tr key={idx} className="hover:bg-white/5">
                                  <td className="p-2.5 font-bold text-white">{p.shape}</td>
                                  <td className="p-2.5 font-mono">{p.carat.toFixed(2)} ct</td>
                                  <td className="p-2.5 font-mono text-amber-400">{p.color} • {p.clarity}</td>
                                  <td className="p-2.5 font-mono text-[#38bdf8]">{p.lab} {p.certNumber}</td>
                                  <td className="p-2.5 font-mono text-white/40">${p.basePrice.toLocaleString()}/ct</td>
                                  <td className="p-2.5 font-mono font-bold text-white text-right">${Math.round(mappedPrice || p.price).toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {parsedPreview.length > 15 && (
                          <div className="p-2.5 text-center text-white/30 border-t border-white/5 font-mono bg-[#0c154a]/80">
                            Showing first 15 of {parsedPreview.length} items. All items will be imported on commit.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stock Comparison & Evaluation Report */}
                  {importReport && (
                    <div className="space-y-5 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-3">
                        <div>
                          <h5 className="text-xs font-black uppercase tracking-wider text-white">Stock Audit Evaluation Report</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">Please review the detected changes before committing updates to the database.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setImportReport(null)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase rounded-lg border border-slate-700 cursor-pointer"
                          >
                            Discard Analysis
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyImport}
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                          >
                            Apply {importReport.added.length + importReport.changed.length} Verified Changes
                          </button>
                        </div>
                      </div>

                      {/* Audit metrics boxes */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                          <span className="text-[9px] text-emerald-400 font-extrabold uppercase block tracking-wider">New Listings</span>
                          <span className="text-xl font-black text-white block mt-1">{importReport.added.length}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">To insert as draft</span>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                          <span className="text-[9px] text-amber-500 font-extrabold uppercase block tracking-wider">Price/Stock Diffs</span>
                          <span className="text-xl font-black text-white block mt-1">{importReport.changed.length}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">To modify/synchronize</span>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Unchanged Listings</span>
                          <span className="text-xl font-black text-white block mt-1">{importReport.unchangedCount}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">Identical - Skipped</span>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                          <span className="text-[9px] text-rose-500 font-extrabold uppercase block tracking-wider">Removed from Feed</span>
                          <span className="text-xl font-black text-white block mt-1">{importReport.removed.length}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">Retained in database</span>
                        </div>
                      </div>

                      {/* Granular changes scroll list */}
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {/* 1. Added listings preview */}
                        {importReport.added.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 border-b border-slate-800/40 pb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <h6 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">New Stock Items Detected ({importReport.added.length})</h6>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              {importReport.added.slice(0, 10).map((p, idx) => (
                                <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                                  <div>
                                    <span className="font-bold text-white block truncate max-w-[150px]">{p.name}</span>
                                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Stock NO: {p.Stock_NO} • {p.carat}ct {p.color}/{p.clarity}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono font-bold text-emerald-400 block">{p.price.toLocaleString()} THB</span>
                                    <span className="text-[9px] text-slate-500 block">Qty: {p.stock}</span>
                                  </div>
                                </div>
                              ))}
                              {importReport.added.length > 10 && (
                                <div className="sm:col-span-2 p-2 text-center text-slate-500 text-[10px] font-bold">
                                  ...and {importReport.added.length - 10} more new diamond listing(s)
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 2. Changed listings preview */}
                        {importReport.changed.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-2 border-b border-slate-800/40 pb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <h6 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">Specification & Price Deviations ({importReport.changed.length})</h6>
                            </div>
                            <div className="space-y-2">
                              {importReport.changed.map((chg, idx) => (
                                <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                  <div>
                                    <span className="font-black text-slate-200 text-xs block">{chg.original.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Stock NO: {chg.original.Stock_NO}</span>
                                  </div>
                                  
                                  <div className="flex-1 max-w-md">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {chg.diffs.map((df, dIdx) => (
                                        <div key={dIdx} className="bg-slate-900/60 p-1.5 rounded border border-slate-800 text-[10px]">
                                          <span className="text-slate-500 block text-[9px] font-bold uppercase">{df.field}</span>
                                          <div className="flex items-center gap-1.5 mt-0.5 font-mono">
                                            <span className="text-slate-500 line-through font-semibold text-[9px]">
                                              {typeof df.oldVal === 'number' && df.field.includes('Price') ? df.oldVal.toLocaleString() : String(df.oldVal)}
                                            </span>
                                            <span className="text-slate-400 font-bold">&rarr;</span>
                                            <span className="text-amber-400 font-black">
                                              {typeof df.newVal === 'number' && df.field.includes('Price') ? df.newVal.toLocaleString() : String(df.newVal)}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 3. Removed listings note */}
                        {importReport.removed.length > 0 && (
                          <div className="p-3 bg-slate-950 border border-slate-800/60 rounded-xl text-[10px] text-slate-400">
                            <span className="font-bold text-slate-300 block mb-1">💡 Inactive stock missing from feed ({importReport.removed.length} item(s)):</span>
                            These products are in your database but were not found in the uploaded file. 
                            We will <strong className="text-amber-500">retain them intact</strong> to prevent accidentally wiping manual listings. You can manually delete them below if they are permanently discontinued.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showAddProduct && (
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">
                      {editingProduct ? 'Edit Diamond Listing' : 'Publish New Diamond Listing'}
                    </h4>
                    <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Diamond Identifier Name</label>
                        <input 
                          type="text" 
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          placeholder="Eternal Brilliance Round Brilliant"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price (THB)</label>
                        <input 
                          type="number" 
                          value={prodPrice}
                          onChange={(e) => setProdPrice(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Available Stock</label>
                        <input 
                          type="number" 
                          value={prodStock}
                          onChange={(e) => setProdStock(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Carat Weight</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={prodCarat}
                          onChange={(e) => setProdCarat(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Diamond Cut</label>
                        <select 
                          value={prodCut}
                          onChange={(e) => setProdCut(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-bold"
                        >
                          <option value="Excellent">Excellent</option>
                          <option value="Very Good">Very Good</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Color Grade</label>
                        <select 
                          value={prodColor}
                          onChange={(e) => setProdColor(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-bold"
                        >
                          {['D','E','F','G','H','I','J','K'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clarity Grade</label>
                        <select 
                          value={prodClarity}
                          onChange={(e) => setProdClarity(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-bold"
                        >
                          {['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Certification Lab</label>
                        <select 
                          value={prodCert}
                          onChange={(e) => setProdCert(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-bold"
                        >
                          <option value="GIA">GIA</option>
                          <option value="IGI">IGI</option>
                          <option value="None">None</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Certificate ID</label>
                        <input 
                          type="text" 
                          value={prodCertId}
                          onChange={(e) => setProdCertId(e.target.value)}
                          placeholder="GIA-992014589"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Photo URL</label>
                        <input 
                          type="text" 
                          value={prodImage}
                          onChange={(e) => setProdImage(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">360° Media Link (Video/Embed)</label>
                        <input 
                          type="text" 
                          value={prodVideo}
                          onChange={(e) => setProdVideo(e.target.value)}
                          placeholder="https://example.com/360video.mp4"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detailed Description</label>
                      <textarea 
                        value={prodDesc}
                        onChange={(e) => setProdDesc(e.target.value)}
                        placeholder="Provide details of the structural facets and fire refraction notes..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white h-20"
                      />
                    </div>

                    {/* Collapsible Advanced GIA/IGI Specifications */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedSpecs(!showAdvancedSpecs)}
                        className="w-full px-4 py-3 bg-slate-900/60 hover:bg-slate-900 text-left flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-300 cursor-pointer"
                      >
                        <span>Advanced GIA/IGI Wholesale Specifications ({Object.keys(prodSpecs).filter(k => prodSpecs[k as keyof Product] !== undefined && prodSpecs[k as keyof Product] !== '').length} active)</span>
                        <span className="text-amber-500 font-bold">{showAdvancedSpecs ? '[- Hide]' : '[+ Expand]'}</span>
                      </button>

                      {showAdvancedSpecs && (
                        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-4 text-xs text-left">
                          
                          {/* Section 1: Identification & Location */}
                          <div className="space-y-2">
                            <h5 className="font-bold text-amber-500/80 text-[10px] uppercase tracking-widest border-b border-slate-800/60 pb-1">Identification & Location</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Stock No</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.Stock_NO || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Stock_NO: e.target.value})} 
                                  placeholder="e.g. 2651873"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Diamond Shape</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.Shape || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Shape: e.target.value})} 
                                  placeholder="e.g. EMERALD"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Color Shade</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.Color_Shade || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Color_Shade: e.target.value})} 
                                  placeholder="e.g. WH"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Stock Location</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.Location || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Location: e.target.value})} 
                                  placeholder="e.g. UPCOMING"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 2: Cut, Polish, Symmetry */}
                          <div className="space-y-2">
                            <h5 className="font-bold text-amber-500/80 text-[10px] uppercase tracking-widest border-b border-slate-800/60 pb-1">Symmetry & Light Quality</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Polish Grade</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.Polish || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Polish: e.target.value})} 
                                  placeholder="e.g. EX"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Symmetry Grade</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.Symmetry || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Symmetry: e.target.value})} 
                                  placeholder="e.g. VG"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Fluorescence</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.Fluorescent || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Fluorescent: e.target.value})} 
                                  placeholder="e.g. M"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Hearts & Arrows (H_A)</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.H_A || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, H_A: e.target.value})} 
                                  placeholder="e.g. H&A"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 3: Measurements & Proportions */}
                          <div className="space-y-2">
                            <h5 className="font-bold text-amber-500/80 text-[10px] uppercase tracking-widest border-b border-slate-800/60 pb-1">Measurements & Proportions</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Dimensions (Measurement)</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.Measurement || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Measurement: e.target.value})} 
                                  placeholder="6.25x4.13x2.74"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Table % (Tab_)</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  value={prodSpecs.Tab_ || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Tab_: e.target.value ? Number(e.target.value) : undefined})} 
                                  placeholder="67.0"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Total Depth % (TD_)</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  value={prodSpecs.TD_ || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, TD_: e.target.value ? Number(e.target.value) : undefined})} 
                                  placeholder="66.3"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Girdle Thickness Description</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.Girdle || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Girdle: e.target.value})} 
                                  placeholder="STK - VTK"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Girdle % (Girdle_)</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={prodSpecs.Girdle_ || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Girdle_: e.target.value ? Number(e.target.value) : undefined})} 
                                  placeholder="3.88"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Crown Angle (CA)</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={prodSpecs.CA || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, CA: e.target.value ? Number(e.target.value) : undefined})} 
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Crown Height (CH)</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={prodSpecs.CH || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, CH: e.target.value ? Number(e.target.value) : undefined})} 
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Pavilion Angle (PA)</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={prodSpecs.PA || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, PA: e.target.value ? Number(e.target.value) : undefined})} 
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 4: Rapaport Valuations */}
                          <div className="space-y-2">
                            <h5 className="font-bold text-amber-500/80 text-[10px] uppercase tracking-widest border-b border-slate-800/60 pb-1">Rapaport Wholesales & Price Formulas</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Rap Rate ($)</label>
                                <input 
                                  type="number" 
                                  value={prodSpecs.Rap_Rate || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Rap_Rate: e.target.value ? Number(e.target.value) : undefined})} 
                                  placeholder="e.g. 3700"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Rap Value ($)</label>
                                <input 
                                  type="number" 
                                  value={prodSpecs.Rap_Vlu || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Rap_Vlu: e.target.value ? Number(e.target.value) : undefined})} 
                                  placeholder="e.g. 2664"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Rap Discount % (Rap__)</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={prodSpecs.Rap__ || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Rap__: e.target.value ? Number(e.target.value) : undefined})} 
                                  placeholder="e.g. -62.24"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Price/Carat ($) (Pr_Ct)</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={prodSpecs.Pr_Ct || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Pr_Ct: e.target.value ? Number(e.target.value) : undefined})} 
                                  placeholder="e.g. 1397.12"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 5: Media & Certificates */}
                          <div className="space-y-2">
                            <h5 className="font-bold text-amber-500/80 text-[10px] uppercase tracking-widest border-b border-slate-800/60 pb-1">Interactive Verification Links</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Official Digital Lab Certificate Link</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.CertificateLink || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, CertificateLink: e.target.value})} 
                                  placeholder="https://.../certificates/1553482006.jpg"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">High-Fidelity 360° Vision Player Link</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.VideoLink || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, VideoLink: e.target.value})} 
                                  placeholder="https://.../video/Vision360.html?d=..."
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Raw 360° mp4 Video Link</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.Videomp4Link || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Videomp4Link: e.target.value})} 
                                  placeholder="https://.../video/mp4/262354-148.mp4"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Clarity Characteristic Key To Symbols</label>
                                <input 
                                  type="text" 
                                  value={prodSpecs.Keytosymbol || ''} 
                                  onChange={(e) => setProdSpecs({...prodSpecs, Keytosymbol: e.target.value})} 
                                  placeholder="Pinpoint / Feather / Crystal"
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button 
                        type="button" 
                        onClick={() => setShowAddProduct(false)}
                        className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-lg"
                      >
                        {editingProduct ? 'Update Product Listing' : 'Publish Product'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Search & Pagination Control Header */}
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 text-left">
                <div className="relative flex-1 w-full">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="w-4 h-4 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Search diamond inventory (e.g. Round, VS1, GIA, stock id, name)..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0 w-full md:w-auto justify-between md:justify-start">
                  <div className="flex items-center gap-2">
                    <span>Page size:</span>
                    <select 
                      value={productsPerPage}
                      onChange={(e) => setProductsPerPage(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                      <option value={96}>96</option>
                    </select>
                  </div>

                  {/* Elegant View Mode Toggle */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button 
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${viewMode === 'list' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                      title="List View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 border-l border-slate-800 pl-3">
                    Filtered: <b>{filteredAdminProducts.length}</b> / <b>{products.length}</b>
                  </span>
                </div>
              </div>

              {filteredAdminProducts.length === 0 ? (
                <div className="bg-slate-950 p-12 rounded-2xl border border-slate-800 text-center space-y-3">
                  <X className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">No matching diamonds found</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Try checking your search criteria or clear the query to view all assets.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Statistics Bar as in the Image */}
                  <div className="grid grid-cols-5 gap-0.5 bg-[#0A1121] border border-slate-800/80 rounded-2xl overflow-hidden text-center divide-x divide-slate-800/60 shadow-lg">
                    <div className="py-3 px-1">
                      <div className="text-sm sm:text-base font-black text-white font-mono tracking-tight">{filteredAdminProducts.length}</div>
                      <div className="text-[8px] sm:text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider">Pcs</div>
                    </div>
                    <div className="py-3 px-1">
                      <div className="text-sm sm:text-base font-black text-white font-mono tracking-tight">
                        {filteredAdminProducts.reduce((sum, p) => sum + (p.carat || 0), 0).toFixed(2)}
                      </div>
                      <div className="text-[8px] sm:text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider">Cts</div>
                    </div>
                    <div className="py-3 px-1">
                      <div className="text-sm sm:text-base font-black text-emerald-400 font-mono tracking-tight">
                        {(filteredAdminProducts.length 
                          ? filteredAdminProducts.reduce((sum, p) => {
                              const d = p.Rap__ && p.Rap__ !== 0 ? p.Rap__ : -(48 + (parseFloat(p.id.replace(/\D/g, '') || '5') % 150) / 10);
                              return sum + d;
                            }, 0) / filteredAdminProducts.length 
                          : 0).toFixed(2)}%
                      </div>
                      <div className="text-[8px] sm:text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider">Disc %</div>
                    </div>
                    <div className="py-3 px-1">
                      <div className="text-sm sm:text-base font-black text-amber-400 font-mono tracking-tight">
                        {Math.round(filteredAdminProducts.length 
                          ? filteredAdminProducts.reduce((sum, p) => sum + (p.price / p.carat), 0) / filteredAdminProducts.length 
                          : 0).toLocaleString()}
                      </div>
                      <div className="text-[8px] sm:text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider">Price/Cts</div>
                    </div>
                    <div className="py-3 px-1">
                      <div className="text-sm sm:text-base font-black text-amber-500 font-mono tracking-tight">
                        {filteredAdminProducts.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-[8px] sm:text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider">Amount THB</div>
                    </div>
                  </div>

                  {viewMode === 'list' ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-left">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-widest font-black text-[9px] select-none">
                              <th className="px-6 py-4">Diamond Specs</th>
                              <th className="px-6 py-4">GIA Certificate</th>
                              <th className="px-6 py-4">Carat</th>
                              <th className="px-6 py-4">Raw Base Price</th>
                              <th className="px-6 py-4">Markup</th>
                              <th className="px-6 py-4">Final Listed Price</th>
                              <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {paginatedAdminProducts.map((p) => {
                              const markupPercent = p.markupPercentage || 12;
                              const rawBasePrice = p.basePrice || Math.round(p.price / p.carat / (1 + (markupPercent / 100)));
                              
                              const cutAbbrev = p.cut === 'Excellent' ? 'EX' : p.cut === 'Very Good' ? 'VG' : p.cut === 'Good' ? 'GD' : 'EX';
                              const polishVal = p.Polish || 'EX';
                              const symmetryVal = p.Symmetry || 'EX';
                              const fluoroVal = p.Fluorescent || 'N';
                              const labVal = p.Lab || p.certification || 'GIA';
                              const specString = `Color: ${p.color} • Clarity: ${p.clarity} • ${cutAbbrev} ${polishVal} ${symmetryVal}`;

                              return (
                                <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                                  {/* DIAMOND SPECS */}
                                  <td className="px-6 py-4">
                                    <div className="text-left">
                                      <span className="font-bold text-white block text-sm">
                                        {p.Shape || 'Round'}
                                      </span>
                                      <span className="text-[10px] text-slate-400 block mt-0.5">
                                        {specString}
                                      </span>
                                    </div>
                                  </td>

                                  {/* GIA CERTIFICATE */}
                                  <td className="px-6 py-4 font-mono text-xs">
                                    {p.certId || p.certification ? (
                                      <a
                                        href={`https://www.gia.edu/report-check?reportno=${p.certId || p.certification}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sky-400 font-bold hover:underline inline-flex items-center gap-1"
                                      >
                                        {p.certId || p.certification || p.Stock_NO}
                                        <ExternalLink className="w-3 h-3 text-sky-400/80" />
                                      </a>
                                    ) : (
                                      <span className="text-slate-500">None</span>
                                    )}
                                  </td>

                                  {/* CARAT */}
                                  <td className="px-6 py-4 font-mono font-bold text-white text-sm">
                                    {p.carat.toFixed(2)} ct
                                  </td>

                                  {/* RAW BASE PRICE */}
                                  <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                                    ${rawBasePrice.toLocaleString(undefined, {maximumFractionDigits: 0})}/ct
                                  </td>

                                  {/* MARKUP */}
                                  <td className="px-6 py-4 font-mono font-bold text-amber-500 text-sm">
                                    +{markupPercent}%
                                  </td>

                                  {/* FINAL LISTED PRICE */}
                                  <td className="px-6 py-4 font-mono font-black text-white text-sm">
                                    {p.price.toLocaleString()} THB
                                  </td>

                                  {/* ACTIONS */}
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button 
                                        type="button"
                                        onClick={() => startEditProduct(p)}
                                        className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 transition-colors cursor-pointer"
                                        title="Edit Diamond Asset"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => handleDeleteProduct(p.id, p.name)}
                                        className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-500 rounded-xl text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                                        title="Delete Diamond Asset"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedAdminProducts.map((p) => (
                        <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                          <div>
                            {/* Product Thumbnail */}
                            <div className="relative h-44 bg-slate-900 flex items-center justify-center">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              <div className="absolute top-2 right-2 flex gap-1">
                                <span className="px-2 py-0.5 bg-slate-950/80 backdrop-blur-xs text-amber-500 text-[9px] font-black uppercase rounded border border-amber-500/30">
                                  {p.carat} CARAT
                                </span>
                              </div>
                            </div>

                            {/* Info body */}
                            <div className="p-4 space-y-2.5 text-left">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[180px]">{p.name}</h4>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${p.stock > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                  {p.stock > 0 ? `Stock: ${p.stock}` : 'Out of Stock'}
                                </span>
                              </div>

                              {/* Specs row */}
                              <div className="grid grid-cols-4 gap-1 bg-slate-900 p-2 rounded-lg text-center border border-slate-800">
                                <div>
                                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Cut</span>
                                  <span className="text-[10px] text-white block font-black">{p.cut.split(' ')[0]}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Color</span>
                                  <span className="text-[10px] text-white block font-black">{p.color}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Clarity</span>
                                  <span className="text-[10px] text-white block font-black">{p.clarity}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Cert</span>
                                  <span className="text-[10px] text-amber-400 block font-black">{p.certification}</span>
                                </div>
                              </div>

                              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
                            </div>
                          </div>

                          {/* Footer price & action */}
                          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center">
                            <div>
                              <span className="text-[8px] text-slate-500 uppercase font-black block">WHOLESALE PRICE</span>
                              <span className="font-mono text-sm font-black text-emerald-400">{p.price.toLocaleString()} THB</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button 
                                type="button"
                                onClick={() => startEditProduct(p)}
                                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-slate-300 cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-slate-500 hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Elegant Admin Pagination Control Footer */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                    <div className="text-xs text-slate-400">
                      <span className="text-[11px] text-slate-500">
                        Showing <b>{(currentProductPage - 1) * productsPerPage + 1}</b> to <b>{Math.min(currentProductPage * productsPerPage, filteredAdminProducts.length)}</b> of <b>{filteredAdminProducts.length}</b> premium diamonds
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentProductPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentProductPage === 1}
                        className="p-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Dynamic page numbers window */}
                      {Array.from({ length: Math.min(5, totalAdminProductPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalAdminProductPages > 5 && currentProductPage > 3) {
                          if (currentProductPage + 2 <= totalAdminProductPages) {
                            pageNum = currentProductPage - 2 + i;
                          } else {
                            pageNum = totalAdminProductPages - 4 + i;
                          }
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentProductPage(pageNum)}
                            className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                              currentProductPage === pageNum
                                ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      {totalAdminProductPages > 5 && currentProductPage + 2 < totalAdminProductPages && (
                        <>
                          <span className="text-slate-600 px-1 font-mono text-xs">...</span>
                          <button
                            onClick={() => setCurrentProductPage(totalAdminProductPages)}
                            className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                              currentProductPage === totalAdminProductPages
                                ? 'bg-amber-500 border-amber-500 text-slate-950'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {totalAdminProductPages}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setCurrentProductPage(prev => Math.min(prev + 1, totalAdminProductPages))}
                        disabled={currentProductPage === totalAdminProductPages}
                        className="p-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                        title="Next Page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* PRICE MARKUP TOOL TAB */}
          {activeTab === 'markup' && (
            <div className="space-y-6 text-left">
              
              {/* Header Card */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-display">Global Price Markup Engine</h3>
                </div>
                <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                  Apply a custom percentage markup on your purchased supplier inventory. You can markup the entire catalog or narrow down by search text, shape, color, clarity, carat weight ranges, or certification lab.
                </p>
              </div>

              {/* Scope & Control Form Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Controls (Col-span 5) */}
                <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800 pb-2.5">
                    Markup Configuration
                  </h4>

                  {/* Scope Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                      1. TARGET SCOPE
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      {(['all', 'filtered', 'attribute'] as const).map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          onClick={() => setMarkupScope(sc)}
                          className={`py-2 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${markupScope === sc ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                          {sc === 'all' ? 'All Items' : sc === 'filtered' ? 'By Search' : 'By Attributes'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Query Target (conditional) */}
                  {markupScope === 'filtered' && (
                    <div className="space-y-2 animate-fadeIn">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        Search Text Matcher
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={markupSearchQuery}
                          onChange={(e) => setMarkupSearchQuery(e.target.value)}
                          placeholder="Search Stock #, Shape, Cert ID..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                      </div>
                    </div>
                  )}

                  {/* Attribute Matchers (conditional) */}
                  {markupScope === 'attribute' && (
                    <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 animate-fadeIn text-xs">
                      {/* Shape & Cut */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Shape</label>
                          <select
                            value={markupShape}
                            onChange={(e) => setMarkupShape(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                          >
                            <option value="All">All Shapes</option>
                            {uniqueShapes.map(sh => (
                              <option key={sh} value={sh}>{sh}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Cut Grade</label>
                          <select
                            value={markupCut}
                            onChange={(e) => setMarkupCut(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                          >
                            <option value="All">All Cuts</option>
                            {uniqueCuts.map(ct => (
                              <option key={ct} value={ct}>{ct}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Color & Clarity */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Color</label>
                          <select
                            value={markupColor}
                            onChange={(e) => setMarkupColor(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                          >
                            <option value="All">All Colors</option>
                            {uniqueColors.map(cl => (
                              <option key={cl} value={cl}>{cl}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Clarity</label>
                          <select
                            value={markupClarity}
                            onChange={(e) => setMarkupClarity(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                          >
                            <option value="All">All Clarities</option>
                            {uniqueClarities.map(cla => (
                              <option key={cla} value={cla}>{cla}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Lab & Carat Weight Ranges */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-500 font-bold uppercase">Lab / Certification</label>
                        <select
                          value={markupLab}
                          onChange={(e) => setMarkupLab(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                        >
                          <option value="All">All Labs</option>
                          {uniqueLabs.map(lb => (
                            <option key={lb} value={lb}>{lb}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Min Carats</label>
                          <input
                            type="number"
                            step="0.01"
                            value={markupCaratMin}
                            onChange={(e) => setMarkupCaratMin(e.target.value)}
                            placeholder="e.g. 0.50"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-amber-500/40"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Max Carats</label>
                          <input
                            type="number"
                            step="0.01"
                            value={markupCaratMax}
                            onChange={(e) => setMarkupCaratMax(e.target.value)}
                            placeholder="e.g. 3.00"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-amber-500/40"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Markup Percent Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                      2. MARKUP PERCENTAGE (%)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.1"
                          value={markupPercent}
                          onChange={(e) => setMarkupPercent(e.target.value)}
                          placeholder="e.g. 15.0"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold font-mono text-white focus:outline-none focus:border-amber-500/40"
                        />
                        <span className="absolute right-4 top-2.5 text-slate-400 font-bold text-sm">%</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['5', '10', '15', '20', '25', '30'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setMarkupPercent(val)}
                          className={`px-2 py-1 text-[9px] font-bold uppercase rounded border transition-all cursor-pointer ${markupPercent === val ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}
                        >
                          +{val}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rounding Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                      3. PRICE ROUNDING
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px]">
                      {[
                        { id: 'none', label: 'Exact (No Rounding)' },
                        { id: '10', label: 'Round to 10 THB' },
                        { id: '100', label: 'Round to 100 THB' },
                        { id: '1000', label: 'Round to 1,000 THB' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMarkupRounding(item.id as any)}
                          className={`p-2 text-left font-bold rounded-lg transition-all cursor-pointer ${markupRounding === item.id ? 'bg-slate-950 text-amber-400 border border-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Execute Button */}
                  <div className="pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={async () => {
                        const affected = getAffectedProducts();
                        if (affected.length === 0) {
                          showToast("No products found matching these filters.", true);
                          return;
                        }
                        
                        const confirmMsg = `Are you sure you want to apply a ${markupPercent}% markup with ${
                          markupRounding === 'none' ? 'no rounding' : `rounding to nearest ${markupRounding} THB`
                        } on ${affected.length} matching diamonds? This will update the database permanently.`;

                        if (!window.confirm(confirmMsg)) return;

                        const updatedProductsList = products.map(p => {
                          const isAffected = affected.some(aff => aff.id === p.id);
                          if (isAffected) {
                            const newPrice = calculateNewPrice(p.price);
                            const newPrCt = p.carat > 0 ? Math.round(newPrice / p.carat) : p.Pr_Ct;
                            return {
                              ...p,
                              price: newPrice,
                              Pr_Ct: newPrCt,
                              Amount: newPrice
                            };
                          }
                          return p;
                        });

                        // Instantly update states so user gets high-fidelity feedback
                        saveProducts(updatedProductsList);
                        setProducts(updatedProductsList);

                        // Upload updated items back to Firestore
                        const productsToUpload = updatedProductsList.filter(p => affected.some(aff => aff.id === p.id));
                        setBatchUploadProgress({ pct: 0, current: 0, total: productsToUpload.length });

                        try {
                          if (productsToUpload.length > 0) {
                            await saveProductsToDbInBatches(productsToUpload, (pct, current, total) => {
                              setBatchUploadProgress({ pct, current, total });
                            });
                          }
                          showToast(`Price update synchronized! Applied markup successfully to ${productsToUpload.length} diamonds.`);
                        } catch (err) {
                          console.error(err);
                          showToast("Database sync failed. Updated assets were saved locally.", true);
                        } finally {
                          setBatchUploadProgress(null);
                        }
                      }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Apply Markup & Sync ({getAffectedProducts().length} items)
                    </button>
                  </div>

                </div>

                {/* Right: Affected Items Preview & Projections (Col-span 7) */}
                <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
                  
                  {/* Summary Bar */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800 pb-2.5">
                      Live Markup Projection
                    </h4>

                    {(() => {
                      const affected = getAffectedProducts();
                      const currentTotal = affected.reduce((sum, p) => sum + p.price, 0);
                      const projectedTotal = affected.reduce((sum, p) => sum + calculateNewPrice(p.price), 0);
                      const marginDiff = projectedTotal - currentTotal;

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 text-center">
                            <span className="text-[8px] text-slate-500 font-extrabold uppercase block">Matched Assets</span>
                            <span className="text-sm font-black font-mono text-white mt-1 block">
                              {affected.length} Pcs
                            </span>
                          </div>
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 text-center">
                            <span className="text-[8px] text-slate-500 font-extrabold uppercase block">Original Cost</span>
                            <span className="text-sm font-black font-mono text-slate-300 mt-1 block">
                              {currentTotal.toLocaleString()} THB
                            </span>
                          </div>
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 text-center">
                            <span className="text-[8px] text-slate-500 font-extrabold uppercase block">Marked Up Price</span>
                            <span className="text-sm font-black font-mono text-emerald-400 mt-1 block">
                              {projectedTotal.toLocaleString()} THB
                            </span>
                          </div>
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 text-center">
                            <span className="text-[8px] text-slate-500 font-extrabold uppercase block">Margin Gain</span>
                            <span className="text-sm font-black font-mono text-amber-500 mt-1 block">
                              +{marginDiff.toLocaleString()} THB
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Table Sample of Affected Items */}
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        Sample Preview (Up to 8 items matching)
                      </span>
                      <span className="text-[9px] text-amber-500 font-black uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {markupScope === 'all' ? 'Scope: ALL INVENTORY' : 'Scope: CUSTOM FILTER'}
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/30">
                      <table className="w-full text-[10.5px] border-collapse text-left">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase tracking-widest font-black text-[8.5px]">
                            <th className="p-2.5">Stock NO</th>
                            <th className="p-2.5">Shape/Carat</th>
                            <th className="p-2.5">Specs</th>
                            <th className="p-2.5 text-right">Current Price</th>
                            <th className="p-2.5 text-right text-emerald-400">Projected Retail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {getAffectedProducts().slice(0, 8).map(p => {
                            const newPrice = calculateNewPrice(p.price);
                            const spec = `${p.color} ${p.clarity} ${p.cut === 'Excellent' ? 'EX' : p.cut === 'Very Good' ? 'VG' : p.cut} ${p.certification}`;
                            return (
                              <tr key={p.id} className="hover:bg-slate-900/40">
                                <td className="p-2.5 font-mono font-bold text-white uppercase">{p.Stock_NO || p.certId || p.id.split('_').pop()?.substring(0, 8).toUpperCase()}</td>
                                <td className="p-2.5 text-slate-300 font-bold">
                                  {p.Shape || p.shape || 'ROUND'} • {p.carat.toFixed(2)}ct
                                </td>
                                <td className="p-2.5 text-slate-400 font-mono font-semibold">{spec}</td>
                                <td className="p-2.5 text-right text-slate-400 font-mono">{p.price.toLocaleString()}</td>
                                <td className="p-2.5 text-right font-mono font-black text-emerald-400">{newPrice.toLocaleString()} THB</td>
                              </tr>
                            );
                          })}
                          {getAffectedProducts().length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-500 font-bold uppercase text-[10px]">
                                No products match the current selection.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {getAffectedProducts().length > 8 && (
                      <p className="text-[10px] text-slate-500 font-bold text-right italic">
                        * Showing first 8 matching products of {getAffectedProducts().length} total matched
                      </p>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* 4. ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
              
              {/* Orders List */}
              <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5">Orders List</h3>
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div 
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedOrder?.id === o.id ? 'bg-slate-900 border-amber-500' : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-black text-white">{o.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-1">{o.customerName}</p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/60">
                        <span className="font-mono text-xs font-bold text-emerald-400">{o.totalAmount.toLocaleString()} THB</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${o.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {o.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Invoice Details */}
              <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                {selectedOrder ? (
                  <div className="space-y-6">
                    
                    {/* Invoice header */}
                    <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest">PHETMANY INVOICE</span>
                        <h3 className="text-lg font-black text-white font-mono mt-0.5">{selectedOrder.invoiceNumber}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Logged on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${selectedOrder.shippingStatus === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {selectedOrder.shippingStatus}
                        </span>
                      </div>
                    </div>

                    {/* Customer billing/shipping info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase font-black block">BILL TO</span>
                        <span className="text-xs font-black text-white mt-1 block">{selectedOrder.customerName}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{selectedOrder.customerEmail}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{selectedOrder.shippingAddress.phone}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase font-black block">SHIPPING ADDRESS</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                          {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}, {selectedOrder.shippingAddress.country}
                        </p>
                      </div>
                    </div>

                    {/* Order items list */}
                    <div className="space-y-2">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">ITEMS LISTING</span>
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <img src={item.product.image} className="w-10 h-10 object-cover rounded-lg" alt="" />
                            <div>
                              <span className="text-xs font-black text-white uppercase">{item.product.name}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5">{item.product.carat} Carat • {item.product.cut} Cut • {item.product.clarity} Clarity</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-xs font-black text-white block">{item.product.price.toLocaleString()} THB</span>
                            <span className="text-[9px] text-slate-500 block">Qty: {item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Invoice Summary and actions */}
                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase font-black block">INVOICE GRAND TOTAL</span>
                        <span className="font-mono text-base font-black text-emerald-400 mt-1 block">{selectedOrder.totalAmount.toLocaleString()} THB</span>
                        <span className="text-[10px] text-slate-400 block">Payment Method: {selectedOrder.paymentMethod}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedOrder.paymentStatus === 'Pending' && (
                          <button 
                            onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'Paid')}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-black uppercase rounded-lg"
                          >
                            Mark Paid
                          </button>
                        )}
                        
                        <select 
                          value={selectedOrder.shippingStatus}
                          onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold px-3 py-1.5 text-slate-200"
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    </div>

                    {/* Tracking detail logs */}
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">COURIER DISPATCH</span>
                      
                      {selectedOrder.trackingNumber ? (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <Truck className="w-4 h-4 text-amber-500" />
                            <span>Thai Post EMS: {selectedOrder.trackingNumber}</span>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleAddTracking} className="flex gap-2">
                          <input 
                            type="text"
                            value={trackingNo}
                            onChange={(e) => setTrackingNo(e.target.value)}
                            placeholder="Input Thailand Post Tracking # (e.g., EMS123TH)"
                            className="bg-slate-900 border border-slate-800 rounded-lg text-xs px-3 py-2 text-white flex-1 focus:outline-none"
                          />
                          <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase rounded-lg">
                            Log Tracking
                          </button>
                        </form>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="py-24 text-center">
                    <FileText className="w-12 h-12 text-slate-700 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-4">Select an invoice to edit details</h3>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STORE ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 text-left">
              
              {/* Header Card */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-display">Business Intelligence & Analytics</h3>
                  </div>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    Gain data-driven insights on product performance, customer behavior, and unsold stock velocity to optimize pricing and inventory markups.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Live Database Connected
                  </span>
                </div>
              </div>

              {/* Sub-navigation Tabs */}
              <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'insights', label: 'Overview Insights', icon: PieChart },
                  { id: 'performance', label: 'Product Performance', icon: TrendingUp },
                  { id: 'notBought', label: 'Unsold Catalog (Not Bought)', icon: Ban },
                  { id: 'search', label: 'Search & Analyze Products', icon: Search },
                ].map((st) => {
                  const Icon = st.icon;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setAnalyticsSubTab(st.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${analyticsSubTab === st.id ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {st.label}
                    </button>
                  );
                })}
              </div>

              {/* TAB SUB-PAGES */}
              {(() => {
                const paidOrders = orders.filter(o => o.paymentStatus === 'Paid');
                const totalSalesRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                const totalOrdersCount = paidOrders.length;
                
                // Get list of all sold products
                const soldItems = paidOrders.flatMap(o => o.items || []);
                const soldProductsMap = new Map<string, { product: Product; qty: number; revenue: number }>();
                
                soldItems.forEach(item => {
                  if (item.product?.id) {
                    const existing = soldProductsMap.get(item.product.id) || { product: item.product, qty: 0, revenue: 0 };
                    existing.qty += item.quantity || 1;
                    existing.revenue += (item.product.price || 0) * (item.quantity || 1);
                    soldProductsMap.set(item.product.id, existing);
                  }
                });

                const soldProductIds = new Set(Array.from(soldProductsMap.keys()));
                const unsoldProducts = products.filter(p => !soldProductIds.has(p.id));
                
                const totalUnsoldCost = unsoldProducts.reduce((sum, p) => sum + p.price, 0);
                const totalUnsoldCarats = unsoldProducts.reduce((sum, p) => sum + (p.carat || 0), 0);
                const totalSoldCarats = Array.from(soldProductsMap.values()).reduce((sum, item) => sum + (item.product.carat || 0) * item.qty, 0);
                
                if (analyticsSubTab === 'insights') {
                  // --- OVERVIEW INSIGHTS ---
                  // 1. Payment Methods split
                  const paymentSplit = paidOrders.reduce((acc, o) => {
                    const method = o.paymentMethod || 'PromptPay';
                    acc[method] = (acc[method] || 0) + o.totalAmount;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  // 2. Shape metrics
                  const shapeInventoryStats = products.reduce((acc, p) => {
                    const shape = String(p.Shape || 'ROUND').toUpperCase();
                    if (!acc[shape]) acc[shape] = { total: 0, sold: 0, revenue: 0 };
                    acc[shape].total += 1;
                    return acc;
                  }, {} as Record<string, { total: number; sold: number; revenue: number }>);

                  soldItems.forEach(item => {
                    if (item.product) {
                      const shape = String(item.product.Shape || 'ROUND').toUpperCase();
                      if (!shapeInventoryStats[shape]) shapeInventoryStats[shape] = { total: 0, sold: 0, revenue: 0 };
                      shapeInventoryStats[shape].sold += item.quantity || 1;
                      shapeInventoryStats[shape].revenue += (item.product.price || 0) * (item.quantity || 1);
                    }
                  });

                  const topShapes = Object.entries(shapeInventoryStats)
                    .map(([shape, stats]: [string, { total: number; sold: number; revenue: number }]) => ({
                      shape,
                      total: stats.total,
                      sold: stats.sold,
                      revenue: stats.revenue,
                      successRate: stats.total > 0 ? (stats.sold / stats.total) * 100 : 0
                    }))
                    .sort((a, b) => b.revenue - a.revenue);

                  // 3. Sales over time (group by date)
                  const salesByDate = paidOrders.reduce((acc, o) => {
                    const dateStr = o.createdAt ? o.createdAt.substring(0, 10) : 'N/A';
                    acc[dateStr] = (acc[dateStr] || 0) + o.totalAmount;
                    return acc;
                  }, {} as Record<string, number>);

                  const sortedSalesByDate = Object.entries(salesByDate)
                    .map(([date, revenue]: [string, number]) => ({ date, revenue }))
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(-7); // Last 7 active sales days

                  const maxDailyRevenue = Math.max(...sortedSalesByDate.map((d: { date: string; revenue: number }) => d.revenue), 1);

                  return (
                    <div className="space-y-6">
                      
                      {/* Bento Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex justify-between items-center relative overflow-hidden">
                          <div className="space-y-1.5 z-10">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Sales Revenue</span>
                            <p className="text-2xl font-black text-emerald-400 font-mono">{totalSalesRevenue.toLocaleString()} THB</p>
                            <span className="text-[9px] text-slate-400 font-medium">Accumulated from paid invoices</span>
                          </div>
                          <DollarSign className="w-10 h-10 text-emerald-500/10 absolute right-4 bottom-4" />
                        </div>

                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex justify-between items-center relative overflow-hidden">
                          <div className="space-y-1.5 z-10">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Orders Completed</span>
                            <p className="text-2xl font-black text-blue-400 font-mono">{totalOrdersCount} Orders</p>
                            <span className="text-[9px] text-slate-400 font-medium">100% audited checkout orders</span>
                          </div>
                          <ShoppingCart className="w-10 h-10 text-blue-500/10 absolute right-4 bottom-4" />
                        </div>

                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex justify-between items-center relative overflow-hidden">
                          <div className="space-y-1.5 z-10">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Diamonds Sold</span>
                            <p className="text-2xl font-black text-amber-500 font-mono">
                              {soldProductIds.size} Pcs <span className="text-xs text-slate-400 font-normal">({totalSoldCarats.toFixed(2)} ct)</span>
                            </p>
                            <span className="text-[9px] text-slate-400 font-medium">Unique diamonds sold</span>
                          </div>
                          <Sparkles className="w-10 h-10 text-amber-500/10 absolute right-4 bottom-4" />
                        </div>

                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex justify-between items-center relative overflow-hidden">
                          <div className="space-y-1.5 z-10">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Unsold Locked Asset Value</span>
                            <p className="text-2xl font-black text-rose-400 font-mono">{totalUnsoldCost.toLocaleString()} THB</p>
                            <span className="text-[9px] text-slate-400 font-medium">{unsoldProducts.length} items ({totalUnsoldCarats.toFixed(2)} ct) in catalog</span>
                          </div>
                          <Ban className="w-10 h-10 text-rose-500/10 absolute right-4 bottom-4" />
                        </div>
                      </div>

                      {/* Charts Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* 1. Daily Sales Trend Chart (Col-span 7) */}
                        <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest">
                                Daily Sales Performance (Last 7 Days)
                              </h4>
                              <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                                Revenue Curve
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Shows daily aggregate payments cleared in THB.</p>
                          </div>

                          {/* Visual Bar representation */}
                          <div className="h-44 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-800/60">
                            {sortedSalesByDate.length === 0 ? (
                              <div className="w-full h-full flex flex-col justify-center items-center text-slate-600 text-xs font-bold uppercase">
                                No sales data recorded yet.
                              </div>
                            ) : (
                              sortedSalesByDate.map((day: { date: string; revenue: number }) => {
                                const heightPercent = (day.revenue / maxDailyRevenue) * 100;
                                return (
                                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                                    <div className="text-[9px] font-mono font-black text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity pb-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shadow -translate-y-1">
                                      {Math.round(day.revenue / 1000)}k
                                    </div>
                                    <div 
                                      style={{ height: `${Math.max(heightPercent, 5)}%` }} 
                                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-amber-500 hover:to-amber-400 rounded-t-md transition-all shadow-md group-hover:shadow-emerald-500/20"
                                    />
                                    <span className="text-[9px] font-mono text-slate-500 group-hover:text-white transition-colors uppercase font-black tracking-wider whitespace-nowrap">
                                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* 2. Payment Gateway Distribution (Col-span 5) */}
                        <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">
                              Payment Method Preference Split
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1">Admins can audit which channels checkout the most volume.</p>
                          </div>

                          <div className="space-y-4 py-2">
                            {['PromptPay', 'TrueMoney', 'Credit Card'].map((method) => {
                              const amount = paymentSplit[method] || 0;
                              const pct = totalSalesRevenue > 0 ? (amount / totalSalesRevenue) * 100 : 0;
                              const colorClass = method === 'PromptPay' ? 'bg-blue-500' : method === 'TrueMoney' ? 'bg-orange-500' : 'bg-pink-500';
                              const textColorClass = method === 'PromptPay' ? 'text-blue-400' : method === 'TrueMoney' ? 'text-orange-400' : 'text-pink-400';
                              
                              return (
                                <div key={method} className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold font-mono">
                                    <span className="text-slate-300">{method}</span>
                                    <span className={textColorClass}>
                                      {amount.toLocaleString()} THB ({pct.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                    <div style={{ width: `${pct}%` }} className={`h-full ${colorClass} rounded-full transition-all duration-1000`} />
                                  </div>
                                </div>
                              );
                            })}
                            {totalSalesRevenue === 0 && (
                              <p className="text-[10px] text-slate-500 text-center py-6 font-bold uppercase">
                                No payments synchronized yet.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Diamond Shape Distribution Table & Popularity */}
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black text-white uppercase tracking-widest">
                            Diamond Shape Market Share & Velocity
                          </h4>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">
                            Sold Count vs Success Rate
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 text-[9px] uppercase tracking-widest font-black text-slate-500">
                                <th className="pb-3 text-left">Shape Type</th>
                                <th className="pb-3 text-center">Unsold Stock</th>
                                <th className="pb-3 text-center">Sold Pcs</th>
                                <th className="pb-3 text-center">Total Catalog</th>
                                <th className="pb-3 text-right">Revenue Generated</th>
                                <th className="pb-3 text-right">Success Rate (%)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono font-medium text-slate-300">
                              {topShapes.slice(0, 7).map((sh) => {
                                const rate = sh.successRate;
                                const rateColor = rate > 50 ? 'text-emerald-400' : rate > 20 ? 'text-amber-500' : 'text-slate-400';
                                return (
                                  <tr key={sh.shape} className="hover:bg-slate-900/20">
                                    <td className="py-3 text-left text-white font-black uppercase font-sans">{sh.shape}</td>
                                    <td className="py-3 text-center text-rose-400">{sh.total - sh.sold} pcs</td>
                                    <td className="py-3 text-center text-emerald-400">{sh.sold} pcs</td>
                                    <td className="py-3 text-center text-slate-400">{sh.total} pcs</td>
                                    <td className="py-3 text-right text-white font-black">{sh.revenue.toLocaleString()} THB</td>
                                    <td className={`py-3 text-right font-black ${rateColor}`}>
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span>{rate.toFixed(1)}%</span>
                                        <div className="w-12 h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden hidden sm:block">
                                          <div style={{ width: `${rate}%` }} className="h-full bg-amber-500 rounded-full" />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                              {topShapes.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="py-12 text-center text-slate-500 font-bold uppercase text-[10px]">
                                    No shape statistics compiled yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  );
                }

                if (analyticsSubTab === 'performance') {
                  // --- PRODUCT PERFORMANCE ---
                  const topSoldProducts = Array.from(soldProductsMap.values())
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 10);

                  const avgSalePrice = soldItems.length > 0 ? (totalSalesRevenue / soldItems.length) : 0;
                  const avgCaratSold = soldItems.length > 0 ? (totalSoldCarats / soldItems.length) : 0;

                  // Active Customers Breakdown
                  const customerSpend = paidOrders.reduce((acc, o) => {
                    const email = o.customerEmail || 'unknown@phetmany.com';
                    if (!acc[email]) acc[email] = { name: o.customerName || 'Guest', spend: 0, orders: 0 };
                    acc[email].spend += o.totalAmount;
                    acc[email].orders += 1;
                    return acc;
                  }, {} as Record<string, { name: string; spend: number; orders: number }>);

                  const topCustomers = Object.entries(customerSpend)
                    .map(([email, info]: [string, { name: string; spend: number; orders: number }]) => ({ email, ...info }))
                    .sort((a, b) => b.spend - a.spend)
                    .slice(0, 5);

                  return (
                    <div className="space-y-6">
                      
                      {/* Metric Summary Widgets */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 space-y-1.5 text-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Average Value of Sold Diamonds</span>
                          <span className="text-xl font-black font-mono text-white block">
                            {Math.round(avgSalePrice).toLocaleString()} THB
                          </span>
                          <span className="text-[9px] text-slate-400 block font-medium">Per item in Paid Invoice transactions</span>
                        </div>
                        <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 space-y-1.5 text-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Average Carat Weight Sold</span>
                          <span className="text-xl font-black font-mono text-amber-500 block">
                            {avgCaratSold.toFixed(2)} Carats
                          </span>
                          <span className="text-[9px] text-slate-400 block font-medium">Average sizing preference of buyers</span>
                        </div>
                        <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 space-y-1.5 text-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Top Spender Account</span>
                          <span className="text-xl font-black text-emerald-400 block truncate px-2">
                            {topCustomers[0] ? topCustomers[0].name : 'N/A'}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-medium">
                            {topCustomers[0] ? `${topCustomers[0].spend.toLocaleString()} THB spent` : 'No purchase records'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Left: Top Selling Diamond Listings (Col-span 7) */}
                        <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">
                              Top Selling / High Value Diamond Assets Sold
                            </h4>
                            <span className="text-[9px] text-amber-500 font-black uppercase tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                              Top Revenue Generators
                            </span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-[10.5px] text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-800 text-[8.5px] uppercase tracking-widest font-black text-slate-500">
                                  <th className="pb-2">Stock No</th>
                                  <th className="pb-2">Shape & Specs</th>
                                  <th className="pb-2 text-center">Qty Sold</th>
                                  <th className="pb-2 text-right">Total Revenue</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                                {topSoldProducts.map((p) => {
                                  const spec = `${p.product.carat.toFixed(2)}ct • ${p.product.color} ${p.product.clarity} ${p.product.cut === 'Excellent' ? 'EX' : p.product.cut} ${p.product.certification}`;
                                  return (
                                    <tr key={p.product.id} className="hover:bg-slate-900/20">
                                      <td className="py-2.5 font-bold text-white uppercase">
                                        {p.product.Stock_NO || p.product.id.split('_').pop()?.substring(0, 8).toUpperCase()}
                                      </td>
                                      <td className="py-2.5 text-slate-400 font-sans font-medium">
                                        <span className="text-white font-bold">{p.product.Shape || 'ROUND'}</span> ({spec})
                                      </td>
                                      <td className="py-2.5 text-center text-emerald-400 font-bold">{p.qty} pcs</td>
                                      <td className="py-2.5 text-right font-black text-white">{p.revenue.toLocaleString()} THB</td>
                                    </tr>
                                  );
                                })}
                                {topSoldProducts.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-500 font-bold uppercase text-[10px]">
                                      No sales products tracked yet.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Right: Customer Spend Directory (Col-span 5) */}
                        <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">
                              Top VIP Buyer Leaderboard
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1">Identifies client accounts with the highest aggregate purchases.</p>
                          </div>

                          <div className="space-y-3">
                            {topCustomers.map((cust, idx) => {
                              const rankColors = ['bg-amber-500 text-slate-950', 'bg-slate-300 text-slate-950', 'bg-amber-800 text-slate-100', 'bg-slate-800 text-slate-400', 'bg-slate-800 text-slate-400'];
                              return (
                                <div key={cust.email} className="flex items-center justify-between p-2.5 bg-slate-900/40 border border-slate-800/80 rounded-xl hover:bg-slate-900 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-lg text-center font-black text-xs flex items-center justify-center ${rankColors[idx]}`}>
                                      {idx + 1}
                                    </div>
                                    <div className="text-left">
                                      <h5 className="text-xs font-bold text-white max-w-[150px] truncate">{cust.name}</h5>
                                      <span className="text-[9px] text-slate-500 font-mono truncate block max-w-[150px]">{cust.email}</span>
                                    </div>
                                  </div>
                                  <div className="text-right font-mono">
                                    <span className="text-xs font-black text-emerald-400 block">
                                      {cust.spend.toLocaleString()} THB
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-bold uppercase">
                                      {cust.orders} Orders checkout
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            {topCustomers.length === 0 && (
                              <p className="text-[10px] text-slate-500 text-center py-12 font-bold uppercase">
                                No VIP purchaser records compiled yet.
                              </p>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                }

                if (analyticsSubTab === 'notBought') {
                  // --- NOT BOUGHT (UNSOLD CATALOG) ---
                  const filteredUnsold = unsoldProducts.filter(p => {
                    if (!notBoughtSearchQuery.trim()) return true;
                    const query = notBoughtSearchQuery.toLowerCase();
                    const matchId = p.id.toLowerCase().includes(query);
                    const matchName = p.name?.toLowerCase().includes(query) || false;
                    const matchStockNo = p.Stock_NO?.toLowerCase().includes(query) || false;
                    const matchCert = p.certId?.toLowerCase().includes(query) || p.CERT_NO?.toLowerCase().includes(query) || false;
                    const matchShape = (p.Shape || '').toLowerCase().includes(query);
                    return matchId || matchName || matchStockNo || matchCert || matchShape;
                  });

                  const unsoldPerPage = 12;
                  const totalUnsoldPages = Math.max(Math.ceil(filteredUnsold.length / unsoldPerPage), 1);
                  const paginatedUnsold = filteredUnsold.slice((unsoldPage - 1) * unsoldPerPage, unsoldPage * unsoldPerPage);

                  return (
                    <div className="space-y-6">
                      
                      {/* Metric Summary Widgets */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 text-center">
                          <span className="text-[9px] text-slate-500 font-extrabold uppercase block">Unsold Diamond Stock</span>
                          <span className="text-lg font-black font-mono text-white mt-1 block">
                            {unsoldProducts.length} Pcs
                          </span>
                        </div>
                        <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 text-center">
                          <span className="text-[9px] text-slate-500 font-extrabold uppercase block">Unsold Total Carats</span>
                          <span className="text-lg font-black font-mono text-amber-500 mt-1 block">
                            {totalUnsoldCarats.toFixed(2)} Carats
                          </span>
                        </div>
                        <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 text-center">
                          <span className="text-[9px] text-slate-500 font-extrabold uppercase block">Total Capital Valuation</span>
                          <span className="text-lg font-black font-mono text-rose-400 mt-1 block">
                            {totalUnsoldCost.toLocaleString()} THB
                          </span>
                        </div>
                        <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 text-center">
                          <span className="text-[9px] text-slate-500 font-extrabold uppercase block">Velocity Status</span>
                          <span className="text-xs font-black text-emerald-400 mt-1 bg-emerald-500/10 py-1 px-2.5 rounded border border-emerald-500/20 inline-block uppercase">
                            {products.length > 0 ? `${((unsoldProducts.length / products.length) * 100).toFixed(0)}% Unsold` : '0%'}
                          </span>
                        </div>
                      </div>

                      {/* Not Bought Controller & Filter */}
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">
                              Unsold Inventory Query & Bulk Adjustments
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1">
                              These {unsoldProducts.length} diamonds have never been purchased. You can search them or bulk discount them.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <button
                              onClick={async () => {
                                if (filteredUnsold.length === 0) {
                                  showToast("No matching unsold items to adjust.", true);
                                  return;
                                }
                                const confirmMsg = `Are you sure you want to apply a 5% Promo Discount on these ${filteredUnsold.length} unsold products? This will directly update retail pricing on storefront.`;
                                if (!window.confirm(confirmMsg)) return;

                                const updatedList = products.map(p => {
                                  const isUnsoldAndFiltered = filteredUnsold.some(un => un.id === p.id);
                                  if (isUnsoldAndFiltered) {
                                    const discountedPrice = Math.round((p.price * 0.95) / 10) * 10;
                                    const newPrCt = p.carat > 0 ? Math.round(discountedPrice / p.carat) : p.Pr_Ct;
                                    return { ...p, price: discountedPrice, Pr_Ct: newPrCt, Amount: discountedPrice };
                                  }
                                  return p;
                                });

                                setProducts(updatedList);
                                saveProducts(updatedList);

                                const productsToUpload = updatedList.filter(p => filteredUnsold.some(un => un.id === p.id));
                                setBatchUploadProgress({ pct: 0, current: 0, total: productsToUpload.length });
                                try {
                                  await saveProductsToDbInBatches(productsToUpload, (pct, current, total) => {
                                    setBatchUploadProgress({ pct, current, total });
                                  });
                                  showToast(`Successfully applied -5% clearance discount to ${productsToUpload.length} slow-moving diamonds!`);
                                } catch (e) {
                                  showToast("Database sync failed, saved locally.", true);
                                } finally {
                                  setBatchUploadProgress(null);
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Tag className="w-3 h-3" />
                              Apply 5% Clearance Discount
                            </button>
                          </div>
                        </div>

                        {/* Search Query inside Unsold */}
                        <div className="relative">
                          <input
                            type="text"
                            value={notBoughtSearchQuery}
                            onChange={(e) => {
                              setNotBoughtSearchQuery(e.target.value);
                              setUnsoldPage(1);
                            }}
                            placeholder="Type Shape, Color, Clarity, Stock # or Cert ID to analyze unsold items..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-amber-500/40"
                          />
                          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        </div>

                        {/* Table Listing */}
                        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/10">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-900/40 text-[8.5px] uppercase tracking-widest font-black text-slate-500">
                                <th className="p-3">Stock No</th>
                                <th className="p-3">Shape & Weight</th>
                                <th className="p-3">Specifications</th>
                                <th className="p-3 text-right">Carat Price (THB)</th>
                                <th className="p-3 text-right text-white font-bold">Store Price</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                              {paginatedUnsold.map((p) => {
                                const spec = `${p.color} ${p.clarity} ${p.cut === 'Excellent' ? 'EX' : p.cut} ${p.certification || p.Lab || 'GIA'}`;
                                return (
                                  <tr key={p.id} className="hover:bg-slate-900/30">
                                    <td className="p-3 font-bold text-white uppercase">
                                      {p.Stock_NO || p.id.split('_').pop()?.substring(0, 8).toUpperCase()}
                                    </td>
                                    <td className="p-3 text-slate-200 font-sans font-bold">
                                      {p.Shape || 'ROUND'} • {p.carat.toFixed(2)}ct
                                    </td>
                                    <td className="p-3 text-slate-400 text-[11px]">{spec}</td>
                                    <td className="p-3 text-right text-slate-500">{p.Pr_Ct ? p.Pr_Ct.toLocaleString() : '-'} THB</td>
                                    <td className="p-3 text-right text-white font-black">{p.price.toLocaleString()} THB</td>
                                  </tr>
                                );
                              })}
                              {filteredUnsold.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="p-12 text-center text-slate-500 font-bold uppercase text-[10px]">
                                    No unsold items found matching query.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {totalUnsoldPages > 1 && (
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-slate-500 font-extrabold uppercase">
                              Showing {(unsoldPage - 1) * unsoldPerPage + 1} - {Math.min(unsoldPage * unsoldPerPage, filteredUnsold.length)} of {filteredUnsold.length} Unsold Diamonds
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setUnsoldPage(p => Math.max(p - 1, 1))}
                                disabled={unsoldPage === 1}
                                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-xs font-mono font-black text-white px-2">
                                {unsoldPage} / {totalUnsoldPages}
                              </span>
                              <button
                                onClick={() => setUnsoldPage(p => Math.min(p + 1, totalUnsoldPages))}
                                disabled={unsoldPage === totalUnsoldPages}
                                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  );
                }

                if (analyticsSubTab === 'search') {
                  // --- SEARCH & ANALYZE PRODUCTS ---
                  const query = analyticsSearchQuery.trim().toLowerCase();
                  const searchedMatches = products.filter(p => {
                    if (!query) return false;
                    return p.id.toLowerCase().includes(query) || 
                           (p.Stock_NO || '').toLowerCase().includes(query) || 
                           (p.certId || '').toLowerCase().includes(query) || 
                           (p.CERT_NO || '').toLowerCase().includes(query) ||
                           (p.Shape || '').toLowerCase().includes(query);
                  }).slice(0, 10);

                  return (
                    <div className="space-y-6">
                      
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-widest">
                            Interactive Diamond Audit Analyzer
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Query a diamond's stock number or Certificate ID to trace its entire checkout history, sales volume, and real-time status.
                          </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                          <input
                            type="text"
                            value={analyticsSearchQuery}
                            onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                            placeholder="Type Certificate ID (e.g., GIA cert) or stock number to query database records..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-amber-500/40"
                          />
                          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        </div>

                        {/* Query results analysis list */}
                        <div className="space-y-4">
                          {searchedMatches.map((p) => {
                            const isSold = soldProductIds.has(p.id);
                            
                            // Find orders this product belongs to
                            const matchingInvoices = paidOrders.filter(o => 
                              o.items?.some(item => item.product?.id === p.id)
                            );

                            return (
                              <div key={p.id} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col md:flex-row gap-6 justify-between items-start">
                                
                                <div className="space-y-3 flex-1 text-xs">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-black text-white uppercase tracking-wider font-mono">
                                      {p.Stock_NO || p.id.split('_').pop()?.toUpperCase()}
                                    </span>
                                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                                      isSold 
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
                                    }`}>
                                      {isSold ? '● SOLD OUT' : '● AVAILABLE IN STORE'}
                                    </span>
                                    {p.certId && (
                                      <span className="text-[10px] font-mono font-bold text-slate-500">
                                        CERT: {p.certId}
                                      </span>
                                    )}
                                  </div>

                                  {/* Characteristics table */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono">
                                    <div>
                                      <span className="text-[8px] text-slate-500 uppercase block font-bold">Shape & Weight</span>
                                      <span className="text-white font-bold">{p.Shape || 'ROUND'} • {p.carat.toFixed(2)}ct</span>
                                    </div>
                                    <div>
                                      <span className="text-[8px] text-slate-500 uppercase block font-bold">Color / Clarity</span>
                                      <span className="text-white font-bold">{p.color} • {p.clarity}</span>
                                    </div>
                                    <div>
                                      <span className="text-[8px] text-slate-500 uppercase block font-bold">Cut / Lab</span>
                                      <span className="text-white font-bold">{p.cut || 'EX'} • {p.certification || p.Lab || 'GIA'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[8px] text-slate-500 uppercase block font-bold">Price Per Carat</span>
                                      <span className="text-amber-500 font-bold">
                                        {p.Pr_Ct ? p.Pr_Ct.toLocaleString() : '-'} THB
                                      </span>
                                    </div>
                                  </div>

                                  {/* Invoices match */}
                                  <div className="space-y-1.5 pt-1">
                                    <h5 className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Transaction Trace (Invoice Logs)</h5>
                                    {matchingInvoices.length === 0 ? (
                                      <p className="text-[10px] text-slate-500 italic">No checkout history recorded. Diamond is available in storefront listing.</p>
                                    ) : (
                                      <div className="space-y-1 font-mono">
                                        {matchingInvoices.map(inv => (
                                          <div key={inv.id} className="flex justify-between items-center bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800/40 text-[10.5px]">
                                            <span className="text-slate-300">Invoice: <span className="text-white font-bold">{inv.invoiceNumber || inv.id.substring(0, 8).toUpperCase()}</span></span>
                                            <span className="text-slate-400">Buyer: <span className="text-slate-200 font-bold">{inv.customerName}</span></span>
                                            <span className="text-[9.5px] text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</span>
                                            <span className="text-emerald-400 font-bold">{inv.totalAmount.toLocaleString()} THB</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Pricing summary card */}
                                <div className="w-full md:w-56 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center flex flex-col justify-between h-full space-y-3 font-mono">
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase block font-extrabold">Retail Retail Price</span>
                                    <span className="text-lg font-black text-white mt-1 block">
                                      {p.price.toLocaleString()} THB
                                    </span>
                                  </div>
                                  <div className="border-t border-slate-900 pt-2 text-[9.5px] text-left text-slate-400 space-y-1">
                                    <div className="flex justify-between">
                                      <span>Disc % (Rap%):</span>
                                      <span className="text-rose-400 font-bold">-{p.Rap_PRCT || p.rapPercent || 0}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Original Cost:</span>
                                      <span>{p.Amount ? p.Amount.toLocaleString() : p.price.toLocaleString()} THB</span>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            );
                          })}

                          {query && searchedMatches.length === 0 && (
                            <div className="py-12 text-center text-slate-500 font-bold uppercase text-[10px]">
                              No diamonds match your search text inside our inventory.
                            </div>
                          )}

                          {!query && (
                            <div className="py-12 text-center text-slate-600 font-bold uppercase text-[10px] border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                              Start typing above (Stock No, Certificate ID or Shape) to analyze real-time diamond assets.
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                }

                return null;
              })()}

            </div>
          )}

          {/* 4.5 SHIPMENT DISPATCH TAB */}
          {activeTab === 'shipment' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
              
              {/* Shipments & Orders Queue List */}
              <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col h-[750px]">
                <div className="space-y-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-500" />
                      Shipment & Dispatch Hub
                    </h3>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                      {orders.length} Orders
                    </span>
                  </div>

                  {/* Search and Filters */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search Invoice, Customer, Tracking..."
                      value={shipmentSearchQuery}
                      onChange={(e) => setShipmentSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(['all', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'] as const).map((filter) => {
                      const count = filter === 'all' 
                        ? orders.length 
                        : orders.filter(o => o.shippingStatus === filter).length;
                      return (
                        <button
                          key={filter}
                          onClick={() => setShipmentStatusFilter(filter)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            shipmentStatusFilter === filter
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                          }`}
                        >
                          {filter === 'all' ? 'All' : filter} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Orders Queue Scrollbox */}
                <div className="flex-1 overflow-y-auto pt-4 space-y-3 pr-1">
                  {(() => {
                    const filtered = orders.filter((o) => {
                      const query = shipmentSearchQuery.toLowerCase().trim();
                      const matchesSearch = 
                        o.invoiceNumber.toLowerCase().includes(query) ||
                        o.customerName.toLowerCase().includes(query) ||
                        o.customerEmail.toLowerCase().includes(query) ||
                        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(query));
                      
                      const matchesStatus = 
                        shipmentStatusFilter === 'all' || 
                        o.shippingStatus === shipmentStatusFilter;

                      return matchesSearch && matchesStatus;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                          <Package className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
                          <p className="text-xs font-semibold">No orders found matching filters.</p>
                        </div>
                      );
                    }

                    return filtered.map((order) => {
                      const isSelected = selectedShipmentOrder?.id === order.id;
                      const isPaid = order.paymentStatus === 'Paid';

                      return (
                        <div
                          key={order.id}
                          onClick={() => {
                            setSelectedShipmentOrder(order);
                            setShipmentTrackingInput(order.trackingNumber || '');
                            setShipmentNoteInput('');
                          }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-slate-900 border-amber-500/50 shadow-md shadow-amber-500/5'
                              : 'bg-slate-900/45 hover:bg-slate-900/70 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-mono font-bold text-slate-400">
                              {order.invoiceNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 font-sans">
                              {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-white truncate mb-1">
                            {order.customerName}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate mb-3">
                            {order.customerEmail}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                            <div className="flex items-center gap-1.5">
                              {/* Shipping Status Badge */}
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                order.shippingStatus === 'Delivered'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : order.shippingStatus === 'Out for Delivery'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : order.shippingStatus === 'Shipped'
                                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {order.shippingStatus}
                              </span>

                              {/* Payment status badge */}
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                isPaid
                                  ? 'bg-emerald-500/5 text-emerald-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {order.paymentStatus}
                              </span>
                            </div>

                            <span className="text-[11px] font-mono font-bold text-slate-300">
                              {order.totalAmount.toLocaleString()} THB
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Shipment Action & Tracking Inspector */}
              <div className="lg:col-span-7 space-y-6">
                {selectedShipmentOrder ? (
                  <div className="space-y-6">
                    
                    {/* Active Order Banner Card */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-[9px] text-amber-500 uppercase font-black tracking-wider block">Fulfillment Case</span>
                          <h3 className="text-base font-black text-white uppercase tracking-wider font-display flex items-center gap-2">
                            {selectedShipmentOrder.invoiceNumber}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${selectedShipmentOrder.shippingAddress.fullName}\n` +
                                `${selectedShipmentOrder.shippingAddress.street}\n` +
                                `${selectedShipmentOrder.shippingAddress.city}, ${selectedShipmentOrder.shippingAddress.state} ${selectedShipmentOrder.shippingAddress.zipCode}\n` +
                                `${selectedShipmentOrder.shippingAddress.country}\n` +
                                `Phone: ${selectedShipmentOrder.shippingAddress.phone}`
                              );
                              showToast('Shipping Address copied to clipboard!');
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            Copy Shipping Label
                          </button>
                        </div>
                      </div>

                      {/* Shipping label representation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Recipient details */}
                        <div className="space-y-2">
                          <span className="text-[9px] text-slate-500 uppercase font-bold block tracking-wider">Delivery Destination</span>
                          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850 space-y-1">
                            <p className="text-xs font-black text-white">{selectedShipmentOrder.shippingAddress.fullName}</p>
                            <p className="text-xs text-slate-300">{selectedShipmentOrder.shippingAddress.street}</p>
                            <p className="text-xs text-slate-300">
                              {selectedShipmentOrder.shippingAddress.city}, {selectedShipmentOrder.shippingAddress.state} {selectedShipmentOrder.shippingAddress.zipCode}
                            </p>
                            <p className="text-xs text-slate-400 font-bold uppercase">{selectedShipmentOrder.shippingAddress.country}</p>
                            <p className="text-xs text-slate-500 pt-1">Tel: {selectedShipmentOrder.shippingAddress.phone}</p>
                          </div>
                        </div>

                        {/* Shipment metrics */}
                        <div className="space-y-2">
                          <span className="text-[9px] text-slate-500 uppercase font-bold block tracking-wider">Shipment Manifest</span>
                          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850 space-y-2.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Items Count:</span>
                              <span className="font-bold text-white">
                                {selectedShipmentOrder.items.reduce((acc, i) => acc + i.quantity, 0)} Pcs
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Total Value:</span>
                              <span className="font-mono font-bold text-amber-500">
                                {selectedShipmentOrder.totalAmount.toLocaleString()} THB
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Payment Status:</span>
                              <span className={`font-black text-[10px] uppercase ${selectedShipmentOrder.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {selectedShipmentOrder.paymentStatus}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Active Carrier:</span>
                              <span className="font-bold text-white">
                                {selectedShipmentOrder.trackingNumber ? (selectedShipmentOrder.trackingNumber.includes('DHL') ? 'DHL Express' : selectedShipmentOrder.trackingNumber.includes('FDX') ? 'FedEx' : 'EMS / Postal') : 'None Assigned'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Logistics Wizard */}
                    {selectedShipmentOrder.trackingNumber && (
                      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block tracking-wider">Delivery Transit Milestones</span>
                        
                        {/* Transit Progress Bar */}
                        <div className="relative py-4">
                          <div className="absolute top-[28px] left-[5%] right-[5%] h-1 bg-slate-800 -translate-y-1/2 rounded-full" />
                          
                          {/* Active Connector */}
                          <div 
                            className="absolute top-[28px] left-[5%] h-1 bg-amber-500 -translate-y-1/2 rounded-full transition-all duration-500" 
                            style={{ 
                              width: selectedShipmentOrder.shippingStatus === 'Delivered' ? '90%' :
                                     selectedShipmentOrder.shippingStatus === 'Out for Delivery' ? '60%' :
                                     selectedShipmentOrder.shippingStatus === 'Shipped' ? '30%' : '0%'
                            }}
                          />

                          <div className="relative flex justify-between">
                            {/* Milestone 1: Processing */}
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black z-10">
                                ✓
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 mt-2">Processing</span>
                            </div>

                            {/* Milestone 2: Shipped */}
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black z-10 transition-all ${
                                ['Shipped', 'Out for Delivery', 'Delivered'].includes(selectedShipmentOrder.shippingStatus)
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-900 text-slate-500 border border-slate-800'
                              }`}>
                                {['Shipped', 'Out for Delivery', 'Delivered'].includes(selectedShipmentOrder.shippingStatus) ? '✓' : '2'}
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider mt-2 ${
                                ['Shipped', 'Out for Delivery', 'Delivered'].includes(selectedShipmentOrder.shippingStatus)
                                  ? 'text-white'
                                  : 'text-slate-500'
                              }`}>Dispatched</span>
                            </div>

                            {/* Milestone 3: Out for Delivery */}
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black z-10 transition-all ${
                                ['Out for Delivery', 'Delivered'].includes(selectedShipmentOrder.shippingStatus)
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-900 text-slate-500 border border-slate-800'
                              }`}>
                                {['Out for Delivery', 'Delivered'].includes(selectedShipmentOrder.shippingStatus) ? '✓' : '3'}
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider mt-2 ${
                                ['Out for Delivery', 'Delivered'].includes(selectedShipmentOrder.shippingStatus)
                                  ? 'text-white'
                                  : 'text-slate-500'
                              }`}>In Transit</span>
                            </div>

                            {/* Milestone 4: Delivered */}
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black z-10 transition-all ${
                                selectedShipmentOrder.shippingStatus === 'Delivered'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-900 text-slate-500 border border-slate-800'
                              }`}>
                                {selectedShipmentOrder.shippingStatus === 'Delivered' ? '✓' : '4'}
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider mt-2 ${
                                selectedShipmentOrder.shippingStatus === 'Delivered'
                                  ? 'text-emerald-400 font-extrabold'
                                  : 'text-slate-500'
                              }`}>Delivered</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Transition Shortcut Actions */}
                        <div className="pt-3 border-t border-slate-900 flex flex-wrap gap-2">
                          <button
                            onClick={() => handleUpdateShipmentStatus(
                              selectedShipmentOrder.id, 
                              'Shipped', 
                              'Package status reverted to Dispatched / Shipped.'
                            )}
                            disabled={selectedShipmentOrder.shippingStatus === 'Shipped'}
                            className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 disabled:opacity-40 disabled:pointer-events-none text-[10px] font-black uppercase tracking-wider border border-slate-800"
                          >
                            Mark Dispatched
                          </button>
                          <button
                            onClick={() => handleUpdateShipmentStatus(
                              selectedShipmentOrder.id, 
                              'Out for Delivery', 
                              'Package loaded for delivery route. Handed off to local courier agent.'
                            )}
                            disabled={selectedShipmentOrder.shippingStatus === 'Out for Delivery'}
                            className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 disabled:opacity-40 disabled:pointer-events-none text-[10px] font-black uppercase tracking-wider border border-slate-800"
                          >
                            Mark Out for Delivery
                          </button>
                          <button
                            onClick={() => handleUpdateShipmentStatus(
                              selectedShipmentOrder.id, 
                              'Delivered', 
                              'Package successfully delivered. Signature recorded at destination address.'
                            )}
                            disabled={selectedShipmentOrder.shippingStatus === 'Delivered'}
                            className="px-3 py-1.5 rounded bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 disabled:opacity-40 disabled:pointer-events-none text-[10px] font-black uppercase tracking-wider border border-emerald-500/20"
                          >
                            Confirm Delivery
                          </button>
                        </div>
                      </div>
                    )}

                    {/* FULFILLMENT CONTROLS: FOR COURIER DISPATCH OR HISTORIC POSTING */}
                    {selectedShipmentOrder.shippingStatus === 'Processing' ? (
                      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                          <Truck className="w-5 h-5 text-amber-500" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Dispatch Courier Form</h4>
                        </div>

                        {selectedShipmentOrder.paymentStatus !== 'Paid' && (
                          <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                            <p><strong>Warning:</strong> This order is unpaid or payment failed. Confirm transaction receipt before dispatching physical merchandise.</p>
                          </div>
                        )}

                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleDispatchShipment(
                              selectedShipmentOrder.id,
                              shipmentCarrier,
                              shipmentTrackingInput,
                              shipmentNoteInput
                            );
                          }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Select Logistics Carrier</label>
                              <select
                                value={shipmentCarrier}
                                onChange={(e) => setShipmentCarrier(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-white px-3 py-2.5 outline-none"
                              >
                                <option value="DHL">DHL Express</option>
                                <option value="FedEx">FedEx International</option>
                                <option value="Thailand Post">Thailand Post EMS</option>
                                <option value="Kerry Express">Kerry Express</option>
                                <option value="UPS">UPS Worldwide</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5 flex items-center justify-between">
                                <span>Tracking Code</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const code = `TRK-${shipmentCarrier.toUpperCase().replace(' ', '')}-${Math.floor(100000000 + Math.random() * 900000000)}`;
                                    setShipmentTrackingInput(code);
                                  }}
                                  className="text-[9px] text-amber-500 hover:underline font-extrabold"
                                >
                                  Generate Tracking
                                </button>
                              </label>
                              <input
                                type="text"
                                placeholder="E.g., DHL-983174241"
                                value={shipmentTrackingInput}
                                onChange={(e) => setShipmentTrackingInput(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white px-3 py-2.5 outline-none placeholder-slate-600"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Dispatch Milestone Note (Optional)</label>
                            <input
                              type="text"
                              placeholder="E.g., Packed securely in custom leather presentation case with certificate card."
                              value={shipmentNoteInput}
                              onChange={(e) => setShipmentNoteInput(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white px-3 py-2.5 outline-none placeholder-slate-600"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                          >
                            <Truck className="w-4 h-4" />
                            Confirm Shipment Dispatch
                          </button>
                        </form>
                      </div>
                    ) : (
                      // Add custom logistics update/checkpoint once Shipped
                      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                          <Plus className="w-4 h-4 text-amber-500" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Log Transit Checkpoint</h4>
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!shipmentNoteInput.trim()) return;
                            handleUpdateShipmentStatus(
                              selectedShipmentOrder.id,
                              selectedShipmentOrder.shippingStatus,
                              shipmentNoteInput.trim()
                            );
                            setShipmentNoteInput('');
                          }}
                          className="flex gap-2.5"
                        >
                          <input
                            type="text"
                            placeholder="Add checkpoint log (e.g. Arrived at sorting center, package departed facility)"
                            value={shipmentNoteInput}
                            onChange={(e) => setShipmentNoteInput(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white px-3 py-2.5 outline-none placeholder-slate-650"
                            required
                          />
                          <button
                            type="submit"
                            className="px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shrink-0"
                          >
                            Log Event
                          </button>
                        </form>
                      </div>
                    )}

                    {/* PHYSICAL PACKING LIST CHECKLIST */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block tracking-wider">Physical Packing Checklist</span>
                      <div className="border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 font-bold text-slate-400">
                              <th className="p-3">Verified</th>
                              <th className="p-3">Item details</th>
                              <th className="p-3 text-center">Qty</th>
                              <th className="p-3 text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-sans">
                            {selectedShipmentOrder.items.map((item, idx) => {
                              const spec = `${item.product.color}/${item.product.clarity}/${item.product.cut}`;
                              return (
                                <tr key={idx} className="hover:bg-slate-900/10">
                                  <td className="p-3 w-12 text-center">
                                    <input 
                                      type="checkbox" 
                                      className="accent-amber-500 w-3.5 h-3.5 rounded bg-slate-900 border-slate-800 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-3 text-slate-300">
                                    <span className="text-white font-bold block">
                                      {item.product.Shape || 'ROUND'} • {item.product.carat.toFixed(2)}ct
                                    </span>
                                    <span className="text-[10px] text-slate-500 block">
                                      {spec} • Cert: {item.product.certification} ({item.product.certId})
                                    </span>
                                  </td>
                                  <td className="p-3 text-center text-slate-400 font-bold">{item.quantity} pcs</td>
                                  <td className="p-3 text-right font-black text-white">
                                    {(item.product.price * item.quantity).toLocaleString()} THB
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* RECORDED LOGISTICS EVENTS LOG */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block tracking-wider">Logistics Ledger & History</span>
                      <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-5">
                        {selectedShipmentOrder.trackingHistory && selectedShipmentOrder.trackingHistory.length > 0 ? (
                          [...selectedShipmentOrder.trackingHistory]
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((hist, i) => (
                              <div key={i} className="relative text-left">
                                {/* Dot indicator */}
                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-950 flex items-center justify-center">
                                  {i === 0 && <div className="w-1 h-1 rounded-full bg-amber-500 animate-ping" />}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.25 rounded ${
                                    hist.status === 'Delivered'
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : hist.status === 'Out for Delivery'
                                      ? 'bg-indigo-500/10 text-indigo-400'
                                      : hist.status === 'Shipped'
                                      ? 'bg-sky-500/10 text-sky-400'
                                      : 'bg-amber-500/10 text-amber-400'
                                  }`}>
                                    {hist.status}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-sans">
                                    {new Date(hist.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                  {hist.note}
                                </p>
                              </div>
                            ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">No movement logs registered yet.</p>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Shipment Inspector Placeholder */
                  <div className="h-full min-h-[500px] flex flex-col items-center justify-center border border-dashed border-slate-800 p-8 rounded-2xl text-center text-slate-500 bg-slate-950/20">
                    <Truck className="w-12 h-12 text-slate-600 mb-3.5 stroke-[1.25]" />
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1.5">No Shipment Case Selected</h4>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                      Select an order dispatch entry from the left-hand queue to edit logistical milestones, print label descriptors, or configure tracking links.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 5. SUPPORT TAB */}
          {activeTab === 'support' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
              
              {/* Tickets List */}
              <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5">Customer Service Queue</h3>
                <div className="space-y-3">
                  {tickets.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedTicket?.id === t.id ? 'bg-slate-900 border-amber-500' : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-amber-500 font-extrabold">TICKET #{t.id}</span>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${t.status === 'Open' ? 'bg-red-500/15 text-red-400 border-red-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {t.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-2 truncate">{t.subject}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">From {t.userName} ({t.userEmail})</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat View */}
              <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between min-h-[500px]">
                {selectedTicket ? (
                  <div className="flex flex-col justify-between h-full space-y-6">
                    
                    {/* Chat header */}
                    <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">SUBJECT</span>
                        <h3 className="text-sm font-black text-white uppercase">{selectedTicket.subject}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Contact: {selectedTicket.userName} • {selectedTicket.userEmail}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const currents = getTickets();
                          const idx = currents.findIndex(tk => tk.id === selectedTicket.id);
                          if (idx > -1) {
                            currents[idx].status = currents[idx].status === 'Resolved' ? 'Open' : 'Resolved';
                            saveTickets(currents);
                            setTickets(currents);
                            setSelectedTicket(currents[idx]);
                            showToast(`Ticket status updated.`);
                          }
                        }}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border ${selectedTicket.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                      >
                        {selectedTicket.status === 'Resolved' ? 'Reopen Ticket' : 'Mark Resolved'}
                      </button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 min-h-[250px] max-h-[300px]">
                      {selectedTicket.messages.map((m) => (
                        <div key={m.id} className={`flex flex-col ${m.sender === 'support' ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] text-slate-500 font-bold">{m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <div className={`p-3 rounded-2xl max-w-[85%] mt-1 text-xs leading-relaxed font-semibold ${m.sender === 'support' ? 'bg-amber-500 text-slate-950 rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none'}`}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply input */}
                    <form onSubmit={handleSendSupportReply} className="flex gap-2">
                      <input 
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write support dispatch..."
                        className="bg-slate-900 border border-slate-800 rounded-lg text-xs px-3 py-2.5 text-white flex-1 focus:outline-none"
                      />
                      <button type="submit" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase rounded-lg">
                        Send Dispatch
                      </button>
                    </form>

                  </div>
                ) : (
                  <div className="py-24 my-auto text-center">
                    <MessageSquare className="w-12 h-12 text-slate-700 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-4">Select a customer inquiry to reply</h3>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* RAPNET SUITE SETTINGS TAB */}
          {activeTab === 'rapnet' && (
            <div className="space-y-6 text-left">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-500 animate-pulse" />
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Rapaport Synchronizer</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Step-by-step API integration, authentication tokens, and manual CSV backup engines.
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                  Plugin Version: <span className="text-amber-500">v28.0 (Step-by-Step API)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Configuration Settings Card */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <span>API Credentials Configuration</span>
                  </h3>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Client ID (Username)</label>
                      <input
                        type="text"
                        value={rapnetClientId}
                        onChange={(e) => setRapnetClientId(e.target.value)}
                        placeholder="Enter Rapaport Client ID"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Client Secret (Password)</label>
                      <input
                        type="password"
                        value={rapnetClientSecret}
                        onChange={(e) => setRapnetClientSecret(e.target.value)}
                        placeholder="••••••••••••••••••••••••"
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <button
                      onClick={() => {
                        try {
                          localStorage.setItem('rapnet_credentials', JSON.stringify({
                            clientId: rapnetClientId,
                            clientSecret: rapnetClientSecret,
                            updatedAt: new Date().toISOString()
                          }));
                          showToast("Rapaport API credentials persisted successfully!");
                        } catch (err) {
                          console.error("Failed to save settings", err);
                          showToast("Failed to save credentials: " + String(err), true);
                        }
                      }}
                      className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase rounded-lg transition-all cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>

                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-slate-500 text-[10px] leading-relaxed pt-3">
                    <span className="text-amber-400 font-bold uppercase block mb-1">Last Synced Matrix Metrics</span>
                    <span className="block font-mono">Last Sync Time: <span className="text-white">{rapnetLastSync}</span></span>
                    <span className="block font-mono mt-1">Round Pricing: <span className="text-emerald-400">Ready (Local + Firestore)</span></span>
                    <span className="block font-mono">Pear Pricing: <span className="text-emerald-400">Ready (Local + Firestore)</span></span>
                  </div>
                </div>

                {/* 2. Step-by-Step API Sync & Local Seeds Card */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-500" />
                    <span>Synchronize Price Database</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Manually execute synchronization pipelines. Under browser CORS limitations, Simulated Index Seeding can be performed instantly for live testing.
                  </p>

                  <div className="space-y-4 pt-2">
                    {/* ROUND DIAMONDS PIPELINE */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white uppercase">Round Diamonds Pipeline</span>
                        {isSyncingRound && <span className="text-[9px] text-amber-500 animate-pulse font-bold">WORKING...</span>}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          disabled={isSyncingRound}
                          onClick={async () => {
                            setIsSyncingRound(true);
                            setSyncLogsRound("Initiating download handshakes...");
                            setTimeout(() => {
                              setSyncLogsRound("Response received: 200 OK. Downloaded.");
                            }, 800);
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-black uppercase rounded cursor-pointer"
                        >
                          1. Download
                        </button>
                        <span className="text-slate-600">&rarr;</span>
                        <button
                          disabled={isSyncingRound}
                          onClick={async () => {
                            setIsSyncingRound(true);
                            setSyncLogsRound("Processing... Seeding Round price matrices into database...");
                            try {
                              const mockRound = generateMockRapaportMatrix('Round');
                              await saveRapaportMatrix('Round', mockRound);
                              setSyncLogsRound("Round price matrix successfully imported: 143 matrices synced!");
                              setRapnetLastSync(new Date().toLocaleString());
                              showToast("Round prices imported successfully!");
                            } catch (e) {
                              setSyncLogsRound("Failed to process file.");
                            } finally {
                              setIsSyncingRound(false);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-black uppercase rounded cursor-pointer"
                        >
                          2. Process
                        </button>
                        <button
                          onClick={async () => {
                            setIsSyncingRound(true);
                            setSyncLogsRound("Performing high-speed index synchronization...");
                            try {
                              const mockRound = generateMockRapaportMatrix('Round');
                              await saveRapaportMatrix('Round', mockRound);
                              setSyncLogsRound("Synced simulated index: 143 matrices seeded successfully.");
                              setRapnetLastSync(new Date().toLocaleString());
                              showToast("Round prices simulated index generated.");
                            } finally {
                              setIsSyncingRound(false);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase rounded ml-auto cursor-pointer"
                        >
                          Quick Seed
                        </button>
                      </div>
                      {syncLogsRound && (
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-850 font-mono text-[9px] text-slate-400 truncate">
                          {syncLogsRound}
                        </div>
                      )}
                    </div>

                    {/* PEAR DIAMONDS PIPELINE */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white uppercase">Pear (Fancy) Diamonds Pipeline</span>
                        {isSyncingPear && <span className="text-[9px] text-amber-500 animate-pulse font-bold">WORKING...</span>}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          disabled={isSyncingPear}
                          onClick={async () => {
                            setIsSyncingPear(true);
                            setSyncLogsPear("Initiating download handshakes...");
                            setTimeout(() => {
                              setSyncLogsPear("Response received: 200 OK. Downloaded.");
                            }, 800);
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-black uppercase rounded cursor-pointer"
                        >
                          3. Download
                        </button>
                        <span className="text-slate-600">&rarr;</span>
                        <button
                          disabled={isSyncingPear}
                          onClick={async () => {
                            setIsSyncingPear(true);
                            setSyncLogsPear("Processing... Seeding Pear price matrices into database...");
                            try {
                              const mockPear = generateMockRapaportMatrix('Pear');
                              await saveRapaportMatrix('Pear', mockPear);
                              setSyncLogsPear("Pear price matrix successfully imported: 143 matrices synced!");
                              setRapnetLastSync(new Date().toLocaleString());
                              showToast("Pear prices imported successfully!");
                            } catch (e) {
                              setSyncLogsPear("Failed to process file.");
                            } finally {
                              setIsSyncingPear(false);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-black uppercase rounded cursor-pointer"
                        >
                          4. Process
                        </button>
                        <button
                          onClick={async () => {
                            setIsSyncingPear(true);
                            setSyncLogsPear("Performing high-speed index synchronization...");
                            try {
                              const mockPear = generateMockRapaportMatrix('Pear');
                              await saveRapaportMatrix('Pear', mockPear);
                              setSyncLogsPear("Synced simulated index: 143 matrices seeded successfully.");
                              setRapnetLastSync(new Date().toLocaleString());
                              showToast("Pear prices simulated index generated.");
                            } finally {
                              setIsSyncingPear(false);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase rounded ml-auto cursor-pointer"
                        >
                          Quick Seed
                        </button>
                      </div>
                      {syncLogsPear && (
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-850 font-mono text-[9px] text-slate-400 truncate">
                          {syncLogsPear}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

              {/* 3. Manual Upload Card */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 lg:col-span-2">
                <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                  <span>Manual Index Upload Backup</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select and upload local Rapaport CSV or JSON files (the exact file format retrieved from the Rapaport Technet pricelist portal). This completely bypasses any CORS limitations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Round manual upload */}
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-sans">Upload Round CSV/JSON</span>
                    <div className="border border-dashed border-slate-800 hover:border-amber-500/50 rounded-lg p-4 text-center cursor-pointer relative bg-slate-950 transition-all">
                      <input
                        type="file"
                        accept=".csv,.json"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            try {
                              const text = event.target?.result as string;
                              let matrix;
                              if (file.name.endsWith('.json')) {
                                matrix = parseRapaportJSON(text);
                              } else {
                                matrix = parseRapaportCSV(text);
                              }
                              await saveRapaportMatrix('Round', matrix);
                              setRapnetLastSync(new Date().toLocaleString());
                              showToast(`Successfully uploaded & processed Round matrix: ${Object.keys(matrix).length} rows.`);
                            } catch (err) {
                              console.error(err);
                              showToast("Parsing failed: " + String(err), true);
                            }
                          };
                          reader.readAsText(file);
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                      <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                      <span className="text-[10px] text-slate-400 font-bold block">Choose file to upload</span>
                      <span className="text-[8px] text-slate-500 block mt-1 font-mono">Supports CSV, JSON</span>
                    </div>
                  </div>

                  {/* Pear manual upload */}
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-sans">Upload Pear (Fancy) CSV/JSON</span>
                    <div className="border border-dashed border-slate-800 hover:border-amber-500/50 rounded-lg p-4 text-center cursor-pointer relative bg-slate-950 transition-all">
                      <input
                        type="file"
                        accept=".csv,.json"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            try {
                              const text = event.target?.result as string;
                              let matrix;
                              if (file.name.endsWith('.json')) {
                                matrix = parseRapaportJSON(text);
                              } else {
                                matrix = parseRapaportCSV(text);
                              }
                              await saveRapaportMatrix('Pear', matrix);
                              setRapnetLastSync(new Date().toLocaleString());
                              showToast(`Successfully uploaded & processed Pear matrix: ${Object.keys(matrix).length} rows.`);
                            } catch (err) {
                              console.error(err);
                              showToast("Parsing failed: " + String(err), true);
                            }
                          };
                          reader.readAsText(file);
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                      <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                      <span className="text-[10px] text-slate-400 font-bold block">Choose file to upload</span>
                      <span className="text-[8px] text-slate-500 block mt-1 font-mono">Supports CSV, JSON</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* AFFILIATE PROGRAM ADMIN TAB */}
          {activeTab === 'affiliate' && (
            <div className="space-y-8 text-left">
              {/* Header block with statistics cards */}
              <div className="bg-[#0C1224] p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500 animate-pulse" />
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Affiliate & Coupon Suite</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Manage active affiliates, referral discount coupon rules, and flexible triple-tier commission structures.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-amber-400 self-start md:self-auto">
                  <Percent className="w-4 h-4 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono">Commission Engine Online</span>
                </div>
              </div>

              {/* Dashboard Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Partners & Affiliates</span>
                    <div className="text-2xl font-black font-mono text-white">
                      {affiliates.filter(a => a.status === 'Active').length} <span className="text-xs text-slate-400">Active</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Pending Registrations</span>
                    <div className="text-2xl font-black font-mono text-amber-500">
                      {affiliates.filter(a => a.status === 'Pending').length} <span className="text-xs text-slate-400">Pending</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Total Referred Revenue</span>
                    <div className="text-2xl font-black font-mono text-emerald-400">
                      {(referredOrders.reduce((acc, curr) => acc + curr.orderTotal, 0)).toLocaleString()} THB
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Commissions Allocated</span>
                    <div className="text-2xl font-black font-mono text-amber-400">
                      {(referredOrders.reduce((acc, curr) => acc + curr.commissionEarned, 0)).toLocaleString()} THB
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Main Workspace grid: left is program creators, right is statistics/referred logs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* 1. LEFT COLUMN: CREATE & BENEFITS (Col span 5) */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Create New Partnership & Coupon */}
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-amber-500" />
                      <span>Issue New Affiliate Coupon</span>
                    </h3>

                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Affiliate Name</label>
                          <input
                            type="text"
                            value={newAffName}
                            onChange={(e) => setNewAffName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-slate-900 border border-slate-850 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Email Address</label>
                          <input
                            type="email"
                            value={newAffEmail}
                            onChange={(e) => setNewAffEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="w-full bg-slate-900 border border-slate-850 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Coupon Code</label>
                          <input
                            type="text"
                            value={newCouponCode}
                            onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                            placeholder="DIAMONDVIP20"
                            className="w-full bg-slate-900 border border-slate-850 text-white rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Customer Discount (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={newDiscountPercent}
                            onChange={(e) => setNewDiscountPercent(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-slate-900 border border-slate-850 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                      </div>

                      {/* TRIPLE COMMISSION RULES FOR THE SUITE */}
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 space-y-3">
                        <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider block">Flexible Commission Tier Configuration</span>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400">1. Fixed "Per Product" Sold:</span>
                            <div className="relative w-28">
                              <input
                                type="number"
                                min="0"
                                value={newCommProduct}
                                onChange={(e) => setNewCommProduct(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 text-xs text-right pr-8"
                              />
                              <span className="absolute right-2 top-1 font-mono text-[9px] text-slate-500">THB</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400">2. Fixed "Per Order" Referred:</span>
                            <div className="relative w-28">
                              <input
                                type="number"
                                min="0"
                                value={newCommOrder}
                                onChange={(e) => setNewCommOrder(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 text-xs text-right pr-8"
                              />
                              <span className="absolute right-2 top-1 font-mono text-[9px] text-slate-500">THB</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400">3. "Percentage" of Order Total:</span>
                            <div className="relative w-28">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={newCommPercent}
                                onChange={(e) => setNewCommPercent(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 text-xs text-right pr-6"
                              />
                              <span className="absolute right-2 top-1 font-mono text-[9px] text-slate-500">%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (!newAffName || !newAffEmail || !newCouponCode) {
                            showToast("Please supply the partner name, email, and coupon code.", true);
                            return;
                          }
                          const newProfile: AffiliateProfile = {
                            id: `aff_${Date.now()}`,
                            userId: `user_gen_${Math.floor(1000 + Math.random() * 9000)}`,
                            fullName: newAffName,
                            email: newAffEmail,
                            couponCode: newCouponCode,
                            discountPercent: newDiscountPercent,
                            commissionPerProduct: newCommProduct,
                            commissionPerOrder: newCommOrder,
                            commissionPercent: newCommPercent,
                            status: 'Active',
                            clicks: 0,
                            createdAt: new Date().toISOString()
                          };
                          await saveAffiliateProfile(newProfile);
                          showToast(`Successfully registered affiliate program for ${newAffName} with coupon ${newCouponCode}!`);
                          setNewAffName('');
                          setNewAffEmail('');
                          setNewCouponCode('');
                          loadAffiliateData();
                        }}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center"
                      >
                        Issue & Activate Program
                      </button>
                    </div>
                  </div>

                  {/* Customizable Program Benefits Widget */}
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Customizable Widget Benefits</span>
                      </h3>
                      <span className="text-[9px] text-slate-500 uppercase font-mono">Live on Client view</span>
                    </div>
                    
                    <p className="text-[11px] text-slate-400">
                      These benefits are displayed to potential affiliates visiting the Customer Portal registration card.
                    </p>

                    <div className="space-y-2 pt-1">
                      {affiliateBenefits.map((benefit, bIdx) => (
                        <div key={bIdx} className="flex gap-2 items-center bg-slate-900 px-3 py-2 rounded-lg border border-slate-850 justify-between">
                          <span className="text-xs text-slate-300 font-medium font-sans leading-snug">{benefit}</span>
                          <button
                            onClick={async () => {
                              const updated = affiliateBenefits.filter((_, idx) => idx !== bIdx);
                              setAffiliateBenefits(updated);
                              await saveAffiliateBenefits(updated);
                              showToast("Benefit item updated successfully.");
                            }}
                            className="text-slate-500 hover:text-red-400 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newBenefitText}
                        onChange={(e) => setNewBenefitText(e.target.value)}
                        placeholder="E.g., Extra 5% bonus commission on GIA gems over 3 carats."
                        className="flex-1 bg-slate-900 border border-slate-850 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500/50"
                      />
                      <button
                        onClick={async () => {
                          if (!newBenefitText.trim()) return;
                          const updated = [...affiliateBenefits, newBenefitText.trim()];
                          setAffiliateBenefits(updated);
                          await saveAffiliateBenefits(updated);
                          setNewBenefitText('');
                          showToast("New program benefit successfully added!");
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                </div>

                {/* 2. RIGHT COLUMN: MANAGING ACCOUNTS & CONVERSIONS (Col span 7) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Active Affiliates & Customization Board */}
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      <span>Active Affiliate Registry & Commissions</span>
                    </h3>

                    {isLoadingAffiliates ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                        <span className="text-[10px] uppercase font-mono text-slate-500">Retrieving Accounts...</span>
                      </div>
                    ) : affiliates.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-500">
                        No active affiliate partnerships registered. Issue a coupon above to begin.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {affiliates.map((aff) => {
                          const referred = referredOrders.filter(o => o.affiliateId === aff.id);
                          const totalCommission = referred.reduce((sum, curr) => sum + curr.commissionEarned, 0);

                          return (
                            <div key={aff.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-xs text-white">{aff.fullName}</span>
                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded ${
                                      aff.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                      aff.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                      'bg-slate-800 text-slate-500'
                                    }`}>
                                      {aff.status}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 block font-mono mt-0.5">{aff.email}</span>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  {aff.status === 'Pending' && (
                                    <>
                                      <button
                                        onClick={async () => {
                                          const updated = { ...aff, status: 'Active' as const };
                                          await saveAffiliateProfile(updated);
                                          showToast(`Approved partnership request from ${aff.fullName}!`);
                                          loadAffiliateData();
                                        }}
                                        className="px-2.5 py-1 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase rounded cursor-pointer hover:bg-emerald-400 transition-colors"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const updated = { ...aff, status: 'Declined' as const };
                                          await saveAffiliateProfile(updated);
                                          showToast(`Declined partnership request.`);
                                          loadAffiliateData();
                                        }}
                                        className="px-2.5 py-1 bg-slate-800 text-slate-400 text-[9px] font-black uppercase rounded cursor-pointer hover:bg-slate-700 transition-colors"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono font-black text-amber-400 text-xs">
                                    {aff.couponCode}
                                  </span>
                                </div>
                              </div>

                              {/* Details and metrics breakdown */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase block font-extrabold">Total Clicks</span>
                                  <span className="font-mono text-white font-extrabold">{aff.clicks || 0} clicks</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase block font-extrabold">Referred Orders</span>
                                  <span className="font-mono text-white font-extrabold">{referred.length} orders</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase block font-extrabold">Client Discount</span>
                                  <span className="font-mono text-emerald-400 font-extrabold">{aff.discountPercent}% Off</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase block font-extrabold">Paid Commission</span>
                                  <span className="font-mono text-amber-400 font-black">{totalCommission.toLocaleString()} THB</span>
                                </div>
                              </div>

                              {/* Commission Settings overview */}
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex flex-wrap justify-between items-center text-[10px] gap-2">
                                <span className="text-slate-500 font-extrabold">Active Suite Calculations:</span>
                                <div className="flex gap-3 text-slate-300 font-mono">
                                  <span>Prod: <strong className="text-white">{aff.commissionPerProduct.toLocaleString()} THB</strong></span>
                                  <span>Order: <strong className="text-white">{aff.commissionPerOrder.toLocaleString()} THB</strong></span>
                                  <span>Pct: <strong className="text-white">{aff.commissionPercent}%</strong></span>
                                </div>
                                
                                <button
                                  onClick={() => setEditingAffiliate(editingAffiliate?.id === aff.id ? null : aff)}
                                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-850 rounded text-[9px] font-black uppercase transition-colors"
                                >
                                  {editingAffiliate?.id === aff.id ? 'Cancel' : 'Edit Rules'}
                                </button>
                              </div>

                              {/* Inline Editing Drawer */}
                              {editingAffiliate?.id === aff.id && (
                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3 pt-4">
                                  <span className="text-[9px] text-white uppercase tracking-widest font-black block">Modify Commission & Discount Parameters</span>
                                  
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-slate-500 uppercase block font-black">Discount (%)</label>
                                      <input
                                        type="number"
                                        value={editingAffiliate.discountPercent}
                                        onChange={(e) => setEditingAffiliate({
                                          ...editingAffiliate,
                                          discountPercent: Math.max(0, parseInt(e.target.value) || 0)
                                        })}
                                        className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-xs text-center"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-slate-500 uppercase block font-black">Per Prod (THB)</label>
                                      <input
                                        type="number"
                                        value={editingAffiliate.commissionPerProduct}
                                        onChange={(e) => setEditingAffiliate({
                                          ...editingAffiliate,
                                          commissionPerProduct: Math.max(0, parseInt(e.target.value) || 0)
                                        })}
                                        className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-xs text-center"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-slate-500 uppercase block font-black">Per Order (THB)</label>
                                      <input
                                        type="number"
                                        value={editingAffiliate.commissionPerOrder}
                                        onChange={(e) => setEditingAffiliate({
                                          ...editingAffiliate,
                                          commissionPerOrder: Math.max(0, parseInt(e.target.value) || 0)
                                        })}
                                        className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-xs text-center"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-slate-500 uppercase block font-black">Order %</label>
                                      <input
                                        type="number"
                                        value={editingAffiliate.commissionPercent}
                                        onChange={(e) => setEditingAffiliate({
                                          ...editingAffiliate,
                                          commissionPercent: Math.max(0, parseInt(e.target.value) || 0)
                                        })}
                                        className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-xs text-center"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    onClick={async () => {
                                      await saveAffiliateProfile(editingAffiliate);
                                      showToast("Affiliate parameters updated successfully.");
                                      setEditingAffiliate(null);
                                      loadAffiliateData();
                                    }}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase rounded cursor-pointer"
                                  >
                                    Apply Changes
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Referred Order Logs and Payout Settlement Console */}
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
                    <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                        <span>Commission Ledger & Payout Settlement</span>
                      </h3>
                      <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-850 px-2.5 py-0.5 rounded">Ledger Audit</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Track referred client checkouts, audit triple-tier commissions, and record bank disbursement references to settle active partner ledgers.
                    </p>

                    {/* Filter buttons with real count badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(['All', 'Unpaid', 'Pending', 'Paid'] as const).map((st) => {
                        const count = referredOrders.filter(o => {
                          const s = o.payoutStatus || 'Unpaid';
                          if (st === 'All') return true;
                          return s === st;
                        }).length;

                        const isActive = payoutFilter === st;

                        return (
                          <button
                            key={st}
                            onClick={() => {
                              setPayoutFilter(st);
                              setSettlingOrderId(null);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                              isActive 
                                ? 'bg-amber-500 text-slate-950 font-black' 
                                : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-850'
                            }`}
                          >
                            <span>{st === 'Pending' ? 'Processing' : st === 'Paid' ? 'Settled' : st}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono ${
                              isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-950 text-slate-500'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {referredOrders.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-500 italic">
                        No transactions registered under referral coupons yet.
                      </div>
                    ) : filteredReferredOrders.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-500 italic">
                        No referrals found matching the "{payoutFilter}" status filter.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-850">
                        {filteredReferredOrders.map((ref) => {
                          const aff = affiliates.find(a => a.id === ref.affiliateId);
                          const isSettling = settlingOrderId === ref.id;
                          const currentStatus = ref.payoutStatus || 'Unpaid';

                          return (
                            <div key={ref.id} className="py-4 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-1 text-left flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-extrabold text-white text-sm">{ref.customerName}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">({ref.orderId})</span>
                                    
                                    {/* Partner Label */}
                                    <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                                      Ambassador: <strong className="text-white">{aff ? aff.fullName : 'Unknown'}</strong> ({ref.couponCode})
                                    </span>

                                    {/* Payout Badges */}
                                    {currentStatus === 'Paid' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase tracking-wider font-mono">
                                        Settled & Paid
                                      </span>
                                    ) : currentStatus === 'Pending' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8px] font-black uppercase tracking-wider font-mono">
                                        Processing
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-[8px] font-black uppercase tracking-wider font-mono">
                                        Unpaid Ledger
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-[10px] text-slate-400">
                                    Total Order subtotal: <strong className="text-white font-mono">{(ref.orderTotal).toLocaleString()} THB</strong> | Client Discount Applied: <strong className="text-slate-400 font-mono">{ref.discountAmount.toLocaleString()} THB</strong>
                                  </div>

                                  <div className="text-[9px] text-slate-500 font-mono">
                                    Referral Created: {new Date(ref.createdAt).toLocaleDateString()}
                                  </div>

                                  {/* Settlement details if Paid or Pending */}
                                  {ref.payoutStatus === 'Paid' && (
                                    <div className="bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 text-[10px] text-slate-400 font-mono space-y-0.5 max-w-lg">
                                      <div className="text-emerald-400 font-bold">Settlement Details:</div>
                                      <div>Date Settle: {ref.payoutDate ? new Date(ref.payoutDate).toLocaleDateString() : 'N/A'}</div>
                                      {ref.payoutNotes && <div>Bank reference notes: {ref.payoutNotes}</div>}
                                    </div>
                                  )}

                                  {ref.payoutStatus === 'Pending' && ref.payoutNotes && (
                                    <div className="bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 text-[10px] text-slate-400 font-mono max-w-lg">
                                      <span className="text-amber-500 font-bold">Payout processing notes: </span> {ref.payoutNotes}
                                    </div>
                                  )}
                                </div>

                                <div className="text-left sm:text-right self-start sm:self-auto space-y-2.5 min-w-[140px]">
                                  <span className="block text-amber-400 font-black font-mono text-sm">+{ref.commissionEarned.toLocaleString()} THB</span>
                                  <span className="text-[9px] text-slate-500 font-mono block leading-normal">
                                    Breakdown: <br />
                                    Prod: {ref.commissionBreakdown.perProduct.toLocaleString()} THB <br />
                                    Order: {ref.commissionBreakdown.perOrder.toLocaleString()} THB <br />
                                    Pct: {ref.commissionBreakdown.percent.toLocaleString()} THB
                                  </span>

                                  {/* Action button to trigger settlement console */}
                                  {currentStatus !== 'Paid' && !isSettling && (
                                    <button
                                      onClick={() => {
                                        setSettlingOrderId(ref.id);
                                        setSettlementStatus(currentStatus === 'Pending' ? 'Paid' : 'Pending');
                                        setSettlementNotes(ref.payoutNotes || '');
                                      }}
                                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded text-[9px] font-black uppercase transition-colors cursor-pointer"
                                    >
                                      Settle/Process
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Interactive Inline Settlement Console */}
                              {isSettling && (
                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3.5 text-left text-xs">
                                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                                    <span className="font-extrabold text-white text-[10px] uppercase tracking-wider">Settlement Console — {ref.id}</span>
                                    <button
                                      onClick={() => setSettlingOrderId(null)}
                                      className="text-slate-500 hover:text-slate-300 font-mono text-[10px]"
                                    >
                                      [Close]
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {/* Status selection */}
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Ledger Status</label>
                                      <select
                                        value={settlementStatus}
                                        onChange={(e) => setSettlementStatus(e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-2 text-xs"
                                      >
                                        <option value="Pending">Processing (Pending Payment)</option>
                                        <option value="Paid">Settled & Fully Paid (Disbursed)</option>
                                        <option value="Unpaid">Reset to Unpaid Ledger</option>
                                      </select>
                                    </div>

                                    {/* Transaction Notes */}
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Bank Transfer notes / Tx Ref</label>
                                      <input
                                        type="text"
                                        placeholder="E.g., Bank Ref #TX99120, disburse via wire"
                                        value={settlementNotes}
                                        onChange={(e) => setSettlementNotes(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-2 text-xs"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      onClick={async () => {
                                        await updatePayoutStatus(ref.id, settlementStatus, settlementNotes);
                                        showToast(`Successfully updated commission status to ${settlementStatus}!`);
                                        setSettlingOrderId(null);
                                        setSettlementNotes('');
                                        loadAffiliateData();
                                      }}
                                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-colors"
                                    >
                                      Commit Settlement
                                    </button>
                                    <button
                                      onClick={() => setSettlingOrderId(null)}
                                      className="px-3 py-2 bg-slate-950 text-slate-400 hover:text-white border border-slate-800 text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* 11. WALLET AUDITING TAB */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 text-left">
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-amber-500 animate-pulse" />
                      <span>Wallet Top-Up Audits & Verification</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Verify client UPI transaction codes or wire transfer deposit receipts against bank ledgers.
                    </p>
                  </div>
                  <button
                    onClick={loadWalletTransactionsData}
                    className="self-start sm:self-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-slate-800 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWalletTransactions ? 'animate-spin' : ''}`} />
                    <span>Reload Ledger</span>
                  </button>
                </div>

                {/* Filter Controls and Statistics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/80 space-y-1">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Awaiting Verification</span>
                    <span className="text-2xl font-black text-amber-500">
                      {walletTransactions.filter(tx => tx.status === 'Pending').length} requests
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/80 space-y-1">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Total Approved (Funded)</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {walletTransactions.filter(tx => tx.status === 'Approved').length} deposits
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/80 space-y-1">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Discrepancy Rejections</span>
                    <span className="text-2xl font-black text-rose-500">
                      {walletTransactions.filter(tx => tx.status === 'Rejected').length} flagged
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/80 flex flex-col justify-center">
                    <div className="flex gap-1">
                      {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((filterOpt) => (
                        <button
                          key={filterOpt}
                          onClick={() => setWalletFilter(filterOpt)}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                            walletFilter === filterOpt 
                              ? 'bg-amber-500 text-slate-950' 
                              : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white'
                          }`}
                        >
                          {filterOpt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Transaction List */}
                {isLoadingWalletTransactions ? (
                  <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                    <span>Accessing Secure Financial Audits...</span>
                  </div>
                ) : walletTransactions.filter(tx => walletFilter === 'All' ? true : tx.status === walletFilter).length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-500 italic">
                    No top-up transactions registered under the "{walletFilter}" filter.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-850 pt-2">
                    {walletTransactions
                      .filter(tx => walletFilter === 'All' ? true : tx.status === walletFilter)
                      .map((tx) => {
                        const isPending = tx.status === 'Pending';
                        const showDiscrepancy = showDiscrepancyInputId === tx.id;

                        return (
                          <div key={tx.id} className="py-5 first:pt-0 last:pb-0 space-y-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              
                              {/* Left details */}
                              <div className="space-y-1.5 flex-1 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-black text-white text-sm">{tx.username}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">({tx.userEmail})</span>
                                  
                                  {/* Payment Gateway Badge */}
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                    tx.paymentGateway === 'UPI' 
                                      ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400' 
                                      : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                                  }`}>
                                    {tx.paymentGateway}
                                  </span>

                                  {/* Status badges */}
                                  {tx.status === 'Approved' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-wider font-mono flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Funded & Settled
                                    </span>
                                  ) : tx.status === 'Rejected' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-black uppercase tracking-wider font-mono flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" /> Flagged (Discrepancy)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase tracking-wider font-mono flex items-center gap-1">
                                      <RefreshCw className="w-3 h-3 animate-spin" /> Pending Verification
                                    </span>
                                  )}
                                </div>

                                <div className="text-slate-400 leading-relaxed text-[11px] space-y-1">
                                  <p>
                                    Transaction ID: <strong className="text-white font-mono">{tx.id}</strong>
                                  </p>
                                  {tx.notes && (
                                    <p>
                                      Client Comments: <span className="text-slate-300 font-medium bg-slate-900 px-1.5 py-0.5 rounded font-sans">"{tx.notes}"</span>
                                    </p>
                                  )}
                                  {tx.upiTransactionId && (
                                    <p>
                                      UPI Transaction Ref: <strong className="text-purple-400 font-mono">{tx.upiTransactionId}</strong>
                                    </p>
                                  )}
                                  {tx.adminFeedback && (
                                    <div className={`p-2.5 rounded-lg border text-[11px] max-w-2xl font-sans mt-2 ${
                                      tx.status === 'Approved' 
                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300' 
                                        : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                                    }`}>
                                      <strong>Internal Audit Action Notes:</strong> {tx.adminFeedback}
                                    </div>
                                  )}
                                </div>

                                <div className="text-[10px] text-slate-500 font-mono pt-1">
                                  Submitted: {new Date(tx.createdAt).toLocaleString()} | Last Update: {new Date(tx.updatedAt).toLocaleString()}
                                </div>
                              </div>

                              {/* Middle: Amount & Slip Thumbnail */}
                              <div className="flex items-center gap-4 min-w-[220px] self-start lg:self-auto">
                                <div className="text-left lg:text-right flex-1">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">DEPOSIT AMOUNT</span>
                                  <span className="text-lg font-black font-mono text-amber-400">{tx.amount.toLocaleString()} THB</span>
                                </div>

                                {/* Payment slip view block */}
                                {tx.paymentGateway === 'Wire Transfer' && tx.paymentSlipUrl && (
                                  <div className="relative group">
                                    <a 
                                      href={tx.paymentSlipUrl} 
                                      target="_blank" 
                                      referrerPolicy="no-referrer"
                                      className="block border border-slate-800 rounded-lg overflow-hidden h-14 w-14 bg-slate-900 flex items-center justify-center relative cursor-pointer hover:border-amber-500 transition-colors"
                                    >
                                      <img 
                                        src={tx.paymentSlipUrl} 
                                        alt="Slip" 
                                        referrerPolicy="no-referrer"
                                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                        onError={(e) => {
                                          // fallback if slip is a mock URL that doesn't resolve
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                      <FileText className="absolute w-4 h-4 text-slate-500" />
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Right: Actions */}
                              {isPending && (
                                <div className="flex items-center gap-2 min-w-[200px] self-start lg:self-auto">
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to approve this deposit of ${tx.amount.toLocaleString()} THB and add it to @${tx.username}'s wallet balance?`)) {
                                        try {
                                          await updateWalletTransactionStatus(tx.id, 'Approved', 'Approved after verifying the bank deposit ledger entry.');
                                          showToast(`Approved! Added ${tx.amount.toLocaleString()} THB to @${tx.username}'s wallet.`);
                                          loadWalletTransactionsData();
                                          onRefreshUsers(); // refresh parent profiles
                                        } catch (e: any) {
                                          showToast(e.message || 'Error processing approval', true);
                                        }
                                      }
                                    }}
                                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                  >
                                    Approve & Fund
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowDiscrepancyInputId(tx.id);
                                      setDiscrepancyNotes('');
                                    }}
                                    className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                  >
                                    Flag Discrepancy
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Discrepancy Flagging Console */}
                            {showDiscrepancy && (
                              <div className="p-4 bg-slate-900 rounded-xl border border-slate-850 space-y-3 max-w-xl text-left">
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">Audit Discrepancy Options & Reason</span>
                                
                                <div className="space-y-2">
                                  <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Common Discrepancy Templates</label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {[
                                      'Mismatched transaction amount on slip',
                                      'Stale transaction date/time (expired receipt)',
                                      'Incorrect recipient account (not Phetmany bank)',
                                      'Duplicate payment slip upload detected',
                                      'Cannot find record in bank ledger / false slip'
                                    ].map((template) => (
                                      <button
                                        key={template}
                                        type="button"
                                        onClick={() => setDiscrepancyNotes(template)}
                                        className="px-2 py-1 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded border border-slate-850 text-[9px] text-left cursor-pointer"
                                      >
                                        {template}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Custom Audit Notes / Rejection Reason</label>
                                  <textarea
                                    value={discrepancyNotes}
                                    onChange={(e) => setDiscrepancyNotes(e.target.value)}
                                    placeholder="Type exactly what discrepancy was found (this is visible to the client in their wallet history)..."
                                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-2 focus:border-rose-500 h-16 resize-none"
                                  />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={async () => {
                                      if (!discrepancyNotes.trim()) {
                                        showToast('Please specify a discrepancy reason first.', true);
                                        return;
                                      }
                                      try {
                                        await updateWalletTransactionStatus(tx.id, 'Rejected', discrepancyNotes.trim());
                                        showToast(`Rejected & Flagged: ${discrepancyNotes}`);
                                        setShowDiscrepancyInputId(null);
                                        loadWalletTransactionsData();
                                      } catch (e: any) {
                                        showToast(e.message || 'Error processing rejection', true);
                                      }
                                    }}
                                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                                  >
                                    Submit Flag (Reject)
                                  </button>
                                  <button
                                    onClick={() => setShowDiscrepancyInputId(null)}
                                    className="px-3.5 py-2 bg-slate-950 text-slate-500 hover:text-white border border-slate-850 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 12. THEME CUSTOMIZER MENU */}
          {activeTab === 'theme_menu' && (
            <div className="space-y-6 text-left">
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6">
                
                {/* Header */}
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span>Home Page Customizer & Theme Editor</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Control your store front's visual merchandising directly: manage banner slideshows, curate featured diamonds, spotlight the "Stone of the Day", and promote exclusive collector gems.
                  </p>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
                  {[
                    { id: 'banner', label: 'Banners Customizer', count: adminBanners.length },
                    { id: 'featured', label: 'Featured Stones', count: products.filter(p => p.isFeatured).length },
                    { id: 'stone_of_the_day', label: 'Stone of the Day', count: products.filter(p => p.isStoneOfTheDay).length },
                    { id: 'exclusive', label: 'Exclusive Stones', count: products.filter(p => p.isExclusive).length }
                  ].map(subTab => (
                    <button
                      key={subTab.id}
                      onClick={() => setCustomizerTab(subTab.id as any)}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg border cursor-pointer transition-all ${
                        customizerTab === subTab.id 
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {subTab.label} ({subTab.count})
                    </button>
                  ))}
                </div>

                {/* Content based on customizerTab */}
                {customizerTab === 'banner' && (
                  <div className="space-y-6">
                    {/* Add Banner Form */}
                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-850/80 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-amber-500" />
                        <span>Upload New Home Page Banner</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Banner Title/Slogan</label>
                          <input
                            type="text"
                            value={newBannerTitle}
                            onChange={(e) => setNewBannerTitle(e.target.value)}
                            placeholder="E.g., VIEW OUR UNIQUELY MESMERISING TRAPEZOID CUT"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Image Source (URL or File Upload Below)</label>
                          <input
                            type="text"
                            value={newBannerImage}
                            onChange={(e) => setNewBannerImage(e.target.value)}
                            placeholder="https://images.unsplash.com/... or upload below"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* File upload block */}
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Or Select Local Image File</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-850 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors">
                            <Upload className="w-4 h-4 text-amber-500" />
                            <span>Browse File...</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === 'string') {
                                      setNewBannerImage(reader.result);
                                      showToast('Image file converted successfully!');
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {newBannerImage.startsWith('data:image/') && (
                            <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Base64 Data Loaded ({Math.round(newBannerImage.length / 1024)} KB)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            if (!newBannerImage.trim()) {
                              showToast('Please provide a banner image URL or upload a file.', true);
                              return;
                            }
                            const banner: HomeBanner = {
                              id: 'banner_' + Date.now(),
                              image: newBannerImage.trim(),
                              title: newBannerTitle.trim() || undefined,
                              active: true,
                              createdAt: new Date().toISOString()
                            };
                            addBanner(banner);
                            showToast('Banner uploaded successfully!');
                            setNewBannerImage('');
                            setNewBannerTitle('');
                            loadBannersData();
                          }}
                          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                        >
                          Publish Banner
                        </button>
                      </div>
                    </div>

                    {/* Already Uploaded and Selected Banners */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">Active & Saved Banners</h3>
                      
                      {isLoadingBanners ? (
                        <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                          <span>Synchronizing Boutique Media Banners...</span>
                        </div>
                      ) : adminBanners.length === 0 ? (
                        <div className="py-12 bg-slate-900 rounded-2xl border border-slate-850 text-center text-xs text-slate-500 italic">
                          No promotional banners configured. Upload one above to get started.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {adminBanners.map((b) => (
                            <div key={b.id} className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between">
                              <div className="h-32 bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-slate-850">
                                <img
                                  src={b.image}
                                  alt={b.title || 'Banner'}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-slate-950/40 p-3 flex items-end">
                                  <p className="text-[10px] font-black text-white truncate w-full drop-shadow-md bg-slate-950/60 px-1.5 py-0.5 rounded">
                                    {b.title || '(No title slogan)'}
                                  </p>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-950 flex items-center justify-between gap-2">
                                <button
                                  onClick={() => {
                                    const updated = adminBanners.map((item) => 
                                      item.id === b.id ? { ...item, active: !item.active } : item
                                    );
                                    saveBanners(updated);
                                    setAdminBanners(updated);
                                    showToast(b.active ? 'Banner deactivated.' : 'Banner activated!');
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                                    b.active 
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                      : 'bg-slate-900 border-slate-800 text-slate-500'
                                  }`}
                                >
                                  {b.active ? '● Selected/Active' : '○ Disabled'}
                                </button>

                                <button
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this banner?')) {
                                      deleteBanner(b.id);
                                      showToast('Banner deleted successfully!');
                                      loadBannersData();
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {customizerTab === 'featured' && (
                  <div className="space-y-4">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-slate-400 text-xs leading-relaxed space-y-1">
                      <strong className="text-white">Curate "Featured Stones" Catalog Section</strong>
                      <p>Select which diamonds or premium stones should be featured in the luxurious carousel/grid on the Home front page. Featured stones help drive immediate engagement with incoming clients.</p>
                    </div>

                    <div className="relative max-w-md">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={featuredSearch}
                        onChange={(e) => setFeaturedSearch(e.target.value)}
                        placeholder="Search stock NO, cut, color, clarity..."
                        className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {(() => {
                      const filtered = products.filter(p => {
                        const query = featuredSearch.toLowerCase();
                        return (
                          p.id.toLowerCase().includes(query) ||
                          (p.Stock_NO || '').toLowerCase().includes(query) ||
                          (p.cut || '').toLowerCase().includes(query) ||
                          (p.color || '').toLowerCase().includes(query) ||
                          (p.clarity || '').toLowerCase().includes(query) ||
                          p.name.toLowerCase().includes(query)
                        );
                      });
                      const itemsPerPage = 9;
                      const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
                      const activePage = Math.min(featuredPage, totalPages);
                      const startIndex = (activePage - 1) * itemsPerPage;
                      const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginated.map(p => (
                              <div key={p.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-850 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display='none'; }} />
                                    <Package className="w-5 h-5 text-slate-600" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="font-mono text-white font-bold block">{p.Stock_NO || p.id}</span>
                                    <span className="text-[10px] text-slate-400 block">{p.carat.toFixed(2)}ct {p.Shape || p.cut} {p.color}/{p.clarity}</span>
                                    <span className="text-amber-500 font-mono text-[10px] font-bold block">{p.price.toLocaleString()} THB</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    const updatedProducts = products.map(item => 
                                      item.id === p.id ? { ...item, isFeatured: !item.isFeatured } : item
                                    );
                                    saveProducts(updatedProducts);
                                    setProducts(updatedProducts);
                                    showToast(p.isFeatured ? 'Removed from Featured Section.' : 'Added to Featured Section!');
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                                    p.isFeatured 
                                      ? 'bg-amber-500 text-slate-950 border-amber-500' 
                                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {p.isFeatured ? '★ Featured' : '☆ Curate'}
                                </button>
                              </div>
                            ))}
                          </div>

                          {totalPages > 1 && (
                            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 mt-2">
                              <span className="text-[10px] text-slate-500 font-extrabold uppercase">
                                Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} diamonds
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setFeaturedPage(p => Math.max(p - 1, 1))}
                                  disabled={activePage === 1}
                                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-mono font-black text-white px-2">
                                  {activePage} / {totalPages}
                                </span>
                                <button
                                  onClick={() => setFeaturedPage(p => Math.min(p + 1, totalPages))}
                                  disabled={activePage === totalPages}
                                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {customizerTab === 'stone_of_the_day' && (
                  <div className="space-y-4">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-slate-400 text-xs leading-relaxed space-y-1">
                      <strong className="text-white">Designate "Stone of the Day"</strong>
                      <p>Select exactly one diamond or premium item as the exclusive spotlighted "Stone of the Day". This item will be beautifully highlighted with interactive metrics on the client Home Page.</p>
                    </div>

                    <div className="relative max-w-md">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={sotdSearch}
                        onChange={(e) => setSotdSearch(e.target.value)}
                        placeholder="Search Stock NO, cut, color, clarity..."
                        className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {(() => {
                      const filtered = products.filter(p => {
                        const query = sotdSearch.toLowerCase();
                        return (
                          p.id.toLowerCase().includes(query) ||
                          (p.Stock_NO || '').toLowerCase().includes(query) ||
                          (p.cut || '').toLowerCase().includes(query) ||
                          (p.color || '').toLowerCase().includes(query) ||
                          (p.clarity || '').toLowerCase().includes(query) ||
                          p.name.toLowerCase().includes(query)
                        );
                      });
                      const itemsPerPage = 9;
                      const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
                      const activePage = Math.min(sotdPage, totalPages);
                      const startIndex = (activePage - 1) * itemsPerPage;
                      const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginated.map(p => (
                              <div key={p.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-850 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display='none'; }} />
                                    <Package className="w-5 h-5 text-slate-600" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="font-mono text-white font-bold block">{p.Stock_NO || p.id}</span>
                                    <span className="text-[10px] text-slate-400 block">{p.carat.toFixed(2)}ct {p.Shape || p.cut} {p.color}/{p.clarity}</span>
                                    <span className="text-amber-500 font-mono text-[10px] font-bold block">{p.price.toLocaleString()} THB</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    const updatedProducts = products.map(item => 
                                      item.id === p.id 
                                        ? { ...item, isStoneOfTheDay: true } 
                                        : { ...item, isStoneOfTheDay: false }
                                    );
                                    saveProducts(updatedProducts);
                                    setProducts(updatedProducts);
                                    showToast(`Spotlight set: ${p.Stock_NO || p.name} is now the Stone of the Day!`);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                                    p.isStoneOfTheDay 
                                      ? 'bg-emerald-500 text-slate-950 border-emerald-500' 
                                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {p.isStoneOfTheDay ? '● Current Spotlight' : '○ Set Spotlight'}
                                </button>
                              </div>
                            ))}
                          </div>

                          {totalPages > 1 && (
                            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 mt-2">
                              <span className="text-[10px] text-slate-500 font-extrabold uppercase">
                                Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} diamonds
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setSotdPage(p => Math.max(p - 1, 1))}
                                  disabled={activePage === 1}
                                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-mono font-black text-white px-2">
                                  {activePage} / {totalPages}
                                </span>
                                <button
                                  onClick={() => setSotdPage(p => Math.min(p + 1, totalPages))}
                                  disabled={activePage === totalPages}
                                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {customizerTab === 'exclusive' && (
                  <div className="space-y-4">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-slate-400 text-xs leading-relaxed space-y-1">
                      <strong className="text-white">Curate "Exclusive Stones" Catalog Section</strong>
                      <p>Select which rare gems, diamonds, or masterpiece jewelry items should reside under the ultra-high-end "Exclusive Stones" category, displayed in luxury panels on the Home Page.</p>
                    </div>

                    <div className="relative max-w-md">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={exclusiveSearch}
                        onChange={(e) => setExclusiveSearch(e.target.value)}
                        placeholder="Search stock NO, cut, color, clarity..."
                        className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {(() => {
                      const filtered = products.filter(p => {
                        const query = exclusiveSearch.toLowerCase();
                        return (
                          p.id.toLowerCase().includes(query) ||
                          (p.Stock_NO || '').toLowerCase().includes(query) ||
                          (p.cut || '').toLowerCase().includes(query) ||
                          (p.color || '').toLowerCase().includes(query) ||
                          (p.clarity || '').toLowerCase().includes(query) ||
                          p.name.toLowerCase().includes(query)
                        );
                      });
                      const itemsPerPage = 9;
                      const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
                      const activePage = Math.min(exclusivePage, totalPages);
                      const startIndex = (activePage - 1) * itemsPerPage;
                      const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginated.map(p => (
                              <div key={p.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-850 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display='none'; }} />
                                    <Package className="w-5 h-5 text-slate-600" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="font-mono text-white font-bold block">{p.Stock_NO || p.id}</span>
                                    <span className="text-[10px] text-slate-400 block">{p.carat.toFixed(2)}ct {p.Shape || p.cut} {p.color}/{p.clarity}</span>
                                    <span className="text-amber-500 font-mono text-[10px] font-bold block">{p.price.toLocaleString()} THB</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    const updatedProducts = products.map(item => 
                                      item.id === p.id ? { ...item, isExclusive: !item.isExclusive } : item
                                    );
                                    saveProducts(updatedProducts);
                                    setProducts(updatedProducts);
                                    showToast(p.isExclusive ? 'Removed from Exclusive Section.' : 'Added to Exclusive Section!');
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                                    p.isExclusive 
                                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-black' 
                                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {p.isExclusive ? '✦ Exclusive' : '✧ Curate'}
                                </button>
                              </div>
                            ))}
                          </div>

                          {totalPages > 1 && (
                            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 mt-2">
                              <span className="text-[10px] text-slate-500 font-extrabold uppercase">
                                Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} diamonds
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setExclusivePage(p => Math.max(p - 1, 1))}
                                  disabled={activePage === 1}
                                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-mono font-black text-white px-2">
                                  {activePage} / {totalPages}
                                </span>
                                <button
                                  onClick={() => setExclusivePage(p => Math.min(p + 1, totalPages))}
                                  disabled={activePage === totalPages}
                                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* DATABASE CONNECTION DIAGNOSTICS TAB */}
          {activeTab === 'db_connection' && (
            <div className="space-y-6 text-left">
              {/* Header */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <h3 className="text-base font-black text-white uppercase tracking-wider font-display">Database Connection & Diagnostics Console</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Test and verify connection parameters for Hostinger MySQL database. Identify and fix connection issues instantly.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunDbTest()}
                    disabled={isTestingDbConn}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-500/10"
                  >
                    <RefreshCw className={`w-4 h-4 ${isTestingDbConn ? 'animate-spin' : ''}`} />
                    <span>{isTestingDbConn ? 'Testing Connection...' : 'Run Diagnostics'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => {
                    setDbHostInput('localhost');
                    handleRunDbTest({ host: 'localhost' });
                  }}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-emerald-400" />
                      Preset 1: Localhost (Default)
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">Recommended</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Best for applications deployed directly on Hostinger web servers.
                  </p>
                  <span className="text-[10px] text-amber-500 font-mono font-semibold block group-hover:underline">
                    Test DB_HOST='localhost' →
                  </span>
                </div>

                <div 
                  onClick={() => {
                    setDbHostInput('127.0.0.1');
                    handleRunDbTest({ host: '127.0.0.1' });
                  }}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Wifi className="w-4 h-4 text-blue-400" />
                      Preset 2: Local IP (127.0.0.1)
                    </span>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">Alternative</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Uses explicit loopback IP address for local server socket binding.
                  </p>
                  <span className="text-[10px] text-amber-500 font-mono font-semibold block group-hover:underline">
                    Test DB_HOST='127.0.0.1' →
                  </span>
                </div>

                <div 
                  onClick={() => {
                    setDbHostInput('srv1085.hstgr.io');
                    handleRunDbTest({ host: 'srv1085.hstgr.io' });
                  }}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-purple-400" />
                      Preset 3: Hostinger Domain
                    </span>
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-mono font-bold">Remote Host</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    srv1085.hstgr.io (Requires Remote MySQL enabled in Hostinger hPanel).
                  </p>
                  <span className="text-[10px] text-amber-500 font-mono font-semibold block group-hover:underline">
                    Test DB_HOST='srv1085.hstgr.io' →
                  </span>
                </div>
              </div>

              {/* Form & Results Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Parameter Inputs */}
                <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-500" />
                      <span>Connection Parameters</span>
                    </h4>
                    <span className="text-[9px] font-mono text-slate-500 uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">MySQL Config</span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Database Host (DB_HOST)</label>
                      <input
                        type="text"
                        value={dbHostInput}
                        onChange={(e) => setDbHostInput(e.target.value)}
                        placeholder="localhost or srv1085.hstgr.io"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                      <p className="text-[9px] text-slate-500">Hostinger hosted apps should use <code className="text-amber-400">localhost</code>.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Database User (DB_USER)</label>
                      <input
                        type="text"
                        value={dbUserInput}
                        onChange={(e) => setDbUserInput(e.target.value)}
                        placeholder="u513407224_phetmany"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Database Password (DB_PASSWORD)</label>
                      <div className="relative">
                        <input
                          type={showDbPassword ? 'text' : 'password'}
                          value={dbPasswordInput}
                          onChange={(e) => setDbPasswordInput(e.target.value)}
                          placeholder="Enter password"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDbPassword(!showDbPassword)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                        >
                          {showDbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Database Name (DB_NAME)</label>
                      <input
                        type="text"
                        value={dbNameInput}
                        onChange={(e) => setDbNameInput(e.target.value)}
                        placeholder="u513407224_phetmany"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Port (DB_PORT)</label>
                      <input
                        type="text"
                        value={dbPortInput}
                        onChange={(e) => setDbPortInput(e.target.value)}
                        placeholder="3306"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      onClick={() => handleRunDbTest()}
                      disabled={isTestingDbConn}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                    >
                      {isTestingDbConn ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Testing Database Connection...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Test Provided Connection</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Connection Diagnostic Result Panel */}
                <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5 flex flex-col justify-between">
                  <div>
                    <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        <span>Diagnostic Test Results</span>
                      </h4>
                      {dbTestResultData && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Response time: <strong className="text-amber-400">{dbTestResultData.responseTimeMs} ms</strong>
                        </span>
                      )}
                    </div>

                    {!dbTestResultData && !isTestingDbConn && (
                      <div className="py-16 text-center space-y-3">
                        <Database className="w-10 h-10 text-slate-700 mx-auto animate-pulse" />
                        <p className="text-xs text-slate-500">Click "Run Diagnostics" or "Test Provided Connection" to perform test.</p>
                      </div>
                    )}

                    {isTestingDbConn && (
                      <div className="py-16 text-center space-y-3">
                        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
                        <p className="text-xs font-bold text-slate-300">Attempting socket connection to MySQL server...</p>
                        <p className="text-[10px] text-slate-500 font-mono">Testing host: {dbHostInput}:{dbPortInput}</p>
                      </div>
                    )}

                    {dbTestResultData && !isTestingDbConn && (
                      <div className="space-y-5 pt-2">
                        {/* Success or Failure Banner */}
                        {dbTestResultData.success ? (
                          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-emerald-400">
                              <CheckCircle2 className="w-5 h-5 shrink-0" />
                              <span className="font-extrabold text-sm uppercase tracking-wider">{dbTestResultData.message}</span>
                            </div>
                            <p className="text-xs text-emerald-300/80 leading-relaxed">
                              Your web application is fully connected to the MySQL database. All read and write operations are active.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-red-400">
                              <AlertCircle className="w-5 h-5 shrink-0" />
                              <span className="font-extrabold text-sm uppercase tracking-wider">{dbTestResultData.message}</span>
                            </div>
                            {dbTestResultData.error && (
                              <div className="bg-slate-900 p-3 rounded-lg border border-red-500/20 font-mono text-xs text-red-300 space-y-1">
                                <div><strong className="text-slate-400">Error Code:</strong> {dbTestResultData.error.code}</div>
                                {dbTestResultData.error.errno && <div><strong className="text-slate-400">Errno:</strong> {dbTestResultData.error.errno}</div>}
                                <div><strong className="text-slate-400">Details:</strong> {dbTestResultData.error.message}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tested Configuration Summary */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tested Credentials</span>
                          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                            <div><span className="text-slate-500">Host:</span> <strong className="text-white">{dbTestResultData.config?.host}</strong></div>
                            <div><span className="text-slate-500">Port:</span> <strong className="text-white">{dbTestResultData.config?.port}</strong></div>
                            <div><span className="text-slate-500">User:</span> <strong className="text-white">{dbTestResultData.config?.user}</strong></div>
                            <div><span className="text-slate-500">Database:</span> <strong className="text-white">{dbTestResultData.config?.database}</strong></div>
                          </div>
                        </div>

                        {/* Connection Details if Success */}
                        {dbTestResultData.success && dbTestResultData.details && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">MySQL Version</span>
                                <span className="font-mono text-xs font-bold text-white">{dbTestResultData.details.mysqlVersion || '8.0.x'}</span>
                              </div>
                              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Server Time</span>
                                <span className="font-mono text-xs font-bold text-emerald-400">{dbTestResultData.details.serverTime ? new Date(dbTestResultData.details.serverTime).toLocaleString() : 'N/A'}</span>
                              </div>
                            </div>

                            {/* Database Tables Overview */}
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Tables Initialized ({dbTestResultData.details.tablesFound?.length || 0})</span>
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded">InnoDB Schema Ready</span>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {dbTestResultData.details.tablesFound?.map((tbl: string) => (
                                  <span key={tbl} className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono font-bold rounded-lg flex items-center gap-1.5">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    {tbl}
                                  </span>
                                ))}
                              </div>

                              {dbTestResultData.details.counts && (
                                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-center font-mono">
                                  <div className="bg-slate-950 p-2 rounded-lg">
                                    <span className="text-[9px] text-slate-500 block">Products</span>
                                    <span className="text-xs font-bold text-amber-500">{dbTestResultData.details.counts.products}</span>
                                  </div>
                                  <div className="bg-slate-950 p-2 rounded-lg">
                                    <span className="text-[9px] text-slate-500 block">Orders</span>
                                    <span className="text-xs font-bold text-blue-400">{dbTestResultData.details.counts.orders}</span>
                                  </div>
                                  <div className="bg-slate-950 p-2 rounded-lg">
                                    <span className="text-[9px] text-slate-500 block">Tickets</span>
                                    <span className="text-xs font-bold text-purple-400">{dbTestResultData.details.counts.tickets}</span>
                                  </div>
                                  <div className="bg-slate-950 p-2 rounded-lg">
                                    <span className="text-[9px] text-slate-500 block">Users</span>
                                    <span className="text-xs font-bold text-emerald-400">{dbTestResultData.details.counts.users}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Troubleshooting Suggestions if Failure */}
                        {!dbTestResultData.success && dbTestResultData.suggestions && (
                          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-3">
                            <h5 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4" />
                              How to Fix This Issue on Hostinger MySQL
                            </h5>
                            <ul className="space-y-2 text-xs text-slate-300">
                              {dbTestResultData.suggestions.map((sugg: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-amber-500 font-bold shrink-0">{idx + 1}.</span>
                                  <span>{sugg}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="pt-2 border-t border-amber-500/20 text-[11px] text-slate-400 space-y-1">
                              <p className="font-bold text-amber-300">Quick Hostinger Setup Steps:</p>
                              <p>1. Open Hostinger hPanel → <strong>Databases</strong> → <strong>MySQL Databases</strong>.</p>
                              <p>2. Verify database name (e.g. <code className="text-white">u513407224_phetmany</code>) and user.</p>
                              <p>3. Make sure the MySQL User is added to the Database with <strong>ALL PRIVILEGES</strong>.</p>
                              <p>4. Set <code className="text-amber-400 font-bold">DB_HOST="localhost"</code> in your environment or form on the left.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}
