import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Eye, Filter, RefreshCw, X, CreditCard, 
  MapPin, Phone, User, Check, ExternalLink, Sparkles, MessageSquare, 
  Send, ListFilter, FileText, Compass, ChevronRight, ChevronLeft, CheckCircle2, Clock, 
  Truck, ArrowRight, ShieldCheck, QrCode, LayoutGrid, List, Plus, Menu, LogOut,
  Calculator, Percent, Printer, Copy, Link, Users, Award, Share2, Wallet, Upload, Package,
  ThumbsUp, Star, MoreHorizontal, Facebook, Instagram, Twitter, Linkedin, Layers, Download
} from 'lucide-react';
import { UserProfile, Product, Order, SupportTicket, WalletTransaction } from '../types';
import { 
  getProducts, getOrders, saveOrders, getTickets, addTicket, addTicketMessage, saveTickets,
  fetchProductsFromDb, fetchOrdersFromDb, fetchTicketsFromDb, getProductsFromIndexedDB
} from '../lib/diamondDb';
import { 
  calculateDiamondPrice, CALC_SHAPES, CALC_COLORS, CALC_CLARITIES, CalculationResult 
} from '../lib/rapaportDb';
import { 
  getAffiliateBenefits, getAffiliates, saveAffiliateProfile, getReferredOrders, findAffiliateByCoupon, recordCommissionForOrder, AffiliateProfile, AffiliateReferredOrder
} from '../lib/affiliateDb';
import { 
  getWalletTransactions, 
  createWalletTransaction, 
  deductUserWalletBalance 
} from '../lib/walletDb';

import { HomeBanner, getBanners, fetchBannersFromDb } from '../lib/homeThemeDb';

interface CustomerStoreProps {
  currentUser: UserProfile;
  onUpdateCurrentUser: (updates: Partial<UserProfile>) => void;
  logoUrl: string;
  onLogout: () => void;
  theme: 'light' | 'orange' | 'green' | 'dark' | 'navy';
  setTheme: (theme: 'light' | 'orange' | 'green' | 'dark' | 'navy') => void;
}

export default function CustomerStore({ currentUser, onUpdateCurrentUser, logoUrl, onLogout, theme, setTheme }: CustomerStoreProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'orders' | 'calculator' | 'support' | 'affiliate' | 'wallet'>('home');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Affiliate Program States
  const [affiliateBenefits, setAffiliateBenefits] = useState<string[]>([]);
  const [myAffiliateProfile, setMyAffiliateProfile] = useState<AffiliateProfile | null>(null);
  const [myReferredOrders, setMyReferredOrders] = useState<AffiliateReferredOrder[]>([]);
  const [desiredCouponCode, setDesiredCouponCode] = useState<string>('');
  const [isJoiningProgram, setIsJoiningProgram] = useState<boolean>(false);
  const [copiedReferralLink, setCopiedReferralLink] = useState<boolean>(false);
  const [isLoadingAffState, setIsLoadingAffState] = useState<boolean>(false);

  // Affiliate Simulation & Copy States
  const [simReferrals, setSimReferrals] = useState<number>(5);
  const [simAvgPrice, setSimAvgPrice] = useState<number>(80000);
  const [simAvgItems, setSimAvgItems] = useState<number>(1);
  const [copiedCaptionText, setCopiedCaptionText] = useState<string | null>(null);

  const loadMyAffiliateState = async () => {
    setIsLoadingAffState(true);
    try {
      const b = await getAffiliateBenefits();
      setAffiliateBenefits(b);
      const affs = await getAffiliates();
      // Find my affiliate profile (by email or userId)
      const myAff = affs.find(a => a.userId === currentUser.id || a.email.toLowerCase() === currentUser.email.toLowerCase());
      if (myAff) {
        setMyAffiliateProfile(myAff);
        // Load referred orders for this affiliate
        const reffs = await getReferredOrders();
        const myReffs = reffs.filter(o => o.affiliateId === myAff.id);
        setMyReferredOrders(myReffs);
      } else {
        setMyAffiliateProfile(null);
        setMyReferredOrders([]);
      }
    } catch (e) {
      console.warn("Error loading customer affiliate state:", e);
    } finally {
      setIsLoadingAffState(false);
    }
  };

  // Wallet States
  const [clientWalletTransactions, setClientWalletTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingClientWallet, setIsLoadingClientWallet] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(50000);
  const [topUpGateway, setTopUpGateway] = useState<'UPI' | 'Wire Transfer'>('UPI');
  const [upiTxId, setUpiTxId] = useState<string>('');
  const [paymentSlipBase64, setPaymentSlipBase64] = useState<string>('');
  const [paymentSlipFileName, setPaymentSlipFileName] = useState<string>('');
  const [topUpNotes, setTopUpNotes] = useState<string>('');
  const [topUpStep, setTopUpStep] = useState<'form' | 'submitting' | 'completed'>('form');

  const loadClientWalletData = async () => {
    setIsLoadingClientWallet(true);
    try {
      const data = await getWalletTransactions();
      const filtered = data.filter(t => t.userId === currentUser.id);
      setClientWalletTransactions(filtered);
    } catch (err) {
      console.warn("Failed to load client wallet transactions:", err);
    } finally {
      setIsLoadingClientWallet(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wallet') {
      loadClientWalletData();
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    loadMyAffiliateState();
  }, [activeTab, currentUser]);
  
  // Data State
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  const [tickets, setTickets] = useState<SupportTicket[]>(() => getTickets());

  // Home Page Customizer Banners
  const [homeBanners, setHomeBanners] = useState<HomeBanner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState<number>(0);
  const [isLoadingBanners, setIsLoadingBanners] = useState<boolean>(false);

  const loadBanners = async () => {
    setIsLoadingBanners(true);
    try {
      const b = await fetchBannersFromDb();
      setHomeBanners(b.filter(item => item.active));
    } catch (err) {
      console.warn("Failed to load customer banners:", err);
      setHomeBanners(getBanners().filter(item => item.active));
    } finally {
      setIsLoadingBanners(false);
    }
  };

  useEffect(() => {
    // 1. Immediately read from local IndexedDB if available
    getProductsFromIndexedDB().then(idbProducts => {
      if (idbProducts && idbProducts.length > 0) {
        setProducts(idbProducts);
      }
    }).catch(console.warn);

    // 2. Fetch full catalog from MySQL DB
    fetchProductsFromDb().then(fresh => {
      if (fresh && fresh.length > 0) {
        setProducts(fresh);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === 'home') {
      loadBanners();
    }
  }, [activeTab]);

  // Banner auto sliding
  useEffect(() => {
    if (homeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % homeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [homeBanners]);

  // Stone of the Day live countdown state
  const [sotdTimeLeft, setSotdTimeLeft] = useState({ hours: 14, minutes: 23, seconds: 15 });
  useEffect(() => {
    const timer = setInterval(() => {
      setSotdTimeLeft((prev) => {
        let s = prev.seconds - 1;
        let m = prev.minutes;
        let h = prev.hours;
        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        if (h < 0) {
          h = 23;
        }
        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculator State
  const [calcShape, setCalcShape] = useState<string>('Round');
  const [calcWeight, setCalcWeight] = useState<number>(1.00);
  const [calcColor, setCalcColor] = useState<string>('G');
  const [calcClarity, setCalcClarity] = useState<string>('VS2');
  const [calcMarkup, setCalcMarkup] = useState<number>(15); // Default 15% markup
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const compute = async () => {
      setIsCalculating(true);
      try {
        const res = await calculateDiamondPrice(calcShape, calcWeight, calcColor, calcClarity, calcMarkup);
        if (active) {
          setCalcResult(res);
        }
      } catch (err) {
        console.error("Calculation failed", err);
      } finally {
        if (active) setIsCalculating(false);
      }
    };
    compute();
    return () => { active = false; };
  }, [calcShape, calcWeight, calcColor, calcClarity, calcMarkup]);

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [caratFilter, setCaratFilter] = useState<number>(0.5); // min carat weight
  const [selectedCut, setSelectedCut] = useState<string>('All');
  const [selectedColor, setSelectedColor] = useState<string>('All');
  const [selectedClarity, setSelectedClarity] = useState<string>('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  // Reset pagination to first page when any filters or limits change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, caratFilter, selectedCut, selectedColor, selectedClarity, itemsPerPage]);

  // Interactive View Modal (360° Viewer + Certificate)
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<'image' | '360' | 'cert'>('image');
  const [rotationAngle, setRotationAngle] = useState(0); // For 360 simulation
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  // Cart State
  const [cart, setCart] = useState<Product[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [appliedAffiliate, setAppliedAffiliate] = useState<AffiliateProfile | null>(null);

  // Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingName, setShippingName] = useState(currentUser.fullName);
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('Bangkok');
  const [shippingZip, setShippingZip] = useState('10110');
  const [paymentMethod, setPaymentMethod] = useState<'PromptPay' | 'TrueMoney' | 'Wallet'>('PromptPay');

  // Interactive Payment Step State
  const [paymentStep, setPaymentStep] = useState<'form' | 'gateway' | 'completed'>('form');
  const [trueMoneyPhone, setTrueMoneyPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [promptPayScanned, setPromptPayScanned] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);

  // Live order tracker sub-state
  const [selectedTrackerOrder, setSelectedTrackerOrder] = useState<Order | null>(null);

  // Customer Support States
  const [selectedSupportTicket, setSelectedSupportTicket] = useState<SupportTicket | null>(null);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [supportMsgText, setSupportMsgText] = useState('');
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notifications
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const showToast = (msg: string, isErr = false) => {
    if (isErr) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 3500);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  useEffect(() => {
    const loadDb = async () => {
      try {
        const [freshProducts, freshOrders, freshTickets] = await Promise.all([
          fetchProductsFromDb(),
          fetchOrdersFromDb(),
          fetchTicketsFromDb()
        ]);
        setProducts(freshProducts);
        setOrders(freshOrders);
        setTickets(freshTickets);
      } catch (err) {
        console.error("Failed to sync CustomerStore with Database:", err);
      }
    };
    loadDb();

    // Check for affiliate referral link in URL query params
    const checkReferralParam = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const refParam = params.get('ref');
        if (refParam) {
          const aff = await findAffiliateByCoupon(refParam);
          if (aff && aff.status === 'Active') {
            setCouponCode(refParam);
            setAppliedAffiliate(aff);
            setDiscountApplied(false);
            
            // Record direct click in db
            aff.clicks = (aff.clicks || 0) + 1;
            await saveAffiliateProfile(aff);
            
            showToast(`Welcome! Referral Applied: ${aff.discountPercent}% Discount, courtesy of Partner ${aff.fullName}!`);
          }
        }
      } catch (err) {
        console.warn("Failed checking url referral coupon:", err);
      }
    };
    checkReferralParam();
  }, []);

  useEffect(() => {
    setProducts(getProducts());
    setOrders(getOrders());
    setTickets(getTickets());
  }, [activeTab, paymentStep, showCheckout]);

  // Periodic simulated payment confirmation count
  useEffect(() => {
    let timer: any;
    if (paymentStep === 'gateway' && paymentMethod === 'PromptPay' && !promptPayScanned) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setPromptPayScanned(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paymentStep, paymentMethod, promptPayScanned]);

  // 360 Drag-to-Rotate mouse handler
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setRotationAngle((prev) => (prev + deltaX * 1.5) % 360);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add to cart
  const handleAddToCart = (p: Product) => {
    if (cart.some(item => item.id === p.id)) {
      showToast('This unique certified diamond is already in your shopping cart.', true);
      return;
    }
    setCart([...cart, p]);
    showToast(`Diamond "${p.name}" added to cart.`);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Pricing calculations
  const cartSubtotal = cart.reduce((acc, curr) => acc + curr.price, 0);
  const affiliateDiscountAmount = appliedAffiliate ? Math.floor(cartSubtotal * (appliedAffiliate.discountPercent / 100)) : 0;
  const promoDiscountAmount = discountApplied ? Math.floor(cartSubtotal * 0.0134) : 0;
  const cartDiscount = promoDiscountAmount + affiliateDiscountAmount;
  const cartTotal = cartSubtotal - cartDiscount;

  // Coupon apply
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (cleanCode === 'PHETMANY34YEARS' || cleanCode === 'HK34YEARS' || cleanCode === 'PHETMANY2026') {
      setDiscountApplied(true);
      setAppliedAffiliate(null);
      showToast('Exclusive 1.34% Grand Launch promotional discount applied!');
    } else {
      try {
        const aff = await findAffiliateByCoupon(cleanCode);
        if (aff && aff.status === 'Active') {
          setAppliedAffiliate(aff);
          setDiscountApplied(false); // Affiliate coupon replaces standard promo coupon
          showToast(`Premium Affiliate Coupon Applied: ${aff.discountPercent}% Discount courtesies of Partner ${aff.fullName}!`);
        } else {
          showToast('Invalid or expired promotional/partner coupon code.', true);
        }
      } catch (err) {
        showToast('Error verifying coupon code.', true);
      }
    }
  };

  // Submit Order & Simulate Thai Payment Gateways (Opn/Omise API proxy)
  const handleInitCheckout = () => {
    if (cart.length === 0) {
      showToast('Your shopping cart is currently empty.', true);
      return;
    }
    setShowCheckout(true);
    setPaymentStep('form');
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingName.trim() || !shippingPhone.trim() || !shippingStreet.trim()) {
      showToast('Please fulfill all shipping coordinates.', true);
      return;
    }

    if (paymentMethod === 'Wallet') {
      const balance = currentUser.walletBalance || 0;
      if (balance < cartTotal) {
        showToast('Insufficient wallet balance. Please top up or choose another payment method.', true);
        return;
      }
      
      // Perform balance deduction
      setIsLoadingClientWallet(true);
      deductUserWalletBalance(currentUser.id, cartTotal)
        .then(() => {
          onUpdateCurrentUser({ walletBalance: balance - cartTotal });
          setPaymentStep('completed');
          finalizeOrder();
          showToast(`Paid successfully! Deducted ${cartTotal.toLocaleString()} THB from your wallet balance.`);
        })
        .catch((err) => {
          showToast(err.message || 'Error processing wallet debit', true);
        })
        .finally(() => {
          setIsLoadingClientWallet(false);
        });
      return;
    }

    setPaymentStep('gateway');
    setSecondsLeft(5);
    setPromptPayScanned(false);
    setOtpSent(false);
  };

  // Verify TrueMoney Simulated OTP
  const handleVerifyTrueMoneyOtp = () => {
    if (otpCode.length < 6) {
      showToast('Please enter the 6-digit OTP passcode.', true);
      return;
    }
    setPaymentStep('completed');
    finalizeOrder();
  };

  // Verify PromptPay payment completion
  const handleVerifyPromptPaySuccess = () => {
    setPaymentStep('completed');
    finalizeOrder();
  };

  const finalizeOrder = () => {
    const freshOrders = getOrders();
    const newOrderId = 'ord_' + Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: newOrderId,
      customerId: currentUser.id,
      customerName: shippingName,
      customerEmail: currentUser.email,
      items: cart.map(item => ({ product: item, quantity: 1 })),
      totalAmount: cartTotal,
      paymentMethod,
      paymentStatus: 'Paid',
      shippingStatus: 'Processing',
      shippingAddress: {
        fullName: shippingName,
        phone: shippingPhone,
        street: shippingStreet,
        city: shippingCity,
        state: shippingCity,
        zipCode: shippingZip,
        country: 'Thailand'
      },
      invoiceNumber: 'INV-2026-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString(),
      trackingHistory: [
        { 
          status: 'Processing', 
          timestamp: new Date().toISOString(), 
          note: paymentMethod === 'Wallet'
            ? `Authorized and fully settled via customer digital wallet. Balance deducted instantly.`
            : `Authorized via Thai Payment Provider (Opn/Omise) with ${paymentMethod}. Assets on hold.` 
        }
      ]
    };

    // If affiliate coupon applied, record commission transaction details
    if (appliedAffiliate) {
      const itemCount = cart.length;
      
      recordCommissionForOrder(
        newOrderId,
        appliedAffiliate.couponCode,
        cartSubtotal,
        shippingName,
        itemCount
      ).then(() => {
        loadMyAffiliateState();
      }).catch((e) => {
        console.warn("Failed saving affiliate referred commission:", e);
      });
    }

    freshOrders.unshift(newOrder);
    saveOrders(freshOrders);
    setOrders(freshOrders);
    setCart([]);
    setAppliedAffiliate(null); // clear coupon
    setShowCheckout(false);
    showToast('Your order was successfully registered & paid!');
    setSelectedTrackerOrder(newOrder);
    setActiveTab('orders');
  };

  // Filter Catalog logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCarat = p.carat >= caratFilter;
    const matchesCut = selectedCut === 'All' || p.cut === selectedCut;
    const matchesColor = selectedColor === 'All' || p.color === selectedColor;
    const matchesClarity = selectedClarity === 'All' || p.clarity === selectedClarity;
    return matchesSearch && matchesCarat && matchesCut && matchesColor && matchesClarity;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Support Ticketing Customer Portal
  const handleCreateSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !supportMsgText.trim()) {
      showToast('Subject and description are required.', true);
      return;
    }

    const tktId = 'tkt_' + Math.floor(100 + Math.random() * 900);
    const newTkt: SupportTicket = {
      id: tktId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userEmail: currentUser.email,
      subject: newTicketSubject.trim(),
      status: 'Open',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_' + Date.now(),
          sender: 'user',
          senderName: currentUser.fullName,
          text: supportMsgText.trim(),
          timestamp: new Date().toISOString()
        }
      ]
    };

    addTicket(newTkt);
    const updated = getTickets();
    setTickets(updated);
    setSelectedSupportTicket(newTkt);
    setNewTicketSubject('');
    setSupportMsgText('');
    setShowCreateTicket(false);
    showToast('Support inquiry ticket submitted to help desk.');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupportTicket || !supportMsgText.trim()) return;

    addTicketMessage(selectedSupportTicket.id, supportMsgText.trim(), 'user', currentUser.fullName);
    const updated = getTickets();
    setTickets(updated);
    const active = updated.find(t => t.id === selectedSupportTicket.id) || null;
    setSelectedSupportTicket(active);
    setSupportMsgText('');

    // Simulated Auto-Reply to enhance customer experience
    setTimeout(() => {
      if (active) {
        addTicketMessage(
          active.id, 
          "Hello! We have received your message. Our master gemologists are reviewing your inquiry and will respond within 15 minutes. Thank you for your patience.",
          'support',
          'PHETMANY Support Desk'
        );
        const updated2 = getTickets();
        setTickets(updated2);
        setSelectedSupportTicket(updated2.find(t => t.id === active.id) || null);
      }
    }, 2500);
  };

  const totalReferredVolume = myReferredOrders.reduce((sum, curr) => sum + curr.orderTotal, 0);
  
  // Calculate Tier Info
  let currentTier = "Bronze Partner";
  let tierCommission = "5%";
  let tierDiscount = "5%";
  let nextTier = "Silver Ambassador";
  let nextTierRequirement = 250000;
  let remainingForNext = 250000 - totalReferredVolume;
  let progressPercent = Math.min(100, (totalReferredVolume / 250000) * 100);
  let tierColor = "text-amber-600 bg-amber-500/10 border-amber-500/30";
  let tierIconColor = "text-amber-500";

  if (totalReferredVolume >= 250000 && totalReferredVolume < 1000000) {
    currentTier = "Silver Ambassador";
    tierCommission = "7%";
    tierDiscount = "7%";
    nextTier = "Gold VIP Elite";
    nextTierRequirement = 1000000;
    remainingForNext = 1000000 - totalReferredVolume;
    progressPercent = Math.min(100, ((totalReferredVolume - 250000) / 750000) * 100);
    tierColor = "text-slate-300 bg-slate-100/10 border-slate-500/30";
    tierIconColor = "text-slate-300";
  } else if (totalReferredVolume >= 1000000) {
    currentTier = "Gold VIP Elite";
    tierCommission = "10%";
    tierDiscount = "10%";
    nextTier = "Highest Rank Achieved!";
    nextTierRequirement = 1000000;
    remainingForNext = 0;
    progressPercent = 100;
    tierColor = "text-amber-400 bg-amber-400/10 border-amber-400/30 font-black";
    tierIconColor = "text-amber-400 animate-bounce";
  }

  const customerOrders = orders.filter(o => o.customerId === currentUser.id);
  const activeTracker = selectedTrackerOrder || customerOrders[0] || null;

  return (
    <div className="min-h-screen bg-[#182361] text-slate-100 flex flex-col font-sans transition-colors duration-300 relative">
      
      {/* Mobile Slide-Over Side Drawer (Full height on the RIGHT side of the application) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[999999] flex justify-end md:hidden">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-[#070c22]/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Right Side Drawer Shell */}
          <div className="relative w-[85%] max-w-[320px] bg-[#1f2d78] h-full shadow-2xl flex flex-col justify-between overflow-y-auto text-white z-10 border-l border-blue-900/60 animate-in slide-in-from-right duration-200">
            
            <div className="p-4 space-y-4">
              {/* Top User Profile Header Box */}
              <div className="bg-[#283895] p-3 rounded-2xl flex items-center gap-3 border border-white/15 shadow-md">
                <div className="w-10 h-10 rounded-full border-2 border-white/40 bg-[#1d2b73] flex items-center justify-center text-white shrink-0 shadow-inner">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-sm text-white truncate leading-tight">
                    {currentUser.username || currentUser.fullName || 'Phetmany User'}
                  </h3>
                  <p className="text-[11px] text-blue-200/90 truncate mt-0.5">
                    {currentUser.email || 'customer@phetmany.com'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="ml-auto text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items List matching Desktop View */}
              <div className="space-y-1 text-sm font-semibold">
                
                <button 
                  onClick={() => { setActiveTab('home'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'home' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-blue-100 hover:bg-white/10'}`}
                >
                  <LayoutGrid className="w-4.5 h-4.5 shrink-0" />
                  <span>Home</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('catalog'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'catalog' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-blue-100 hover:bg-white/10'}`}
                >
                  <Search className="w-4.5 h-4.5 shrink-0" />
                  <span>Collections</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-blue-100 hover:bg-white/10'}`}
                >
                  <Package className="w-4.5 h-4.5 shrink-0" />
                  <span>My Orders</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('wallet'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'wallet' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-blue-100 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4.5 h-4.5 shrink-0" />
                    <span>Wallet</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                    {(currentUser.walletBalance || 0).toLocaleString()} THB
                  </span>
                </button>

                <button 
                  onClick={() => { setActiveTab('affiliate'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'affiliate' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-blue-100 hover:bg-white/10'}`}
                >
                  <Award className="w-4.5 h-4.5 shrink-0" />
                  <span>Affiliate Center</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('calculator'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'calculator' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-blue-100 hover:bg-white/10'}`}
                >
                  <Calculator className="w-4.5 h-4.5 shrink-0" />
                  <span>Price Calculator</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('support'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'support' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-blue-100 hover:bg-white/10'}`}
                >
                  <Sparkles className="w-4.5 h-4.5 shrink-0" />
                  <span>Gemologist Support</span>
                </button>

                <button 
                  onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-red-300 hover:bg-red-500/20 cursor-pointer mt-4 border border-red-500/20"
                >
                  <LogOut className="w-4.5 h-4.5 text-red-400 shrink-0" />
                  <span>Exit Store</span>
                </button>

              </div>
            </div>

            {/* Drawer Footer Social Box */}
            <div className="p-4 bg-[#182361] border-t border-blue-900/50 mt-2 shrink-0">
              <div className="bg-white rounded-full py-2 px-5 flex items-center justify-between text-[#1f2d78] shadow-lg max-w-[260px] mx-auto">
                <Facebook className="w-4 h-4 hover:scale-110 transition-transform cursor-pointer" />
                <Instagram className="w-4 h-4 hover:scale-110 transition-transform cursor-pointer" />
                <Twitter className="w-4 h-4 hover:scale-110 transition-transform cursor-pointer" />
                <Linkedin className="w-4 h-4 hover:scale-110 transition-transform cursor-pointer" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Dynamic Toasts */}
      <div className="fixed top-4 right-4 z-[9999999] space-y-2 max-w-sm pointer-events-none">
        {successToast && (
          <div className="p-3 bg-amber-500 text-slate-950 rounded-xl shadow-lg border border-amber-400 flex items-center gap-2 text-xs font-bold pointer-events-auto">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p>{successToast}</p>
          </div>
        )}
        {errorToast && (
          <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg border border-red-500 flex items-center gap-2 text-xs font-bold pointer-events-auto">
            <X className="w-4 h-4 shrink-0" />
            <p>{errorToast}</p>
          </div>
        )}
      </div>

      {/* Top Banner Offer */}
      <div className="bg-[#1f2d78] border-b border-blue-800/80 py-2.5 px-4 text-center">
        <p className="text-[11px] font-bold text-amber-400 tracking-wider flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>PHETMANY DIAMOND GRAND LAUNCH SPECIAL: USE PROMO CODE <strong className="text-white bg-amber-500/20 px-2 py-0.5 rounded ml-1 font-mono">PHETMANY34YEARS</strong> FOR 1.34% DIRECT DISCOUNT</span>
        </p>
      </div>

      {/* Navbar */}
      <header className="bg-[#1f2d78]/95 border-b border-blue-800/80 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-contain bg-white p-0.5 border border-blue-400/30" />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-sm sm:text-lg tracking-tight text-white uppercase">PHETMANY</span>
                <span className="bg-amber-500/15 text-amber-400 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-500/20">BOUTIQUE</span>
              </div>
              <p className="text-[9px] text-blue-200/80 uppercase font-bold tracking-widest mt-0.5">Exquisite Certified Diamonds</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* View tabs selector for desktop */}
            <nav className="hidden md:flex gap-1.5">
              <button 
                onClick={() => { setActiveTab('home'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'home' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-blue-100 hover:text-white hover:bg-white/10'}`}
              >
                Home
              </button>
              <button 
                onClick={() => { setActiveTab('catalog'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'catalog' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-blue-100 hover:text-white hover:bg-white/10'}`}
              >
                Collections
              </button>
              <button 
                onClick={() => { setActiveTab('orders'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-blue-100 hover:text-white hover:bg-white/10'}`}
              >
                My Orders
              </button>

              <button 
                onClick={() => { setActiveTab('wallet'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${activeTab === 'wallet' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-blue-100 hover:text-white hover:bg-white/10'}`}
              >
                <Wallet className="w-3.5 h-3.5 text-amber-500" />
                <span>Wallet ({(currentUser.walletBalance || 0).toLocaleString()} THB)</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('affiliate'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'affiliate' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-blue-100 hover:text-white hover:bg-white/10'}`}
              >
                Affiliate Center
              </button>

              <button 
                onClick={() => { setActiveTab('calculator'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'calculator' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-blue-100 hover:text-white hover:bg-white/10'}`}
              >
                Price Calculator
              </button>

              <button 
                onClick={() => { setActiveTab('support'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'support' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-blue-100 hover:text-white hover:bg-white/10'}`}
              >
                Gemologist Support
              </button>
            </nav>

            {/* Shopping Cart Trigger */}
            <button 
              onClick={() => setShowCart(!showCart)}
              className="relative p-2.5 bg-[#283895] border border-white/20 rounded-full text-amber-400 hover:text-amber-300 transition-all cursor-pointer shadow-inner"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#1f2d78]">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Desktop Logout button */}
            <button 
              onClick={onLogout}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-red-600/20 hover:bg-red-600 border border-red-400/30 text-red-300 hover:text-white text-xs font-black uppercase rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>

            {/* Mobile Hamburger menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 bg-[#283895] border border-white/20 rounded-lg text-white hover:bg-[#212d79] transition-all cursor-pointer shadow"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 0. HOME PAGE TAB */}
        {activeTab === 'home' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            
            {/* Banner Section */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[300px] md:min-h-[420px] flex items-center shadow-2xl">
              {isLoadingBanners ? (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/80 z-20">
                  <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Premium Media...</span>
                </div>
              ) : homeBanners.length === 0 ? (
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
                  <Sparkles className="w-12 h-12 text-amber-500 animate-pulse mb-4" />
                  <h1 className="font-display font-black text-2xl md:text-4xl text-white tracking-tight uppercase leading-tight max-w-2xl">
                    WELCOME TO PHETMANY BOUTIQUE
                  </h1>
                  <p className="text-slate-400 text-xs md:text-sm max-w-xl mt-3 font-medium">
                    Exquisite hand-selected certified diamonds and custom collector gemstone collections. Browse our luxury inventory and consult with experts.
                  </p>
                  <button 
                    onClick={() => setActiveTab('catalog')}
                    className="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-colors cursor-pointer"
                  >
                    Explore Collections
                  </button>
                </div>
              ) : (
                <>
                  {/* Banner slide image background */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={homeBanners[currentBannerIndex]?.image}
                      alt="Promotional Banner"
                      className="w-full h-full object-cover object-center animate-fade-in transition-all duration-1000"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {/* Visual dark styling overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent md:to-slate-950/20" />
                  </div>

                  {/* Banner overlay text and CTA */}
                  <div className="relative z-10 max-w-2xl text-left px-8 md:px-16 py-12 space-y-4 md:space-y-6">
                    <span className="bg-amber-500/15 text-amber-400 text-[10px] md:text-xs font-black px-3 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest inline-block animate-bounce">
                      Boutique Spotlight
                    </span>
                    <h1 className="font-display font-black text-xl md:text-4xl text-white tracking-tight uppercase leading-snug drop-shadow-lg">
                      {homeBanners[currentBannerIndex]?.title || 'EXQUISITE HIGH-CARAT CERTIFIED DIAMONDS'}
                    </h1>
                    <p className="text-slate-300 text-[11px] md:text-xs leading-relaxed font-medium drop-shadow">
                      Discover wholesale market pricing on diamonds certified by the GIA & IGI. Secure online orders, express insured courier dispatch worldwide, and custom VIP milestone referral cashbacks.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => setActiveTab('catalog')}
                        className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Acquire Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setActiveTab('calculator')}
                        className="px-5 py-3 bg-slate-900/80 hover:bg-slate-900 text-amber-400 hover:text-amber-300 border border-slate-800 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Markup Estimator</span>
                      </button>
                    </div>
                  </div>

                  {/* Manual Arrow Controls */}
                  {homeBanners.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentBannerIndex((prev) => (prev === 0 ? homeBanners.length - 1 : prev - 1))}
                        className="absolute left-4 p-2 bg-slate-900/60 hover:bg-slate-900 text-white hover:text-amber-400 border border-slate-800/50 rounded-full cursor-pointer z-20 transition-all"
                        aria-label="Previous banner"
                      >
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % homeBanners.length)}
                        className="absolute right-4 p-2 bg-slate-900/60 hover:bg-slate-900 text-white hover:text-amber-400 border border-slate-800/50 rounded-full cursor-pointer z-20 transition-all"
                        aria-label="Next banner"
                      >
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                      </button>

                      {/* Dots indicators */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                        {homeBanners.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentBannerIndex(idx)}
                            className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                              currentBannerIndex === idx ? 'bg-amber-500 w-4' : 'bg-slate-600 hover:bg-slate-400'
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Latest Arrivals Section */}
            <div className="space-y-6 text-left">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-850 pb-3">
                <div>
                  <h2 className="text-sm md:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                    <span>LATEST ARRIVALS</span>
                  </h2>
                  <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Our most recently imported certified wholesale stock additions
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="text-amber-400 hover:text-amber-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer self-start md:self-auto"
                >
                  <span>Browse Full Inventory</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...products]
                  .sort((a, b) => b.id.localeCompare(a.id))
                  .slice(0, 3)
                  .map((p) => (
                    <div key={p.id} className="bg-[#0C1224] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all relative group shadow-lg">
                      <div className="absolute top-3 right-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        New
                      </div>

                      <div className="space-y-3">
                        <div className="h-36 bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-850">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <Package className="w-8 h-8 text-slate-800" />
                        </div>

                        <div className="space-y-1 text-left">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                            STOCK: {p.Stock_NO || p.id}
                          </span>
                          <h3 className="text-xs font-black text-white uppercase tracking-wider truncate">
                            {p.carat.toFixed(2)}ct {p.Shape || p.cut} Diamond
                          </h3>
                          <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                            <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              Color: {p.color}
                            </span>
                            <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              Clarity: {p.clarity}
                            </span>
                            <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {p.certification}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-850/60 flex items-center justify-between gap-2">
                        <div className="text-left">
                          <p className="text-[9px] font-bold text-slate-500 uppercase">Wholesale Price</p>
                          <p className="text-xs font-mono font-black text-amber-400">
                            {p.price.toLocaleString()} THB
                          </p>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setViewProduct(p)}
                            className="p-2 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Inspect product"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAddToCart(p)}
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                          >
                            Acquire
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Featured Stones Section */}
            {products.some(p => p.isFeatured) && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-850 pb-3">
                  <h2 className="text-sm md:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>CURATED FEATURED STONES</span>
                  </h2>
                  <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Exclusive collections hand-selected for premier investment potential
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products
                    .filter(p => p.isFeatured)
                    .slice(0, 8)
                    .map((p) => (
                      <div key={p.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-850 hover:bg-slate-900/40 transition-all relative group shadow-lg">
                        <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          ★ Featured
                        </div>

                        <div className="space-y-3">
                          <div className="h-36 bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-850">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <Package className="w-8 h-8 text-slate-800" />
                          </div>

                          <div className="space-y-1 text-left">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                              STOCK: {p.Stock_NO || p.id}
                            </span>
                            <h3 className="text-xs font-black text-white uppercase tracking-wider truncate">
                              {p.carat.toFixed(2)}ct {p.Shape || p.cut} Diamond
                            </h3>
                            <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                              <span className="bg-[#0C1224] px-1.5 py-0.5 rounded border border-slate-800">
                                {p.color}
                              </span>
                              <span className="bg-[#0C1224] px-1.5 py-0.5 rounded border border-slate-800">
                                {p.clarity}
                              </span>
                              <span className="bg-[#0C1224] px-1.5 py-0.5 rounded border border-slate-800">
                                {p.certification}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-850/60 flex items-center justify-between gap-2">
                          <div className="text-left">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Wholesale Price</p>
                            <p className="text-xs font-mono font-black text-amber-400">
                              {p.price.toLocaleString()} THB
                            </p>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setViewProduct(p)}
                              className="p-2 bg-[#0C1224] text-slate-400 hover:text-white border border-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Inspect product"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAddToCart(p)}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                            >
                              Acquire
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Stone of the Day Spotlights */}
            {(() => {
              const sotd = products.find(p => p.isStoneOfTheDay) || products[0];
              if (!sotd) return null;
              return (
                <div className="space-y-6 text-left">
                  <div className="border-b border-slate-850 pb-3">
                    <h2 className="text-sm md:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>STONE OF THE DAY SPOTLIGHT</span>
                    </h2>
                    <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">
                      Highly coveted spotlight gem featuring live dynamic countdown and custom metrics
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-gradient-to-br from-[#0C1224] to-slate-950 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden items-center">
                    {/* Decorative gold backdrop gradient */}
                    <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/5 rounded-full filter blur-3xl -z-10" />

                    {/* Left: Product Images / 3D preview */}
                    <div className="lg:col-span-5 h-64 md:h-80 bg-slate-950/80 rounded-2xl overflow-hidden relative border border-slate-850 p-4 flex items-center justify-center">
                      <img
                        src={sotd.image}
                        alt={sotd.name}
                        className="h-full w-full object-contain animate-pulse duration-[3000ms]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                        ★ Daily Deal
                      </span>
                    </div>

                    {/* Right: Info and purchase metrics */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest block">
                          SPOTLIGHT ITEM ID: {sotd.Stock_NO || sotd.id}
                        </span>
                        <h3 className="font-display font-black text-xl md:text-3xl text-white tracking-tight uppercase leading-tight">
                          {sotd.carat.toFixed(2)} CARAT {sotd.Shape || 'BRILLIANT ROUND'}
                        </h3>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
                          {sotd.description || 'A masterpiece of precision-cut artistry. Exhibiting outstanding clarity and colour metrics that offer tremendous value retention for discerning gem collectors.'}
                        </p>
                      </div>

                      {/* Specs Row */}
                      <div className="grid grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-center font-mono">
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Color Grade</p>
                          <p className="text-sm font-black text-white mt-1">{sotd.color}</p>
                        </div>
                        <div className="border-x border-slate-800">
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Clarity</p>
                          <p className="text-sm font-black text-white mt-1">{sotd.clarity}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Certifier</p>
                          <p className="text-sm font-black text-amber-400 mt-1">{sotd.certification}</p>
                        </div>
                      </div>

                      {/* Pricing and Countdown Row */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2">
                        <div>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Wholesale Valuation</p>
                          <p className="text-xl md:text-2xl font-mono font-black text-amber-400 mt-1">
                            {sotd.price.toLocaleString()} THB
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">
                            Estimated Rapaport comparison: -13.5% below matrix
                          </p>
                        </div>

                        {/* Live Timer block */}
                        <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-xl space-y-1 text-center min-w-[160px]">
                          <span className="text-[9px] text-amber-400 font-black uppercase tracking-widest block">
                            Deal Expiry Countdown
                          </span>
                          <span className="text-sm font-mono font-black text-white flex items-center justify-center gap-1">
                            <span>{String(sotdTimeLeft.hours).padStart(2, '0')}h</span>
                            <span>:</span>
                            <span>{String(sotdTimeLeft.minutes).padStart(2, '0')}m</span>
                            <span>:</span>
                            <span>{String(sotdTimeLeft.seconds).padStart(2, '0')}s</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          onClick={() => handleAddToCart(sotd)}
                          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-xl flex items-center gap-1.5"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Instantly Acquire spotlighted gem</span>
                        </button>
                        <button
                          onClick={() => setViewProduct(sotd)}
                          className="px-5 py-3 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Verify Certificate Specs
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Exclusive Stones Section */}
            {products.some(p => p.isExclusive) && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-850 pb-3">
                  <h2 className="text-sm md:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500 animate-bounce" />
                    <span>EXCLUSIVE COLLECTOR GEMS</span>
                  </h2>
                  <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Ultra-rare certified diamonds with exceptional cut ratios and color-grades
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products
                    .filter(p => p.isExclusive)
                    .slice(0, 6)
                    .map((p) => (
                      <div key={p.id} className="bg-gradient-to-b from-slate-950 to-slate-900 border border-amber-500/10 hover:border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between hover:bg-slate-900/40 transition-all relative group shadow-lg">
                        <div className="absolute top-3 left-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          ✦ Exclusive
                        </div>

                        <div className="space-y-3">
                          <div className="h-40 bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-850">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <Package className="w-8 h-8 text-slate-800" />
                          </div>

                          <div className="space-y-1 text-left">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                              STOCK: {p.Stock_NO || p.id}
                            </span>
                            <h3 className="text-xs font-black text-white uppercase tracking-wider truncate">
                              {p.carat.toFixed(2)}ct {p.Shape || p.cut} Gem
                            </h3>
                            <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                              <span className="bg-[#0C1224] px-1.5 py-0.5 rounded border border-slate-800">
                                {p.color}
                              </span>
                              <span className="bg-[#0C1224] px-1.5 py-0.5 rounded border border-slate-800">
                                {p.clarity}
                              </span>
                              <span className="bg-[#0C1224] px-1.5 py-0.5 rounded border border-slate-800">
                                {p.certification}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-850/60 flex items-center justify-between gap-2">
                          <div className="text-left">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Premium Valuation</p>
                            <p className="text-xs font-mono font-black text-amber-400">
                              {p.price.toLocaleString()} THB
                            </p>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setViewProduct(p)}
                              className="p-2 bg-[#0C1224] text-slate-400 hover:text-white border border-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Inspect product"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAddToCart(p)}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                            >
                              Acquire
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* 1. DISCOVERY / CATALOG TAB */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Filter Column */}
            <aside className="lg:col-span-3 bg-[#0C1224] p-5 rounded-2xl border border-slate-800 text-left space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Refine Diamond Search</h3>
                </div>
                <button 
                  onClick={() => { setCaratFilter(0.5); setSelectedCut('All'); setSelectedColor('All'); setSelectedClarity('All'); }}
                  className="text-[10px] text-amber-400 font-bold uppercase hover:underline"
                >
                  Clear All
                </button>
              </div>

              {/* Keyword Search */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Keyword Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cut, clarity, carat..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Carat weight min slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Minimum Carats</span>
                  <span className="text-amber-400 font-mono text-xs">{caratFilter.toFixed(2)} ct</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="4.0" 
                  step="0.05"
                  value={caratFilter}
                  onChange={(e) => setCaratFilter(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Cut selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Girdle Cut Precision</label>
                <select 
                  value={selectedCut}
                  onChange={(e) => setSelectedCut(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="All">All Cuts</option>
                  <option value="Excellent">Excellent Precision</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              {/* Color grade selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Color Whiteness Grade</label>
                <select 
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="All">All Colors</option>
                  <option value="D">D - Colorless Perfection</option>
                  <option value="E">E - Ice White</option>
                  <option value="F">F - Exceptionally White</option>
                  <option value="G">G - Near Colorless</option>
                  <option value="H">H - Warm Tint</option>
                </select>
              </div>

              {/* Clarity Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Flawless/Clarity Grade</label>
                <select 
                  value={selectedClarity}
                  onChange={(e) => setSelectedClarity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-bold focus:outline-none"
                >
                  <option value="All">All Clarities</option>
                  <option value="FL">FL - Flawless perfection</option>
                  <option value="IF">IF - Internally Flawless</option>
                  <option value="VVS1">VVS1 - Microscopic Inclusions</option>
                  <option value="VVS2">VVS2 - Very Very Light Inclusion</option>
                  <option value="VS1">VS1 - Very Light Inclusion</option>
                  <option value="VS2">VS2 - Light Inclusion</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Every diamond in our collection is strictly vetted and laser inscribed with custom certificates.</p>
              </div>
            </aside>

            {/* Diamond Grid Column */}
            <div className="lg:col-span-9 space-y-5">
              
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-500" />
                  <span>Showing {filteredProducts.length} Premium Certified Diamonds</span>
                </h2>

                {/* Elegant View Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${viewMode === 'list' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    title="List View (Wholesale)"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    title="Grid View (Retail)"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Summary Statistics Bar as in the Image */}
              {filteredProducts.length > 0 && (
                <div className="grid grid-cols-5 gap-0.5 bg-[#0A1121] border border-slate-800/80 rounded-2xl overflow-hidden text-center divide-x divide-slate-800/60 shadow-lg">
                  <div className="py-3 px-1">
                    <div className="text-sm sm:text-base font-black text-white font-mono tracking-tight">{filteredProducts.length}</div>
                    <div className="text-[8px] sm:text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider">Pcs</div>
                  </div>
                  <div className="py-3 px-1">
                    <div className="text-sm sm:text-base font-black text-white font-mono tracking-tight">
                      {filteredProducts.reduce((sum, p) => sum + (p.carat || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-[8px] sm:text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider">Cts</div>
                  </div>
                  <div className="py-3 px-1">
                    <div className="text-sm sm:text-base font-black text-emerald-400 font-mono tracking-tight">
                      {(filteredProducts.length 
                        ? filteredProducts.reduce((sum, p) => {
                            const d = p.Rap__ && p.Rap__ !== 0 ? p.Rap__ : -(48 + (parseFloat(p.id.replace(/\D/g, '') || '5') % 150) / 10);
                            return sum + d;
                          }, 0) / filteredProducts.length 
                        : 0).toFixed(2)}%
                    </div>
                    <div className="text-[8px] sm:text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider">Disc %</div>
                  </div>
                  <div className="py-3 px-1">
                    <div className="text-sm sm:text-base font-black text-amber-400 font-mono tracking-tight">
                      {Math.round(filteredProducts.length 
                        ? filteredProducts.reduce((sum, p) => sum + (p.price / p.carat), 0) / filteredProducts.length 
                        : 0).toLocaleString()}
                    </div>
                    <div className="text-[8px] sm:text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider">Price/Cts</div>
                  </div>
                  <div className="py-3 px-1">
                    <div className="text-sm sm:text-base font-black text-amber-500 font-mono tracking-tight">
                      {filteredProducts.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-[8px] sm:text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider">Amount THB</div>
                  </div>
                </div>
              )}

              {filteredProducts.length === 0 ? (
                <div className="bg-[#0C1224] p-16 rounded-2xl border border-slate-800 text-center space-y-4">
                  <X className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-400 uppercase">No Diamonds Match Your Criteria</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Try widening your filters for minimum carat weight, or adjust the selected cut and clarity grades.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {viewMode === 'list' ? (
                    <div className="space-y-2.5">
                      {paginatedProducts.map((p) => {
                        const discount = p.Rap__ && p.Rap__ !== 0 ? p.Rap__ : -(48 + (parseFloat(p.id.replace(/\D/g, '') || '5') % 150) / 10);
                        const discountStr = (discount < 0 ? '' : '-') + Math.abs(discount).toFixed(2) + '%';
                        const pricePerCarat = p.Pr_Ct || Math.round(p.price / p.carat);
                        const pricePerCaratStr = pricePerCarat.toLocaleString() + ' THB/Cts';
                        const totalPriceStr = p.price.toLocaleString() + ' THB';
                        
                        // Specs string: Color Clarity Cut Polish Symmetry Fluorescent Lab
                        const cutAbbrev = p.cut === 'Excellent' ? 'EX' : p.cut === 'Very Good' ? 'VG' : p.cut === 'Good' ? 'GD' : 'EX';
                        const polishVal = p.Polish || 'EX';
                        const symmetryVal = p.Symmetry || 'EX';
                        const fluoroVal = p.Fluorescent || 'N';
                        const labVal = p.Lab || p.certification || 'GIA';
                        const specString = `${p.color} ${p.clarity} ${cutAbbrev} ${polishVal} ${symmetryVal} ${fluoroVal} ${labVal}`;

                        return (
                          <div 
                            key={p.id} 
                            className="flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-[#0C1224] border border-slate-800/80 rounded-2xl hover:border-amber-500/40 transition-all duration-300 gap-3 text-left"
                          >
                            {/* Left: Carat Circle Badge + Specs */}
                            <div className="flex items-center gap-3.5">
                              {/* Carat Badge */}
                              <div className="w-12 h-12 rounded-full bg-[#12192c] border border-slate-800 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[11px] font-black text-amber-400 font-mono tracking-tighter leading-none">{p.carat.toFixed(2)}</span>
                                <span className="text-[7.5px] text-indigo-400/80 font-black uppercase tracking-widest mt-0.5 leading-none">Carat</span>
                              </div>
                              
                              {/* Stock, Shape & Specs */}
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-black text-white font-mono tracking-wide">
                                    {p.Stock_NO || p.certId || p.id.split('_').pop()?.toUpperCase()}
                                  </span>
                                  <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 leading-none">
                                    {p.Shape || 'ROUND'}
                                  </span>
                                  {p.video360 && (
                                    <span className="text-[8px] text-sky-400 font-extrabold uppercase tracking-widest bg-sky-500/10 px-1 py-0.5 rounded flex items-center gap-0.5 border border-sky-500/20 leading-none">
                                      <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" /> 360° VIEW
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10.5px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                                  {specString}
                                </div>
                              </div>
                            </div>

                            {/* Right: Discount, Dimensions, Prices, and Actions */}
                            <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-800/40">
                              {/* Discount and Dimensions */}
                              <div className="text-left md:text-right space-y-0.5 min-w-[70px]">
                                <div className="text-[11.5px] font-bold text-emerald-400 font-mono tracking-tight">
                                  {discountStr}
                                </div>
                                <div className="text-[9.5px] text-slate-500 font-mono">
                                  {p.Measurement || '4.34-4.37x2.61'}
                                </div>
                              </div>

                              {/* Price per carat & Total Price */}
                              <div className="text-right space-y-0.5 min-w-[110px]">
                                <div className="text-[10.5px] font-bold text-sky-400 font-mono">
                                  {pricePerCaratStr}
                                </div>
                                <div className="text-[11.5px] font-black text-white font-mono">
                                  {totalPriceStr}
                                </div>
                              </div>

                              {/* Actions container */}
                              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800 shrink-0">
                                <button 
                                  onClick={() => { setViewProduct(p); setActiveMediaTab(p.video360 ? '360' : 'image'); }}
                                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                                  title="Interactive Specs View"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleAddToCart(p)}
                                  className="p-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-md transition-colors cursor-pointer"
                                  title="Add to Cart"
                                >
                                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginatedProducts.map((p) => (
                        <div key={p.id} className="bg-[#0C1224] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group hover:border-amber-500/40 transition-all duration-300">
                          
                          {/* Thumbnail with overlay tags */}
                          <div className="relative h-56 bg-slate-950 flex items-center justify-center overflow-hidden">
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs border border-amber-500/30 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                              {p.carat} ct
                            </div>
                            {p.video360 && (
                              <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-xs border border-slate-800 text-white text-[9px] font-black px-2 py-1 rounded-md flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                360° VIEW ACTIVE
                              </div>
                            )}
                          </div>

                          {/* Info and specs */}
                          <div className="p-5 text-left space-y-4 flex-1">
                            <div>
                              <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest block">{p.certification} CERTIFIED</span>
                              <h4 className="text-sm font-black text-white mt-1 uppercase tracking-wide truncate">{p.name}</h4>
                            </div>

                            {/* Specs bento */}
                            <div className="grid grid-cols-4 gap-1.5 bg-[#090D1A] p-2.5 rounded-xl border border-slate-800 text-center">
                              <div>
                                <span className="text-[8px] text-slate-500 font-bold block uppercase">Cut</span>
                                <span className="text-[10px] text-slate-200 block font-black truncate">{p.cut.split(' ')[0]}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 font-bold block uppercase">Color</span>
                                <span className="text-[10px] text-slate-200 block font-black">{p.color}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 font-bold block uppercase">Clarity</span>
                                <span className="text-[10px] text-slate-200 block font-black">{p.clarity}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 font-bold block uppercase">Carat</span>
                                <span className="text-[10px] text-amber-400 block font-black">{p.carat}</span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 font-medium">{p.description}</p>
                          </div>

                          {/* Actions footer */}
                          <div className="p-5 border-t border-slate-800 bg-[#0C1224]/80 flex items-center justify-between">
                            <div>
                              <span className="text-[8px] text-slate-500 font-black block uppercase tracking-wider">RETAIL VALUE</span>
                              <span className="font-mono text-sm font-black text-amber-400">{p.price.toLocaleString()} THB</span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => { setViewProduct(p); setActiveMediaTab(p.video360 ? '360' : 'image'); }}
                                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors cursor-pointer"
                                title="Interactive Specs View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleAddToCart(p)}
                                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                  {/* Elegant Pagination Control Footer */}
                  <div className="bg-[#0C1224] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>Items per page:</span>
                        <select 
                          value={itemsPerPage}
                          onChange={(e) => setItemsPerPage(Number(e.target.value))}
                          className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                        >
                          <option value={12}>12</option>
                          <option value={24}>24</option>
                          <option value={48}>48</option>
                          <option value={96}>96</option>
                        </select>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Showing <b>{filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</b> to <b>{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</b> of <b>{filteredProducts.length}</b> premium diamonds
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Dynamic page numbers window */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                          if (currentPage + 2 <= totalPages) {
                            pageNum = currentPage - 2 + i;
                          } else {
                            pageNum = totalPages - 4 + i;
                          }
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                              currentPage === pageNum
                                ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      {totalPages > 5 && currentPage + 2 < totalPages && (
                        <>
                          <span className="text-slate-600 px-1 font-mono text-xs">...</span>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                              currentPage === totalPages
                                ? 'bg-amber-500 border-amber-500 text-slate-950'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
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

          </div>
        )}

        {/* 2. LIVE ORDER TRACKING TAB */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            
            {/* Left side list */}
            <div className="lg:col-span-5 bg-[#0C1224] p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-800 pb-2.5">Your Orders Portfolio</h3>
              
              {customerOrders.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No active diamond transactions yet</p>
                  <button 
                    onClick={() => setActiveTab('catalog')}
                    className="px-3.5 py-2 bg-amber-500 text-slate-950 text-xs font-black uppercase rounded-lg"
                  >
                    Browse Collections
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((o) => (
                    <div 
                      key={o.id}
                      onClick={() => setSelectedTrackerOrder(o)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${activeTracker?.id === o.id ? 'bg-slate-900 border-amber-500' : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-black text-white">{o.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-800/50">
                        <div>
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">TOTAL AMOUNT</span>
                          <span className="font-mono text-xs font-black text-amber-400">{o.totalAmount.toLocaleString()} THB</span>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${o.shippingStatus === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {o.shippingStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tracker Details Column */}
            <div className="lg:col-span-7 bg-[#0C1224] p-6 rounded-2xl border border-slate-800 space-y-6">
              {activeTracker ? (
                <div className="space-y-6">
                  
                  {/* Title & tracking head */}
                  <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest">REAL-TIME ORDER ESCROW</span>
                      <h3 className="text-base font-black text-white font-mono mt-0.5">{activeTracker.invoiceNumber}</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Logged on {new Date(activeTracker.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      {activeTracker.trackingNumber ? (
                        <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest font-mono">
                          {activeTracker.trackingNumber}
                        </div>
                      ) : (
                        <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-lg">
                          Processing Transit
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar Stepper */}
                  <div className="bg-[#090D1A] p-5 rounded-2xl border border-slate-800">
                    <div className="relative flex justify-between items-center">
                      
                      {/* Center connecting progress line */}
                      <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-800 z-0" />
                      
                      {/* Active green connecting line */}
                      <div 
                        className="absolute left-6 top-5 h-0.5 bg-emerald-500 transition-all duration-500 z-0"
                        style={{
                          width: activeTracker.shippingStatus === 'Processing' ? '0%' :
                                 activeTracker.shippingStatus === 'Shipped' ? '33%' :
                                 activeTracker.shippingStatus === 'Out for Delivery' ? '66%' : '100%'
                        }}
                      />

                      {/* Step 1: Processing */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-[#0C1224] border-2 border-emerald-500 text-emerald-400 flex items-center justify-center font-black shadow-inner">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-200 mt-2 uppercase tracking-wider">Logged</span>
                      </div>

                      {/* Step 2: Shipped */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full bg-[#0C1224] border-2 text-center flex items-center justify-center font-black ${
                          ['Shipped', 'Out for Delivery', 'Delivered'].includes(activeTracker.shippingStatus) ? 'border-emerald-500 text-emerald-400' : 'border-slate-800 text-slate-500'
                        }`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-400 mt-2 uppercase tracking-wider">Shipped</span>
                      </div>

                      {/* Step 3: Out for delivery */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full bg-[#0C1224] border-2 text-center flex items-center justify-center font-black ${
                          ['Out for Delivery', 'Delivered'].includes(activeTracker.shippingStatus) ? 'border-emerald-500 text-emerald-400' : 'border-slate-800 text-slate-500'
                        }`}>
                          <Compass className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-400 mt-2 uppercase tracking-wider">In Transit</span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full bg-[#0C1224] border-2 text-center flex items-center justify-center font-black ${
                          activeTracker.shippingStatus === 'Delivered' ? 'border-emerald-500 text-emerald-400' : 'border-slate-800 text-slate-500'
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-400 mt-2 uppercase tracking-wider">Delivered</span>
                      </div>

                    </div>
                  </div>

                  {/* Order items and specifications */}
                  <div className="space-y-3">
                    <span className="text-[9px] text-slate-500 font-black block uppercase tracking-widest">TRANSACTED VALUABLES</span>
                    {activeTracker.items.map((it, idx) => (
                      <div key={idx} className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={it.product.image} className="w-12 h-12 object-cover rounded-lg" alt="" />
                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">{it.product.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{it.product.carat} Carat • {it.product.cut} Cut • {it.product.certification} Certified</p>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-black text-amber-400">{it.product.price.toLocaleString()} THB</span>
                      </div>
                    ))}
                  </div>

                  {/* Escrow log tracking history */}
                  <div className="space-y-4 pt-4 border-t border-slate-800/80">
                    <span className="text-[9px] text-slate-500 font-black block uppercase tracking-widest">ESCROW CARRIER AUDIT TRAIL</span>
                    <div className="space-y-3 relative border-l border-slate-800 pl-4 ml-2.5 text-left">
                      {activeTracker.trackingHistory.map((h, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-amber-500 border border-slate-900" />
                          <div className="text-[10px] text-slate-500 font-mono">{new Date(h.timestamp).toLocaleString()}</div>
                          <h5 className="text-xs font-extrabold text-slate-200 uppercase tracking-wide mt-0.5">{h.status}</h5>
                          <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{h.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-24 text-center">
                  <Truck className="w-12 h-12 text-slate-800 mx-auto" />
                  <p className="text-xs text-slate-500 uppercase tracking-widest mt-4">Select an active order to view live transit metrics</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* RAPAPORT PRICE CALCULATOR TAB */}
        {activeTab === 'calculator' && (
          <div className="space-y-6 text-left">
            {/* Header section with rich visual hierarchy */}
            <div className="bg-[#0C1224] p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Rapaport Matrix Calculator</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Calculate real-time certified diamond values utilizing Rapaport Technet benchmark pricing models and custom markups.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 self-start md:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider font-mono">Rapaport Index Online</span>
              </div>
            </div>

            {/* Main responsive grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Input Columns (Left/Form) */}
              <div className="lg:col-span-7 bg-[#0C1224] p-6 rounded-2xl border border-slate-800 space-y-6">
                <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                  <span>Diamond Specifications</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Shape Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Shape</label>
                    <select
                      value={calcShape}
                      onChange={(e) => setCalcShape(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-xs font-extrabold tracking-wide focus:outline-none focus:border-amber-500/50"
                    >
                      {CALC_SHAPES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Carat Weight with Preset Buttons */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Carat Weight</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="99.99"
                        value={calcWeight === 0 ? '' : calcWeight}
                        onChange={(e) => setCalcWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="Enter carat weight"
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl pl-4 pr-12 py-3 text-xs font-extrabold tracking-wide focus:outline-none focus:border-amber-500/50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono font-bold uppercase">CT</span>
                    </div>
                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[0.50, 0.70, 1.00, 1.50, 2.00, 3.00, 5.00].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setCalcWeight(preset)}
                          className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-all ${
                            calcWeight === preset
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {preset.toFixed(2)}ct
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color Selection (Grid of buttons) */}
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Color Grade</label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {CALC_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setCalcColor(color)}
                        className={`py-2 rounded-xl text-xs font-black transition-all ${
                          calcColor === color
                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10'
                            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clarity Selection (Grid of buttons) */}
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Clarity Grade</label>
                  <div className="grid grid-cols-4 sm:grid-cols-11 gap-1.5">
                    {CALC_CLARITIES.map((clarity) => (
                      <button
                        key={clarity}
                        onClick={() => setCalcClarity(clarity)}
                        className={`py-2 rounded-lg text-[10px] font-black transition-all ${
                          calcClarity === clarity
                            ? 'bg-amber-500 text-slate-950 shadow-lg'
                            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                        }`}
                      >
                        {clarity}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wholesale Markup Slider and Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Wholesale Margin / Markup (%)</label>
                    <div className="relative w-24">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={calcMarkup}
                        onChange={(e) => setCalcMarkup(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg pl-3 pr-6 py-1.5 text-xs font-bold text-right focus:outline-none focus:border-amber-500/50"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={calcMarkup}
                      onChange={(e) => setCalcMarkup(parseFloat(e.target.value))}
                      className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"
                    />
                    <div className="flex gap-1">
                      {[0, 10, 15, 20, 30].map((val) => (
                        <button
                          key={val}
                          onClick={() => setCalcMarkup(val)}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all border border-slate-800 ${
                            calcMarkup === val ? 'bg-slate-800 text-amber-400' : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Dynamic Results Column (Right/Results Card) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-[#0A1121] p-6 rounded-2xl border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
                  
                  {/* Subtle decorative diamond flare in background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                  <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800/80 pb-3 flex justify-between items-center">
                    <span>Valuation Summary</span>
                    <span className="text-[9px] text-slate-500 font-mono">1 USD = 35.15 THB</span>
                  </h3>

                  {isCalculating ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Re-evaluating Portfolio...</p>
                    </div>
                  ) : calcResult ? (
                    <div className="space-y-6">
                      {/* Big final price display */}
                      <div className="text-center bg-slate-950/40 p-5 rounded-xl border border-slate-800/60 shadow-inner">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Estimated Value (USD)</span>
                        <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                          ${calcResult.markupTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider mt-1.5 font-mono">
                          ≈ {(calcResult.markupTotal * 35.15).toLocaleString(undefined, { maximumFractionDigits: 0 })} THB
                        </div>
                      </div>

                      {/* Detailed breakdown */}
                      <div className="space-y-3.5 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Shape & Parameters</span>
                          <span className="text-white font-extrabold uppercase font-mono">{calcShape} ({calcWeight.toFixed(2)}ct, {calcColor}/{calcClarity})</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400">
                          <span>Rapaport List Price</span>
                          <span className="text-white font-extrabold font-mono">${calcResult.rawRate.toLocaleString()}/ct</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400">
                          <span>Base Raw Valuation</span>
                          <span className="text-white font-extrabold font-mono">${calcResult.rawTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 border-t border-slate-800/50 pt-3">
                          <span className="flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5 text-amber-500" />
                            <span>Margin Markup ({calcMarkup}%)</span>
                          </span>
                          <span className="text-amber-500 font-extrabold font-mono">+${calcResult.markupAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-200 border-t border-slate-800 pt-3 text-sm font-black">
                          <span>Final Price per Carat</span>
                          <span className="text-amber-400 font-mono">${calcResult.markupRate.toLocaleString(undefined, { minimumFractionDigits: 2 })} /ct</span>
                        </div>
                      </div>

                      {/* Interactive Actions */}
                      <div className="space-y-2.5 pt-2">
                        {/* 1. Add custom diamond to cart */}
                        <button
                          onClick={() => {
                            const customProd: Product = {
                              id: `custom_calc_${Date.now()}`,
                              name: `Custom ${calcWeight.toFixed(2)}ct ${calcShape} Diamond`,
                              cut: 'Excellent',
                              color: calcColor as any,
                              clarity: calcClarity as any,
                              carat: calcWeight,
                              certification: 'Rapaport Index',
                              certId: `RAP-${Math.floor(Math.random() * 900000 + 100000)}`,
                              price: calcResult.markupTotal,
                              stock: 1,
                              image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
                              images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400'],
                              description: `Custom Rapaport valuation. Shape: ${calcShape}, Carats: ${calcWeight.toFixed(2)}, Color: ${calcColor}, Clarity: ${calcClarity}, list index: $${calcResult.rawRate}/ct, plus ${calcMarkup}% wholesale margin.`,
                              status: 'In Stock',
                              Shape: calcShape.toUpperCase(),
                              Color_Shade: 'WH',
                              Rap_Rate: calcResult.rawRate,
                              Rap_Vlu: calcResult.rawTotal,
                              Pr_Ct: calcResult.markupRate,
                              Amount: calcResult.markupTotal,
                              CERT_NO: `RAP-${Math.floor(Math.random() * 900000 + 100000)}`,
                              Location: 'UPCOMING',
                              RO: 'NA',
                              Keytosymbol: 'Custom Calculation'
                            };
                            handleAddToCart(customProd);
                          }}
                          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 active:scale-[0.98]"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Custom Diamond to Cart</span>
                        </button>

                        {/* 2. Print Quote */}
                        <button
                          onClick={() => window.print()}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Official Price Quote</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                      Carat weight must be greater than zero.
                    </div>
                  )}

                </div>

                {/* Info Card */}
                <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-3">
                  <h4 className="text-[10px] text-amber-500 font-black uppercase tracking-wider">Index Specification Policy</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Values are sourced dynamically from the Rapaport Diamond Report (Technet pricing feeds). In the absence of direct server connection, a high-fidelity industry-standard benchmark multiplier is applied based on the standard GIA matrix. All values are subject to active market adjustments.
                  </p>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* 3. GEMOLOGIST CUSTOMER SERVICE TAB */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            
            {/* Ticket Selector Column */}
            <div className="lg:col-span-5 bg-[#0C1224] p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Vetted Inquiries Queue</h3>
                <button 
                  onClick={() => setShowCreateTicket(!showCreateTicket)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase rounded-lg"
                >
                  Create Inquiry
                </button>
              </div>

              {tickets.filter(t => t.userId === currentUser.id).length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs font-bold uppercase">No active support tickets. Click create inquiry above to connect with a gemologist.</div>
              ) : (
                <div className="space-y-2">
                  {tickets.filter(t => t.userId === currentUser.id).map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => setSelectedSupportTicket(t)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedSupportTicket?.id === t.id ? 'bg-slate-900 border-amber-500' : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-amber-500 font-extrabold">TICKET #{t.id}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${t.status === 'Open' ? 'bg-red-500/15 text-red-400 border-red-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {t.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white mt-2 uppercase truncate">{t.subject}</h4>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat or Create Ticket View */}
            <div className="lg:col-span-7 bg-[#0C1224] p-6 rounded-2xl border border-slate-800 flex flex-col justify-between min-h-[450px]">
              {showCreateTicket ? (
                <form onSubmit={handleCreateSupportTicket} className="space-y-4 text-left my-auto">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-800 pb-2.5">Initiate Vetted Concierge Inquiry</h3>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inquiry Subject / Topic</label>
                    <input 
                      type="text"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      placeholder="e.g., Diamond Clarity custom certification query"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detailed Question</label>
                    <textarea 
                      value={supportMsgText}
                      onChange={(e) => setSupportMsgText(e.target.value)}
                      placeholder="Specify your diamond specifications, certifications or shipping escrows..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white h-28 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button type="button" onClick={() => setShowCreateTicket(false)} className="px-3 py-1.5 text-xs font-bold text-slate-400">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase rounded-lg">Submit Ticket</button>
                  </div>
                </form>
              ) : selectedSupportTicket ? (
                <div className="flex flex-col justify-between h-full space-y-6">
                  
                  {/* Chat header */}
                  <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-amber-500 font-extrabold uppercase">ACTIVE CHAT</span>
                      <h4 className="text-xs font-black text-white mt-1 uppercase">{selectedSupportTicket.subject}</h4>
                    </div>
                    <span className="text-[10px] text-slate-500">Connecting...</span>
                  </div>

                  {/* Messages body */}
                  <div className="flex-1 overflow-y-auto space-y-3 bg-[#090D1A]/60 p-4 rounded-xl border border-slate-800/80 max-h-[250px]">
                    {selectedSupportTicket.messages.map((m) => (
                      <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] text-slate-500 font-bold">{m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        <div className={`p-3 rounded-2xl max-w-[85%] mt-1 text-xs leading-relaxed font-semibold ${m.sender === 'user' ? 'bg-amber-500 text-slate-950 rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none'}`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input 
                      type="text"
                      value={supportMsgText}
                      onChange={(e) => setSupportMsgText(e.target.value)}
                      placeholder="Awaiting connection. Send message to gemologist..."
                      className="bg-slate-900 border border-slate-800 rounded-xl text-xs px-3 py-2.5 text-white flex-1 focus:outline-none"
                    />
                    <button type="submit" className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase rounded-lg">
                      Send
                    </button>
                  </form>

                </div>
              ) : (
                <div className="py-24 my-auto text-center">
                  <MessageSquare className="w-12 h-12 text-slate-800 mx-auto" />
                  <p className="text-xs text-slate-500 uppercase tracking-widest mt-4">Select or create an active ticket queue to connect with our luxury concierge desk</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 4. AFFILIATE & REFUGEE COMMISSION DASHBOARD */}
        {activeTab === 'affiliate' && (
          <div className="space-y-8 text-left">
            
            {/* If NOT registered as an affiliate, show Benefits and Invitation Registration Form */}
            {!myAffiliateProfile ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Visual Banner and customizable program benefits */}
                <div className="lg:col-span-7 bg-[#0C1224] p-8 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="space-y-2">
                    <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest block font-mono">Affiliate Partnership Program</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-none">
                      Connect Clients. <br className="hidden sm:inline" /> Earn Triple-Tier Commission.
                    </h2>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    We offer one of the industry's most flexible and lucrative affiliate program suites for elite curators, brokers, and style icons. Provide exclusive discounts to your clientele while earning multiple commissions on every referral.
                  </p>

                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                      <span>Why Partner with Phetmany Diamonds?</span>
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                      {affiliateBenefits.length === 0 ? (
                        <div className="text-xs text-slate-500 italic">No program benefits loaded yet. Please contact support.</div>
                      ) : (
                        affiliateBenefits.map((benefit, bIdx) => (
                          <div key={bIdx} className="flex gap-3 items-start bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                            <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">✓</span>
                            <p className="text-xs text-slate-300 font-medium leading-relaxed">{benefit}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Instant customizable Coupon and registration generator form */}
                <div className="lg:col-span-5 bg-[#0C1224] p-6 rounded-3xl border border-slate-800 space-y-6">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Instant Portfolio Access</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Submit desired coupon code below to activate your program instantly.</p>
                  </div>

                  {isLoadingAffState ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                      <span className="text-[10px] uppercase font-mono text-slate-500">Creating affiliate profile...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Full Partner Name</label>
                        <input
                          type="text"
                          disabled
                          value={currentUser.fullName}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-500 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Email Address</label>
                        <input
                          type="text"
                          disabled
                          value={currentUser.email}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-500 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Desired Referral Coupon Code</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="E.g., MYLUXURY10"
                            value={desiredCouponCode}
                            onChange={(e) => setDesiredCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-4 pr-16 py-3 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                          />
                          <span className="absolute right-3.5 top-3.5 font-mono text-[9px] text-slate-500 font-extrabold uppercase">CODE</span>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-snug">
                          Your followers will get <strong className="text-emerald-400">10% discount</strong> on all diamonds checkout, and you'll earn a combination of commissions on every order!
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          if (!desiredCouponCode || desiredCouponCode.length < 3) {
                            showToast("Please enter a valid desired coupon code (min 3 characters).", true);
                            return;
                          }
                          setIsJoiningProgram(true);
                          try {
                            const newAff: AffiliateProfile = {
                              id: `aff_${Date.now()}`,
                              userId: currentUser.id,
                              fullName: currentUser.fullName,
                              email: currentUser.email,
                              couponCode: desiredCouponCode,
                              discountPercent: 10,
                              commissionPerProduct: 500, // default rules
                              commissionPerOrder: 1000,
                              commissionPercent: 5,
                              status: 'Active', // Auto-activated to give instant access
                              clicks: 0,
                              createdAt: new Date().toISOString()
                            };
                            await saveAffiliateProfile(newAff);
                            showToast(`Congratulations! Your custom referral coupon ${desiredCouponCode} is now ACTIVE!`);
                            setDesiredCouponCode('');
                            loadMyAffiliateState();
                          } catch (e) {
                            showToast("Registration failed: " + String(e), true);
                          } finally {
                            setIsJoiningProgram(false);
                          }
                        }}
                        disabled={isJoiningProgram}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                      >
                        {isJoiningProgram ? "Processing Registration..." : "Agree & Activate Program"}
                      </button>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              
              /* RENDER ACTIVE AFFILIATE DASHBOARD BOARD */
              <div className="space-y-8">
                
                {/* Welcome header */}
                <div className="bg-[#0C1224] p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500 animate-pulse" />
                      <h2 className="text-lg font-black text-white uppercase tracking-wider">Partner Portfolio Suite</h2>
                    </div>
                    <p className="text-xs text-slate-400">
                      Welcome back, {myAffiliateProfile.fullName}. Your referral coupon code is active and tracking live.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-wider font-mono">Live Tracking Active</span>
                  </div>
                </div>

                {/* Statistics panel metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Total Link Clicks</span>
                      <div className="text-2xl font-black font-mono text-white">
                        {myAffiliateProfile.clicks || 0} <span className="text-xs text-slate-500">clicks</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Share2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Referred Conversions</span>
                      <div className="text-2xl font-black font-mono text-white">
                        {myReferredOrders.length} <span className="text-xs text-slate-500">orders</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Total Commission Earned</span>
                      <div className="text-2xl font-black font-mono text-amber-400">
                        {(myReferredOrders.reduce((sum, curr) => sum + curr.commissionEarned, 0)).toLocaleString()} THB
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Percent className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* LEFT COLUMN: ACTIVE REVENUE CALCULATIONS & GENERATOR */}
                  <div className="lg:col-span-5 space-y-6">

                    {/* VIP Partner Loyalty Tiers & Milestone Tracker */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Award className={`w-4 h-4 ${tierIconColor}`} />
                          <span>Partner Loyalty Tiers</span>
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${tierColor}`}>
                          {currentTier}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Referred Sales Volume:</span>
                          <span className="font-mono text-white font-bold">{totalReferredVolume.toLocaleString()} / {nextTierRequirement.toLocaleString()} THB</span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        {remainingForNext > 0 ? (
                          <p className="text-[10px] text-slate-400">
                            Generate <strong className="text-amber-500 font-mono">{remainingForNext.toLocaleString()} THB</strong> more in referred volume to level up to <strong className="text-white">{nextTier}</strong>!
                          </p>
                        ) : (
                          <p className="text-[10px] text-emerald-400 font-bold">
                            ★ Congratulations! You have achieved the highest possible affiliate partnership rank!
                          </p>
                        )}
                      </div>

                      {/* Tier Perks Breakdown */}
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px]">
                        <div className="p-2 bg-slate-900 border border-slate-850 rounded-lg space-y-1">
                          <span className="text-slate-500 uppercase font-bold text-[8px] block">Bronze Rank</span>
                          <span className="text-white block font-bold font-mono">&lt; 250k Vol</span>
                          <span className="text-slate-400 block">5% Commission</span>
                        </div>
                        <div className="p-2 bg-slate-900 border border-slate-850 rounded-lg space-y-1">
                          <span className="text-slate-500 uppercase font-bold text-[8px] block">Silver Rank</span>
                          <span className="text-white block font-bold font-mono">250k - 1M Vol</span>
                          <span className="text-amber-500 block">7% Commission</span>
                        </div>
                        <div className="p-2 bg-slate-900 border border-slate-850 rounded-lg space-y-1">
                          <span className="text-slate-500 uppercase font-bold text-[8px] block">Gold Rank</span>
                          <span className="text-white block font-bold font-mono">1M+ Vol</span>
                          <span className="text-amber-400 block font-black">10% Commission</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Active Coupon Settings */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                        <Percent className="w-4 h-4 text-amber-500" />
                        <span>Active Commission Multipliers</span>
                      </h3>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Your referral profile receives a custom combination of <strong className="text-amber-400">three-tier commission rules</strong>. These are applied automatically when your clients checkout using your coupon.
                      </p>

                      <div className="space-y-2 text-xs pt-1">
                        <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                          <span className="text-slate-400">1. Fixed "Per Product" Sold:</span>
                          <span className="font-mono text-white font-bold">{myAffiliateProfile.commissionPerProduct.toLocaleString()} THB</span>
                        </div>

                        <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                          <span className="text-slate-400">2. Fixed "Per Order" Referred:</span>
                          <span className="font-mono text-white font-bold">{myAffiliateProfile.commissionPerOrder.toLocaleString()} THB</span>
                        </div>

                        <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                          <span className="text-slate-400">3. Percentage of Order Value:</span>
                          <span className="font-mono text-emerald-400 font-bold">{myAffiliateProfile.commissionPercent}% Of Order</span>
                        </div>
                      </div>

                      <div className="bg-[#0C1224] p-3 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-snug">
                        💡 <strong className="text-white">Triple-tier Flexibility</strong>: If a client orders 3 diamonds on a single checkout, you earn 3x Per-Product commission + 1x Per-Order commission + Percentage of the order value!
                      </div>
                    </div>

                    {/* Referral Link URL Generator */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                        <Link className="w-4 h-4 text-amber-500" />
                        <span>Personalized Link Generator</span>
                      </h3>

                      <p className="text-[11px] text-slate-400">
                        Share this unique destination link with your followers. It automatically registers the affiliate coupon inside their session and highlights your partner status.
                      </p>

                      <div className="space-y-3 pt-1">
                        <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl select-all font-mono text-[10px] text-slate-300 break-all leading-normal">
                          {window.location.origin + "/?ref=" + myAffiliateProfile.couponCode}
                        </div>

                        <button
                          onClick={() => {
                            const refLink = window.location.origin + "/?ref=" + myAffiliateProfile.couponCode;
                            navigator.clipboard.writeText(refLink);
                            setCopiedReferralLink(true);
                            showToast("Referral link successfully copied to clipboard!");
                            setTimeout(() => setCopiedReferralLink(false), 2000);
                          }}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {copiedReferralLink ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>Copied Link!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy Destination Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Interactive Commission Simulator & Projection Slider */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
                      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-amber-500" />
                          <span>Interactive Income Simulator</span>
                        </h3>
                        <span className="text-[9px] font-mono font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase">Live Calculator</span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-normal">
                        Project your potential earnings by adjusting the sliders below based on your active partner commission rates.
                      </p>

                      <div className="space-y-4">
                        {/* Slider 1: Expected Referrals */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Monthly Referred Sales:</span>
                            <span className="font-mono text-white font-bold">{simReferrals} orders</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="30"
                            step="1"
                            value={simReferrals}
                            onChange={(e) => setSimReferrals(parseInt(e.target.value))}
                            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"
                          />
                        </div>

                        {/* Slider 2: Average Order Value */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Avg. Diamond Subtotal:</span>
                            <span className="font-mono text-white font-bold">{(simAvgPrice).toLocaleString()} THB</span>
                          </div>
                          <input
                            type="range"
                            min="20000"
                            max="500000"
                            step="10000"
                            value={simAvgPrice}
                            onChange={(e) => setSimAvgPrice(parseInt(e.target.value))}
                            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"
                          />
                        </div>

                        {/* Slider 3: Average Items Per Order */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Avg. Items Per Order:</span>
                            <span className="font-mono text-white font-bold">{simAvgItems} {simAvgItems === 1 ? 'item' : 'items'}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={simAvgItems}
                            onChange={(e) => setSimAvgItems(parseInt(e.target.value))}
                            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"
                          />
                        </div>
                      </div>

                      {/* Earnings Projections Results */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 text-left space-y-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Monthly Estimated</span>
                          <span className="text-md font-black text-emerald-400 font-mono">
                            {(
                              (myAffiliateProfile.commissionPerProduct * simAvgItems * simReferrals) + 
                              (myAffiliateProfile.commissionPerOrder * simReferrals) + 
                              Math.round((simAvgPrice * 0.9) * (myAffiliateProfile.commissionPercent / 100) * simReferrals)
                            ).toLocaleString()} THB
                          </span>
                        </div>
                        <div className="bg-[#0C1224] p-3 rounded-xl border border-slate-800 text-left space-y-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Annual Estimated</span>
                          <span className="text-md font-black text-amber-400 font-mono">
                            {(
                              ((myAffiliateProfile.commissionPerProduct * simAvgItems * simReferrals) + 
                              (myAffiliateProfile.commissionPerOrder * simReferrals) + 
                              Math.round((simAvgPrice * 0.9) * (myAffiliateProfile.commissionPercent / 100) * simReferrals)) * 12
                            ).toLocaleString()} THB
                          </span>
                        </div>
                      </div>

                      {/* Detail Breakdown */}
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850/50 text-[10px] space-y-1.5 font-mono text-slate-400">
                        <div className="flex justify-between">
                          <span>Per-Product Share:</span>
                          <span className="text-slate-300">{(myAffiliateProfile.commissionPerProduct * simAvgItems * simReferrals).toLocaleString()} THB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Per-Order Share:</span>
                          <span className="text-slate-300">{(myAffiliateProfile.commissionPerOrder * simReferrals).toLocaleString()} THB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Percentage Share ({myAffiliateProfile.commissionPercent}%):</span>
                          <span className="text-slate-300">{Math.round((simAvgPrice * 0.9) * (myAffiliateProfile.commissionPercent / 100) * simReferrals).toLocaleString()} THB</span>
                        </div>
                      </div>
                    </div>

                    {/* Official Ambassador Social Toolkit & Creative Materials */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-amber-500" />
                        <span>Ambassador Marketing Media Kit</span>
                      </h3>

                      <p className="text-[11px] text-slate-400 leading-normal">
                        Use our high-end marketing creatives and copywriting templates to promote your custom coupon across your network.
                      </p>

                      {/* Copy Paste Captions */}
                      <div className="space-y-3 pt-1">
                        {/* Caption 1: Instagram */}
                        <div className="space-y-1.5 text-left bg-slate-900 p-3 rounded-xl border border-slate-850">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase font-mono">Instagram & Social Copy</span>
                            <button
                              onClick={() => {
                                const cap = `Exclusive VIP Diamond Offer! ✨💎 Get a GIA-certified diamond with an exclusive ${myAffiliateProfile.discountPercent}% discount from @PhetmanyDiamonds. Enter my partner coupon: ${myAffiliateProfile.couponCode} at checkout. Direct link: ${window.location.origin}/?ref=${myAffiliateProfile.couponCode}`;
                                navigator.clipboard.writeText(cap);
                                setCopiedCaptionText('insta');
                                showToast("Social caption copied!");
                                setTimeout(() => setCopiedCaptionText(null), 2500);
                              }}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase font-mono cursor-pointer flex items-center gap-1"
                            >
                              {copiedCaptionText === 'insta' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedCaptionText === 'insta' ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-300 line-clamp-3 leading-relaxed font-serif">
                            "Exclusive VIP Diamond Offer! ✨💎 Get a GIA-certified diamond with an exclusive {myAffiliateProfile.discountPercent}% discount from @PhetmanyDiamonds. Enter my partner coupon: <strong className="text-amber-400">{myAffiliateProfile.couponCode}</strong> at checkout. Direct link: {window.location.origin}/?ref={myAffiliateProfile.couponCode}"
                          </p>
                        </div>

                        {/* Caption 2: Personal Email Invite */}
                        <div className="space-y-1.5 text-left bg-slate-900 p-3 rounded-xl border border-slate-850">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase font-mono">Newsletter & Email Invite</span>
                            <button
                              onClick={() => {
                                const cap = `Subject: Bespoke Diamond VIP Offer - ${myAffiliateProfile.discountPercent}% Savings courtesy of ${myAffiliateProfile.fullName}\n\nI am thrilled to announce an official partnership with Phetmany Diamonds. As an elite partner, I am extending a VIP ${myAffiliateProfile.discountPercent}% discount on their entire loose diamond and high-jewelry catalog. \n\nSimply enter coupon code: ${myAffiliateProfile.couponCode} during checkout to receive direct savings and bespoke boutique support. \n\nDirect Portfolio Access: ${window.location.origin}/?ref=${myAffiliateProfile.couponCode}`;
                                navigator.clipboard.writeText(cap);
                                setCopiedCaptionText('email');
                                showToast("Email template copied!");
                                setTimeout(() => setCopiedCaptionText(null), 2500);
                              }}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase font-mono cursor-pointer flex items-center gap-1"
                            >
                              {copiedCaptionText === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedCaptionText === 'email' ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-300 line-clamp-3 leading-relaxed font-serif">
                            "Subject: Bespoke Diamond VIP Offer - {myAffiliateProfile.discountPercent}% Savings courtesy of {myAffiliateProfile.fullName}\n\nI am thrilled to announce an official partnership with Phetmany Diamonds..."
                          </p>
                        </div>

                        {/* VIP Graphic Voucher Preview */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950 p-5 rounded-xl border border-amber-500/30 text-center shadow-lg space-y-3.5 select-none">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent)] pointer-events-none" />
                          <div className="absolute top-2 left-2 border-l border-t border-amber-500/40 w-4 h-4" />
                          <div className="absolute top-2 right-2 border-r border-t border-amber-500/40 w-4 h-4" />
                          <div className="absolute bottom-2 left-2 border-l border-b border-amber-500/40 w-4 h-4" />
                          <div className="absolute bottom-2 right-2 border-r border-b border-amber-500/40 w-4 h-4" />

                          <div className="space-y-0.5">
                            <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest font-mono">Phetmany Diamonds</span>
                            <span className="text-[7px] text-slate-500 uppercase tracking-widest block font-mono">Official Ambassador Portfolio</span>
                          </div>

                          <div className="py-2.5 border-y border-amber-500/20 my-1">
                            <div className="text-xs text-slate-300 uppercase font-serif tracking-wide">{myAffiliateProfile.fullName}</div>
                            <div className="text-xs font-black text-white font-mono uppercase tracking-widest mt-1">
                              COUPON: <span className="text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-amber-500/30">{myAffiliateProfile.couponCode}</span>
                            </div>
                          </div>

                          <div className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase">
                            VIP {myAffiliateProfile.discountPercent}% DISCOUNT APPLIED ON CHECKOUT
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN: RECENT REFERRED TRANSACTIONS */}
                  <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                    
                    <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <span>Referred Order Portfolio & Payouts</span>
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">Commission Ledger</span>
                    </div>

                    {myReferredOrders.length === 0 ? (
                      <div className="py-20 text-center text-xs text-slate-500 italic">
                        No referrals recorded yet. Distribute your referral link or coupon {myAffiliateProfile.couponCode} to generate commission.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="divide-y divide-slate-850">
                          {myReferredOrders.map((ref) => (
                            <div key={ref.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-left">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-extrabold text-white text-sm">{ref.customerName}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">({ref.orderId})</span>
                                  
                                  {/* Payout Status Badges */}
                                  {ref.payoutStatus === 'Paid' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase tracking-wider font-mono flex items-center gap-1 shrink-0">
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                      <span>Paid & Settled</span>
                                    </span>
                                  ) : ref.payoutStatus === 'Pending' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8px] font-black uppercase tracking-wider font-mono flex items-center gap-1 shrink-0">
                                      <Clock className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                                      <span>Processing</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[8px] font-black uppercase tracking-wider font-mono flex items-center gap-1 shrink-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                      <span>Unpaid Ledger</span>
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-[11px] text-slate-400">
                                  Order Value: <strong className="text-white font-mono">{(ref.orderTotal).toLocaleString()} THB</strong> | Discount Applied: <strong className="text-slate-400 font-mono">{ref.discountAmount.toLocaleString()} THB</strong>
                                </p>

                                <p className="text-[10px] text-slate-500 font-mono">
                                  Date referred: {new Date(ref.createdAt).toLocaleDateString()}
                                </p>

                                {/* Render payout details if exists */}
                                {ref.payoutStatus === 'Paid' && (
                                  <div className="bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 text-[10px] text-slate-400 font-mono space-y-0.5">
                                    <div className="text-emerald-400 font-bold">Settlement Details:</div>
                                    <div>Date Paid: {ref.payoutDate ? new Date(ref.payoutDate).toLocaleDateString() : 'N/A'}</div>
                                    {ref.payoutNotes && <div>Transaction Ref: {ref.payoutNotes}</div>}
                                  </div>
                                )}

                                {ref.payoutStatus === 'Pending' && ref.payoutNotes && (
                                  <div className="bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 text-[10px] text-slate-400 font-mono">
                                    <span className="text-amber-500 font-bold">Payout Notes: </span> {ref.payoutNotes}
                                  </div>
                                )}
                              </div>

                              <div className="text-left md:text-right self-start md:self-auto space-y-1">
                                <span className="block text-amber-400 font-black text-sm font-mono">+{ref.commissionEarned.toLocaleString()} THB</span>
                                <div className="text-[9px] text-slate-500 font-mono leading-normal">
                                  Breakdown: <br />
                                  Prod: {ref.commissionBreakdown.perProduct.toLocaleString()} THB <br />
                                  Order: {ref.commissionBreakdown.perOrder.toLocaleString()} THB <br />
                                  Pct ({myAffiliateProfile.commissionPercent}%): {ref.commissionBreakdown.percent.toLocaleString()} THB
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Informative footer */}
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 text-[11px] text-slate-400 space-y-1.5 leading-relaxed text-left">
                          <h4 className="text-white font-black uppercase tracking-wider text-[10px]">How do payout cycles work?</h4>
                          <p>
                            We audit referred sales and automatically disburse partner commissions on the <strong className="text-white">1st day of every month</strong>. Once a payout is authorized, the status will move to <span className="text-amber-500">Processing</span>, and then to <span className="text-emerald-400">Paid & Settled</span> with full bank reference numbers logged in your ledger.
                          </p>
                          <p>
                            For change of payout bank coordinates or questions, please open an inquiry in the <strong className="text-white">Support Desk</strong> tab.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* 5. PHETMANY DIGITAL WALLET & TOP-UP SUITE */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-start">
            
            {/* Left Column: Wallet Balance & Top-Up Panel */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Premium Metallic Balance Card */}
              <div className="bg-gradient-to-br from-slate-900 via-[#10182C] to-[#0A0E1A] p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">SECURED CLIENT BALANCE</span>
                    <h3 className="text-3xl font-black text-white mt-1 flex items-baseline gap-1.5">
                      <span className="text-amber-500 font-sans font-medium text-lg">THB</span>
                      <span className="font-mono text-amber-400">{(currentUser.walletBalance || 0).toLocaleString()}</span>
                    </h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
                    <Wallet className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <div className="mt-8 space-y-2 border-t border-slate-800/80 pt-4 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Secured Escrow Vault</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Online & Protected
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed">
                    Fund your wallet balance securely using bank wire transfer or standard UPI channels. Once verified, wallet funds can be used for instant, single-click diamond purchases without third-party clearance delays.
                  </p>
                </div>
              </div>

              {/* Interactive Top-Up Form */}
              <div className="bg-[#0C1224] p-6 rounded-3xl border border-slate-800 space-y-5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3">Fund Wallet Balance</h3>
                
                {topUpStep === 'completed' ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                      <Check className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-white text-xs font-black uppercase tracking-wide">Deposit Ledger Request Submitted</h4>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Our store administrators are verifying your transaction with the bank. Status logs will update automatically inside your transaction ledger.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTopUpStep('form')}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Initialize Another Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (topUpAmount <= 0) {
                      showToast('Please enter a valid deposit amount.', true);
                      return;
                    }
                    if (topUpGateway === 'UPI' && !upiTxId.trim()) {
                      showToast('Please input the 12-digit UPI transaction reference ID.', true);
                      return;
                    }
                    if (topUpGateway === 'Wire Transfer' && !paymentSlipBase64) {
                      showToast('Please upload your wire transfer payment slip.', true);
                      return;
                    }

                    setTopUpStep('submitting');
                    try {
                      await createWalletTransaction(
                        currentUser.id,
                        currentUser.username,
                        currentUser.email,
                        topUpAmount,
                        topUpGateway,
                        {
                          paymentSlipUrl: topUpGateway === 'Wire Transfer' ? paymentSlipBase64 : undefined,
                          upiTransactionId: topUpGateway === 'UPI' ? upiTxId : undefined,
                          notes: topUpNotes
                        }
                      );
                      showToast('Deposit request submitted successfully! Awaiting administrator audit.');
                      setTopUpStep('completed');
                      loadClientWalletData();
                      setUpiTxId('');
                      setPaymentSlipBase64('');
                      setPaymentSlipFileName('');
                      setTopUpNotes('');
                    } catch (err: any) {
                      showToast(err.message || 'Failed to submit top-up request', true);
                      setTopUpStep('form');
                    }
                  }} className="space-y-4">
                    
                    {/* Amount Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Top-Up Amount (THB)</label>
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(Number(e.target.value))}
                        disabled={topUpStep === 'submitting'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 font-mono text-sm"
                      />
                    </div>

                    {/* Gateway Select */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Select Gateway Channel</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => { setTopUpGateway('UPI'); setPaymentSlipBase64(''); setPaymentSlipFileName(''); }}
                          disabled={topUpStep === 'submitting'}
                          className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            topUpGateway === 'UPI' 
                              ? 'bg-amber-500/10 border-amber-500 text-white' 
                              : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <QrCode className="w-5 h-5 text-amber-500" />
                          <span className="text-xs font-bold block">UPI Transfer</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => { setTopUpGateway('Wire Transfer'); setUpiTxId(''); }}
                          disabled={topUpStep === 'submitting'}
                          className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            topUpGateway === 'Wire Transfer' 
                              ? 'bg-amber-500/10 border-amber-500 text-white' 
                              : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <CreditCard className="w-5 h-5 text-blue-500" />
                          <span className="text-xs font-bold block">Wire Transfer</span>
                        </button>
                      </div>
                    </div>

                    {/* Conditional: UPI Details */}
                    {topUpGateway === 'UPI' && (
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                        <div className="flex flex-col items-center space-y-2 text-center">
                          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Simulated UPI Endpoint QR</span>
                          <div className="bg-white p-3 rounded-xl w-32 h-32 flex flex-col items-center justify-center">
                            <QrCode className="w-24 h-24 text-[#0C1224]" />
                          </div>
                          <p className="text-[9px] text-slate-500 max-w-xs">
                            Scan to pay exactly <strong className="text-amber-500 font-mono">{topUpAmount.toLocaleString()} THB</strong>.
                          </p>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">UPI Transaction Reference ID</label>
                          <input
                            type="text"
                            placeholder="Enter 12-digit transaction ID"
                            value={upiTxId}
                            onChange={(e) => setUpiTxId(e.target.value.replace(/[^0-9]/g, ''))}
                            maxLength={12}
                            disabled={topUpStep === 'submitting'}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* Conditional: Bank Wire Details */}
                    {topUpGateway === 'Wire Transfer' && (
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-4">
                        <div className="text-xs space-y-2 leading-relaxed">
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Phetmany Bank Accounts</span>
                          <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 font-mono text-[10.5px] space-y-1 text-slate-300">
                            <p>Bank: <strong className="text-white">Phetmany Bank (Thailand), Ltd.</strong></p>
                            <p>Account Name: <strong className="text-white">Phetmany Diamonds Int'l Co., Ltd.</strong></p>
                            <p>Account Number: <strong className="text-amber-400">882-0-44910-1</strong></p>
                            <p>SWIFT Code: <strong className="text-white">PHETTHBK</strong></p>
                          </div>
                        </div>

                        {/* File Upload with Drag & Drop or Click */}
                        <div className="space-y-1.5 text-xs">
                          <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Upload Payment Slip Image</label>
                          <div className="border border-dashed border-slate-800 hover:border-amber-500 rounded-xl p-4 bg-slate-900 text-center relative cursor-pointer group transition-all">
                            <input
                              type="file"
                              accept="image/*"
                              disabled={topUpStep === 'submitting'}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    showToast('Receipt slip image exceeds 2MB size limit.', true);
                                    return;
                                  }
                                  setPaymentSlipFileName(file.name);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setPaymentSlipBase64(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <Upload className="w-6 h-6 text-slate-500 group-hover:text-amber-400 mx-auto mb-1.5 transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-wider block text-slate-400 group-hover:text-slate-200">
                              {paymentSlipFileName || 'Select or Drag Receipt Slip'}
                            </span>
                            <span className="text-[8.5px] text-slate-500 mt-0.5 block">JPEG, PNG up to 2MB</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transaction Notes */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Comments / Notes (Optional)</label>
                      <input
                        type="text"
                        placeholder="E.g., Sent from SCB account, urgent order"
                        value={topUpNotes}
                        onChange={(e) => setTopUpNotes(e.target.value)}
                        disabled={topUpStep === 'submitting'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={topUpStep === 'submitting'}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      {topUpStep === 'submitting' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Filing Request...</span>
                        </>
                      ) : (
                        <span>Submit Deposit Request</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Right Column: Transaction History Ledger */}
            <div className="lg:col-span-6 bg-[#0C1224] p-6 rounded-3xl border border-slate-800 space-y-4 min-h-[500px]">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Transaction Ledger</h3>
                <button
                  onClick={loadClientWalletData}
                  className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white border border-slate-850"
                  title="Refresh Ledger"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClientWallet ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingClientWallet ? (
                <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                  <span>Loading Wallet Ledger...</span>
                </div>
              ) : clientWalletTransactions.length === 0 ? (
                <div className="py-24 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-800 mx-auto" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No wallet activities found</p>
                  <p className="text-[10px] text-slate-600 max-w-xs mx-auto leading-relaxed">
                    Once you request a top-up or purchase products using your balance, the ledger transactions will be printed here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-850 max-h-[600px] overflow-y-auto pr-1">
                  {clientWalletTransactions.map((tx) => {
                    const isPending = tx.status === 'Pending';
                    const isApproved = tx.status === 'Approved';
                    const isRejected = tx.status === 'Rejected';

                    return (
                      <div key={tx.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                        <div className="flex justify-between items-start gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-white">{tx.id}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                tx.paymentGateway === 'UPI' 
                                  ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400' 
                                  : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                              }`}>
                                {tx.paymentGateway}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {new Date(tx.createdAt).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="text-right space-y-1">
                            <span className="font-mono font-black text-amber-400">+{tx.amount.toLocaleString()} THB</span>
                            <div className="block">
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase text-emerald-400">
                                  <Check className="w-3 h-3" /> Funded
                                </span>
                              ) : isRejected ? (
                                <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase text-rose-400">
                                  <X className="w-3 h-3" /> Flagged
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase text-amber-500">
                                  <Clock className="w-3 h-3 animate-spin" /> Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Transaction Metadata or Comments */}
                        {tx.notes && (
                          <p className="text-[10.5px] text-slate-400 italic">
                            Your notes: "{tx.notes}"
                          </p>
                        )}
                        {tx.upiTransactionId && (
                          <p className="text-[10px] text-slate-500 font-mono">
                            UPI TX: {tx.upiTransactionId}
                          </p>
                        )}

                        {/* Discrepancy Action Notes */}
                        {isRejected && tx.adminFeedback && (
                          <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/20 text-[11px] text-rose-300 space-y-1 leading-relaxed">
                            <h4 className="font-black uppercase tracking-wider text-[9px] text-rose-400">Discrepancy Audit Result:</h4>
                            <p>"{tx.adminFeedback}"</p>
                            <p className="text-[9.5px] text-slate-500">
                              Please review your uploaded receipt slip details and file a corrected top-up request.
                            </p>
                          </div>
                        )}
                        {isApproved && tx.adminFeedback && (
                          <div className="p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-[10.5px] text-slate-300">
                            <strong>Note:</strong> {tx.adminFeedback}
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

      </main>

      {/* FOOTER */}
      <footer className="bg-[#060A14] border-t border-slate-800/80 py-8 text-slate-500 text-xs mt-16 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h5 className="font-display font-black text-white text-sm uppercase tracking-wider">PHETMANY DIAMONDS</h5>
            <p className="leading-relaxed text-[11px] text-slate-400">Handcrafting certified luxury. Providing direct integration with state-of-the-art secure payment structures & real-time tracking.</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-slate-200 uppercase tracking-widest text-[11px]">Secure Checkout Integrations</h5>
            <p className="leading-relaxed text-[11px] text-slate-400">Authorized Opn/Omise transaction provider. Dynamic prompt-generating QR standard. TrueMoney wallet token protection.</p>
          </div>
          <div className="space-y-1 font-bold">
            <h5 className="font-bold text-slate-200 uppercase tracking-widest text-[11px]">Boutique Address</h5>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Sukhumvit Road, Khlong Toei, Bangkok, Thailand</p>
            <p className="text-[11px] text-amber-400 font-mono mt-1">support@phetmany.co</p>
          </div>
        </div>
      </footer>

      {/* 360 INTERACTIVE SPECIFICATIONS MODAL */}
      {viewProduct && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C1224] border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto flex flex-col md:grid md:grid-cols-12 overflow-hidden shadow-2xl relative text-left">
            
            {/* Close button */}
            <button 
              onClick={() => setViewProduct(null)}
              className="absolute top-4 right-4 z-20 p-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:text-amber-400 rounded-full text-slate-400 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Media Tab view Column */}
            <div className="col-span-5 bg-slate-950 flex flex-col justify-between p-6 border-b md:border-b-0 md:border-r border-slate-800">
              
              {/* Media Container */}
              <div className="flex-1 flex items-center justify-center min-h-[300px] md:min-h-[380px] relative select-none">
                {activeMediaTab === 'image' && (
                  <div className="flex flex-col items-center gap-3">
                    <img src={viewProduct.image} alt={viewProduct.name} className="max-h-64 sm:max-h-72 object-contain rounded-xl drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" />
                    {viewProduct.Location && (
                      <span className="text-[10px] bg-slate-900 px-2.5 py-1 rounded-full text-slate-400 font-mono tracking-widest uppercase border border-slate-800">
                        LOCATION: {viewProduct.Location}
                      </span>
                    )}
                  </div>
                )}

                {activeMediaTab === '360' && (
                  viewProduct.VideoLink ? (
                    <div className="w-full h-full min-h-[300px] flex flex-col justify-center">
                      <iframe 
                        src={viewProduct.VideoLink}
                        title="Diamond 360 Player"
                        className="w-full h-[320px] border-0 rounded-2xl bg-black"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <p className="text-[9px] text-slate-500 text-center mt-2 uppercase font-black tracking-widest">
                        Interactive Real-time 360° Vision Active
                      </p>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center cursor-ew-resize relative"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      {/* Interactive 360 Simulated visual indicator */}
                      <div 
                        className="w-48 h-48 bg-radial-gradient flex items-center justify-center rounded-full transition-transform duration-200"
                        style={{ transform: `rotate(${rotationAngle}deg)` }}
                      >
                        <img src={viewProduct.image} alt="360 Rotation" className="w-40 h-40 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                      </div>
                      
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest absolute bottom-4 select-none">
                        Drag left or right to rotate diamond 360°
                      </p>
                    </div>
                  )
                )}

                {activeMediaTab === 'cert' && (
                  <div className="w-full bg-[#090D1A] border border-slate-800 p-5 rounded-xl space-y-4 font-serif text-slate-300">
                    <div className="border border-amber-500/20 p-4 rounded-lg relative overflow-hidden bg-[radial-gradient(#amber_1px,transparent_1px)] bg-[size:16px_16px]">
                      
                      <div className="text-center space-y-1">
                        <span className="text-[9px] font-black text-amber-500 tracking-widest font-sans uppercase">
                          {viewProduct.Lab || viewProduct.certification || 'GIA'} LABORATORY REPORT
                        </span>
                        <h4 className="text-base font-black text-white tracking-wide uppercase font-serif mt-1">DIAMOND GRADING DOSSIER</h4>
                        <span className="text-[9px] text-slate-400 font-sans block mt-1">
                          Report Number: <span className="font-mono text-amber-400 font-bold">{viewProduct.CERT_NO || viewProduct.certId}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs font-serif mt-5 border-t border-slate-800/80 pt-4">
                        <div>
                          <span className="text-[8px] text-slate-500 font-sans uppercase block">SHAPE</span>
                          <span className="font-bold text-slate-200 block uppercase tracking-wider">{viewProduct.Shape || 'ROUND'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 font-sans uppercase block">CARAT WEIGHT</span>
                          <span className="font-bold text-slate-200 block">{viewProduct.carat} Carat</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 font-sans uppercase block">COLOR GRADE</span>
                          <span className="font-bold text-slate-200 block">Grade {viewProduct.color} {viewProduct.Color_Shade ? `(${viewProduct.Color_Shade})` : ''}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 font-sans uppercase block">CLARITY GRADE</span>
                          <span className="font-bold text-slate-200 block">{viewProduct.clarity}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 font-sans uppercase block">POLISH / SYMMETRY</span>
                          <span className="font-bold text-slate-200 block">{viewProduct.Polish || 'EX'} / {viewProduct.Symmetry || 'EX'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 font-sans uppercase block">MEASUREMENT</span>
                          <span className="font-bold text-slate-200 block font-mono text-[10px]">{viewProduct.Measurement || 'N/A'}</span>
                        </div>
                      </div>

                      {viewProduct.CertificateLink && (
                        <div className="mt-5 pt-3.5 border-t border-slate-800/60 text-center">
                          <a 
                            href={viewProduct.CertificateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/20 hover:border-amber-500 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            <span>Verify Report on {viewProduct.Lab || 'GIA'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      <div className="mt-4 flex justify-between items-center font-sans">
                        <div className="flex items-center gap-1 text-emerald-400 text-[8px] font-black uppercase tracking-wider">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Girdle Laser Inscribed</span>
                        </div>
                        <span className="text-[8px] font-mono text-slate-600 font-black uppercase">SECURE PORTAL</span>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* Tab Toggles */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button 
                  onClick={() => setActiveMediaTab('image')}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${activeMediaTab === 'image' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                >
                  Gallery Photo
                </button>
                <button 
                  onClick={() => {
                    if (!viewProduct.video360 && !viewProduct.VideoLink) {
                      showToast('Interactive 360 Video simulator generated for this asset.');
                    }
                    setActiveMediaTab('360');
                  }}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${activeMediaTab === '360' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                >
                  360° View
                </button>
                <button 
                  onClick={() => setActiveMediaTab('cert')}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${activeMediaTab === 'cert' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                >
                  Certificate
                </button>
              </div>

            </div>

            {/* Right Specs Info Column */}
            <div className="col-span-7 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest">
                      {viewProduct.Lab || viewProduct.certification || 'GIA'} {viewProduct.CERT_NO || viewProduct.certId}
                    </span>
                    <h3 className="text-lg font-black text-white mt-1 uppercase tracking-wider leading-tight">
                      {viewProduct.name}
                    </h3>
                    {viewProduct.Stock_NO && (
                      <span className="text-[9px] text-slate-500 font-mono block mt-1">STOCK NO: {viewProduct.Stock_NO}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-slate-500 font-black block uppercase tracking-wider">CARAT WEIGHT</span>
                    <span className="text-lg font-black text-amber-400 font-mono">{viewProduct.carat} ct</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                  {viewProduct.description}
                </p>

                {/* Highly Dense Custom Diamond Spec Bento Grid */}
                <div className="space-y-4 pt-2">
                  
                  {/* Category 1: Grading Properties */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/80 pb-1">Essential Grading Attributes</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Shape</span>
                        <span className="text-slate-200 font-black uppercase">{viewProduct.Shape || 'ROUND'}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Color</span>
                        <span className="text-slate-200 font-black">{viewProduct.color} {viewProduct.Color_Shade ? `(${viewProduct.Color_Shade})` : ''}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Clarity</span>
                        <span className="text-slate-200 font-black">{viewProduct.clarity}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Cut Grade</span>
                        <span className="text-slate-200 font-black uppercase">{viewProduct.cut}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Polish</span>
                        <span className="text-slate-200 font-black uppercase">{viewProduct.Polish || 'EX'}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Symmetry</span>
                        <span className="text-slate-200 font-black uppercase">{viewProduct.Symmetry || 'EX'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Detailed Proportions */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/80 pb-1">Precision Dimensions & Proportions</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50 col-span-2">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Measurements</span>
                        <span className="text-slate-200 font-mono font-bold text-[10.5px]">{viewProduct.Measurement || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Table %</span>
                        <span className="text-slate-200 font-mono font-bold">{viewProduct.Tab_ ? `${viewProduct.Tab_}%` : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Total Depth %</span>
                        <span className="text-slate-200 font-mono font-bold">{viewProduct.TD_ ? `${viewProduct.TD_}%` : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50 col-span-2">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Girdle Thickness</span>
                        <span className="text-slate-200 font-semibold text-[11px] truncate block">{viewProduct.Girdle || 'N/A'} {viewProduct.Girdle_ ? `(${viewProduct.Girdle_}%)` : ''}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Crown Angle/Ht</span>
                        <span className="text-slate-200 font-mono text-[11px] font-bold">{viewProduct.CA !== undefined ? `${viewProduct.CA}°` : '0°'} / {viewProduct.CH !== undefined ? `${viewProduct.CH}%` : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Pavilion Angle/Ht</span>
                        <span className="text-slate-200 font-mono text-[11px] font-bold">{viewProduct.PA !== undefined ? `${viewProduct.PA}°` : '0°'} / {viewProduct.PHP !== undefined ? `${viewProduct.PHP}%` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Advanced Light Performance & Valuations */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/80 pb-1">Optical Performance & Valuations</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Fluorescence</span>
                        <span className="text-slate-200 font-black">{viewProduct.Fluorescent || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Hearts & Arrows</span>
                        <span className="text-slate-200 font-black">{viewProduct.H_A || 'None'}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Milky Grade</span>
                        <span className="text-slate-200 font-mono font-bold">{viewProduct.MILKY || 'M0'}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Luster / LIns</span>
                        <span className="text-slate-200 font-bold uppercase text-[10px]">{viewProduct.LUS || 'EX'} / {viewProduct.LIns || 'L.I'}</span>
                      </div>
                      {viewProduct.Rap_Rate !== undefined && (
                        <>
                          <div className="bg-slate-950 border border-amber-500/10 p-2 rounded-lg">
                            <span className="text-[7.5px] text-slate-500 block uppercase font-black">Rap Rate ($)</span>
                            <span className="text-amber-500 font-mono font-black text-xs">${viewProduct.Rap_Rate.toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-950 border border-amber-500/10 p-2 rounded-lg">
                            <span className="text-[7.5px] text-slate-500 block uppercase font-black">Rap Value ($)</span>
                            <span className="text-amber-500 font-mono font-black text-xs">${viewProduct.Rap_Vlu?.toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-950 border border-amber-500/10 p-2 rounded-lg">
                            <span className="text-[7.5px] text-slate-500 block uppercase font-black">Rap discount %</span>
                            <span className="text-red-400 font-mono font-black text-xs">{viewProduct.Rap__}%</span>
                          </div>
                          <div className="bg-slate-950 border border-amber-500/10 p-2 rounded-lg">
                            <span className="text-[7.5px] text-slate-500 block uppercase font-black">Price / Carat</span>
                            <span className="text-amber-400 font-mono font-black text-xs">${viewProduct.Pr_Ct?.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Secondary Codes */}
                  {(viewProduct.Keytosymbol || viewProduct.FancyColorDescription) && (
                    <div className="bg-slate-900/20 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                      {viewProduct.Keytosymbol && (
                        <div>
                          <span className="text-[8px] text-slate-500 block uppercase font-black">Clarity Characteristics / Key To Symbols</span>
                          <span className="text-slate-300 font-medium">{viewProduct.Keytosymbol}</span>
                        </div>
                      )}
                      {viewProduct.FancyColorDescription && (
                        <div className="pt-1.5 border-t border-slate-800/40">
                          <span className="text-[8px] text-slate-500 block uppercase font-black">Fancy Color Details</span>
                          <span className="text-amber-400 font-medium">{viewProduct.FancyColorDescription}</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                <div className="pt-4 border-t border-slate-800/60 flex justify-between items-center bg-[#090D1A]/50 p-4 rounded-xl">
                  <div>
                    <span className="text-[8px] text-slate-500 font-black block uppercase tracking-wider">RET-EX VALUATION</span>
                    <p className="text-lg font-mono font-black text-amber-400 mt-0.5">{viewProduct.price.toLocaleString()} THB</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-slate-500 font-black block uppercase tracking-wider">SECURE ESCROW</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">
                      IN STOCK / INSURED
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-3 mt-4">
                <button 
                  onClick={() => setViewProduct(null)}
                  className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Back to Catalog
                </button>
                <button 
                  onClick={() => { handleAddToCart(viewProduct); setViewProduct(null); }}
                  className="py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Secure Checkout</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SHOPPING CART OVERLAY SHEET */}
      {showCart && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-[#0C1224] border-l border-slate-800 w-full max-w-md h-full flex flex-col justify-between shadow-2xl text-left">
            
            {/* Cart Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Your Shopping Bag</h3>
              </div>
              <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Cart items list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="py-24 text-center space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-800 mx-auto" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Your shopping cart is currently empty</p>
                  <button onClick={() => setShowCart(false)} className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold uppercase rounded-lg">Browse Diamonds</button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img src={item.image} className="w-12 h-12 object-cover rounded-lg" alt="" />
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[150px]">{item.name}</h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{item.carat} ct • Color {item.color} • {item.clarity}</span>
                        <span className="font-mono text-xs font-black text-amber-400 block mt-1">{item.price.toLocaleString()} THB</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="p-1 text-slate-500 hover:text-red-500 hover:bg-slate-950/60 rounded"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Pricing Summary */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-800 bg-[#090D1A] space-y-4 font-bold text-xs">
                {/* Coupon input */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input 
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter Launch Code (e.g., PHETMANY34YEARS)"
                    className="bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-2 text-white flex-1 focus:outline-none"
                  />
                  <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 uppercase rounded-lg">
                    Apply
                  </button>
                </form>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Subtotal Value</span>
                    <span className="text-white font-mono">{cartSubtotal.toLocaleString()} THB</span>
                  </div>
                  {discountApplied && (
                    <div className="flex justify-between text-emerald-400">
                      <span className="uppercase tracking-wider text-[10px]">Grand Launch Discount (1.34%)</span>
                      <span className="font-mono">- {cartDiscount.toLocaleString()} THB</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-800/80 pt-2 font-black text-sm">
                    <span className="text-slate-200 uppercase tracking-widest text-[10px]">Transacted Total</span>
                    <span className="text-amber-400 font-mono">{cartTotal.toLocaleString()} THB</span>
                  </div>
                </div>

                <button 
                  onClick={() => { setShowCart(false); handleInitCheckout(); }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>Proceed to Escrow Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CHECKOUT & INTEGRATED OPN/OMISE SIMULATOR MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C1224] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col p-6 sm:p-8 shadow-2xl text-left relative">
            
            {/* Close */}
            <button 
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-900 border border-slate-800 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <CreditCard className="w-5.5 h-5.5 text-amber-500" />
              <div>
                <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest block">SECURE checkout via OPN/OMISE</span>
                <h3 className="text-base font-black text-white uppercase tracking-wider">Thai-Baht Escrow Checkout</h3>
              </div>
            </div>

            {paymentStep === 'form' && (
              <form onSubmit={handleProcessPayment} className="space-y-4 mt-6">
                
                {/* Shipping info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Receiver Full Name</label>
                    <input 
                      type="text"
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Thailand Mobile Phone #</label>
                    <input 
                      type="text"
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      placeholder="e.g., 081-234-5678"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Street Address (Delivery Coordinates)</label>
                  <input 
                    type="text"
                    value={shippingStreet}
                    onChange={(e) => setShippingStreet(e.target.value)}
                    placeholder="e.g., Sukhumvit Rd, Khlong Toei"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">City / Province</label>
                    <input 
                      type="text"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Postal Code</label>
                    <input 
                      type="text"
                      value={shippingZip}
                      onChange={(e) => setShippingZip(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Payment gateway selection */}
                <div className="space-y-2 pt-4 border-t border-slate-800/80 text-xs">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Select Payment Provider</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('PromptPay')}
                      className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${paymentMethod === 'PromptPay' ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                    >
                      <QrCode className="w-6 h-6 text-amber-500" />
                      <div>
                        <span className="text-xs font-bold block">PromptPay QR</span>
                        <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Thai bank apps</span>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('TrueMoney')}
                      className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${paymentMethod === 'TrueMoney' ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                    >
                      <ShoppingBag className="w-6 h-6 text-orange-500" />
                      <div>
                        <span className="text-xs font-bold block">TrueMoney</span>
                        <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Digital wallet</span>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('Wallet')}
                      className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${paymentMethod === 'Wallet' ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                    >
                      <Wallet className="w-6 h-6 text-amber-400 animate-pulse" />
                      <div>
                        <span className="text-xs font-bold block">Phetmany Wallet</span>
                        <span className="text-[9px] text-amber-500 font-mono font-black block mt-0.5">{(currentUser.walletBalance || 0).toLocaleString()} THB</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Submit row */}
                <div className="pt-6 border-t border-slate-800/80 flex justify-between items-center">
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase font-black block">PAYMENT VALUE</span>
                    <span className="font-mono text-sm font-black text-amber-400">{cartTotal.toLocaleString()} THB</span>
                  </div>
                  <button 
                    type="submit"
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase rounded-xl shadow-md"
                  >
                    Proceed with {paymentMethod}
                  </button>
                </div>

              </form>
            )}

            {paymentStep === 'gateway' && (
              <div className="mt-6 text-center space-y-6">
                
                {paymentMethod === 'PromptPay' && (
                  <div className="space-y-6 flex flex-col items-center">
                    <span className="text-emerald-400 font-extrabold uppercase tracking-widest text-[10px] animate-pulse">PROMPTPAY ENDPOINT SECURE</span>
                    
                    {/* Fake dynamic QR code box */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center shadow-lg w-56 h-56 justify-center">
                      <QrCode className="w-36 h-36 text-[#103E6B]" />
                      <div className="bg-[#103E6B] text-white px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest mt-3">
                        PROMPTPAY QR
                      </div>
                    </div>

                    <div className="max-w-md space-y-2 text-center">
                      <h4 className="text-white text-xs font-black uppercase tracking-wide">Scan this QR Code using any Thai Banking App</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        To pay exactly <strong className="text-amber-400 font-mono text-xs">{cartTotal.toLocaleString()} THB</strong>. Opn/Omise sandbox dynamic check loop initiated.
                      </p>
                      
                      {!promptPayScanned ? (
                        <div className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-[10px] font-bold text-amber-500">
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Simulating scan detection... Awaiting verification ({secondsLeft}s)</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-2.5 text-xs font-bold">
                            <Check className="w-5 h-5" />
                            <span>Simulated Scanned successfully! Transaction confirmed by Bank.</span>
                          </div>
                          <button 
                            onClick={handleVerifyPromptPaySuccess}
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase rounded-lg"
                          >
                            Finalize Escrow Account Receipt
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {paymentMethod === 'TrueMoney' && (
                  <div className="space-y-4 max-w-md mx-auto text-center">
                    <span className="text-orange-500 font-black uppercase tracking-widest text-[10px]">TRUEMONEY WALLET INTERACTIVE GATEWAY</span>
                    <h4 className="text-white text-xs font-black uppercase">Enter registered mobile cellular number</h4>
                    
                    {!otpSent ? (
                      <div className="space-y-3">
                        <input 
                          type="text"
                          value={trueMoneyPhone}
                          onChange={(e) => setTrueMoneyPhone(e.target.value)}
                          placeholder="e.g., 081-234-5678"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center text-xs text-white placeholder-slate-600 focus:outline-none"
                        />
                        <button 
                          onClick={() => {
                            if (trueMoneyPhone.length < 9) {
                              showToast('Please enter a valid cellular number.', true);
                              return;
                            }
                            setOtpSent(true);
                            showToast('Verification OTP passcode dispatched to device (Simulated).');
                          }}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase rounded-lg"
                        >
                          Send verification OTP Code
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-bold text-amber-500">
                          A 6-digit OTP code has been dispatched to {trueMoneyPhone}. Use sandbox pin <strong>123456</strong>.
                        </div>
                        <input 
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 6-Digit OTP"
                          maxLength={6}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center text-xs text-white focus:outline-none tracking-widest font-mono"
                        />
                        <button 
                          onClick={handleVerifyTrueMoneyOtp}
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black uppercase rounded-lg"
                        >
                          Verify Wallet & Process Payment
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
