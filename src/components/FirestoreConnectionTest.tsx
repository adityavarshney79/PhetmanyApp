import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, CheckCircle2, AlertCircle, Sparkles, 
  Terminal, ShieldCheck, Flame, Key, Copy, Check,
  Play, ShieldAlert, Table, Eye, Layers, Search, ChevronDown, ChevronRight,
  HardDrive, Server, FileText
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  limit, 
  query 
} from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';
import { getAllUsers } from '../lib/firebase';
import { fetchProductsFromDb, fetchOrdersFromDb, fetchTicketsFromDb } from '../lib/diamondDb';

interface FirestoreConnectionTestProps {
  defaultDatabaseId?: string;
}

interface TestStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  durationMs?: number;
  details?: string;
  error?: string;
}

interface CollectionMeta {
  name: string;
  description: string;
  count: number | null;
  loading: boolean;
  error: string | null;
  sampleDocs: any[];
}

export default function FirestoreConnectionTest({
  defaultDatabaseId = 'ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b'
}: FirestoreConnectionTestProps) {
  const [databaseIdInput, setDatabaseIdInput] = useState<string>(defaultDatabaseId);
  const [projectIdInput, setProjectIdInput] = useState<string>(firebaseConfigRaw.projectId || '');
  const [testCollectionName, setTestCollectionName] = useState<string>('_connection_test');
  
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    totalLatencyMs: number;
    dbInstanceId: string;
    readSupported: boolean;
    writeSupported: boolean;
    docsCountInTestCol?: number;
    errorDetails?: any;
    suggestions?: string[];
  } | null>(null);

  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [diagnosticLogs, setDiagnosticLogs] = useState<Array<{ timestamp: string; type: 'info' | 'success' | 'warn' | 'error'; message: string }>>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Firestore Tables / Collections State
  const [selectedTable, setSelectedTable] = useState<string>('user_profiles');
  const [isRefreshingTables, setIsRefreshingTables] = useState<boolean>(false);
  const [isSyncingInitialData, setIsSyncingInitialData] = useState<boolean>(false);
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');

  const [collectionsData, setCollectionsData] = useState<Record<string, CollectionMeta>>({
    user_profiles: {
      name: 'user_profiles',
      description: 'Registered users, roles, authentication credentials, & user metadata',
      count: null,
      loading: false,
      error: null,
      sampleDocs: []
    },
    products: {
      name: 'products',
      description: 'Diamond & jewelry inventory, pricing, carat, color, clarity, & images',
      count: null,
      loading: false,
      error: null,
      sampleDocs: []
    },
    orders: {
      name: 'orders',
      description: 'Customer purchase orders, tracking numbers, payment status, & items',
      count: null,
      loading: false,
      error: null,
      sampleDocs: []
    },
    tickets: {
      name: 'tickets',
      description: 'Customer support inquiries, tickets, messages, & resolution logs',
      count: null,
      loading: false,
      error: null,
      sampleDocs: []
    },
    rapaport_prices: {
      name: 'rapaport_prices',
      description: 'Rapaport matrix cached price lists for natural & lab diamonds',
      count: null,
      loading: false,
      error: null,
      sampleDocs: []
    },
    affiliate_configs: {
      name: 'affiliate_configs',
      description: 'Affiliate commission tiers, referral codes, & partner settings',
      count: null,
      loading: false,
      error: null,
      sampleDocs: []
    },
    wallet_transactions: {
      name: 'wallet_transactions',
      description: 'User wallet balance adjustments, deposits, credits, & transaction logs',
      count: null,
      loading: false,
      error: null,
      sampleDocs: []
    },
    _connection_test: {
      name: '_connection_test',
      description: 'System diagnostic ping collection for read/write connectivity tests',
      count: null,
      loading: false,
      error: null,
      sampleDocs: []
    }
  });

  const addLog = (type: 'info' | 'success' | 'warn' | 'error', message: string) => {
    setDiagnosticLogs(prev => [
      { timestamp: new Date().toLocaleTimeString(), type, message },
      ...prev.slice(0, 49)
    ]);
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch Firestore Collections ("Tables") Data
  const loadCollectionsInfo = async (dbId: string = databaseIdInput) => {
    setIsRefreshingTables(true);
    const config = {
      ...firebaseConfigRaw,
      projectId: projectIdInput || firebaseConfigRaw.projectId
    };

    let db: any = null;
    try {
      const app = getApps().length > 0 ? getApp() : initializeApp(config);
      const targetDbId = dbId.trim() || '(default)';
      db = (targetDbId === '(default)' || targetDbId === 'default' || !targetDbId)
        ? getFirestore(app)
        : getFirestore(app, targetDbId);
    } catch (err: any) {
      console.warn('Failed to bind Firestore for table listing:', err);
      setIsRefreshingTables(false);
      return;
    }

    const tableKeys = Object.keys(collectionsData);

    for (const key of tableKeys) {
      setCollectionsData(prev => ({
        ...prev,
        [key]: { ...prev[key], loading: true, error: null }
      }));

      try {
        const q = query(collection(db, key), limit(20));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({
          _id: d.id,
          ...d.data()
        }));

        setCollectionsData(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            count: snapshot.size,
            loading: false,
            error: null,
            sampleDocs: docs
          }
        }));
      } catch (err: any) {
        const isQuotaErr = err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded') || err?.message?.includes('Free daily read units');
        setCollectionsData(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            count: 0,
            loading: false,
            error: isQuotaErr 
              ? 'GCP Firestore daily read quota exceeded. Local high-performance cache active.' 
              : (err.message || 'Error querying collection'),
            sampleDocs: []
          }
        }));
      }
    }

    setIsRefreshingTables(false);
  };

  // Seed / Sync Initial Application Data to Firestore
  const handleSeedFirestore = async () => {
    setIsSyncingInitialData(true);
    addLog('info', 'Initiating full sync of application data into Firestore primary database...');

    try {
      addLog('info', 'Syncing user profiles into Firestore collection "user_profiles"...');
      await getAllUsers();

      addLog('info', 'Syncing products inventory into Firestore collection "products"...');
      await fetchProductsFromDb();

      addLog('info', 'Syncing orders into Firestore collection "orders"...');
      await fetchOrdersFromDb();

      addLog('info', 'Syncing support tickets into Firestore collection "tickets"...');
      await fetchTicketsFromDb();

      addLog('success', 'Full data sync into Firestore database completed successfully!');
      await loadCollectionsInfo();
    } catch (err: any) {
      addLog('error', `Data sync failed: ${err.message}`);
    } finally {
      setIsSyncingInitialData(false);
    }
  };

  const runDiagnostics = async (dbIdToTest: string = databaseIdInput) => {
    setIsTesting(true);
    setTestResult(null);
    setDiagnosticLogs([]);

    const steps: TestStep[] = [
      { name: '1. Firebase App Initialization', status: 'pending' },
      { name: '2. Firestore Instance Binding', status: 'pending' },
      { name: '3. Server Read Query (getDocs)', status: 'pending' },
      { name: '4. Firestore Write & Cleanup Test (setDoc & deleteDoc)', status: 'pending' },
    ];
    setTestSteps(steps);

    const startTime = performance.now();
    let readOk = false;
    let writeOk = false;
    let foundDocsCount = 0;
    let mainError: any = null;
    const errorSuggestions: string[] = [];

    // Step 1: Firebase App
    addLog('info', `Initializing Firebase App with Project ID: ${projectIdInput || firebaseConfigRaw.projectId}`);
    steps[0].status = 'running';
    setTestSteps([...steps]);

    let app: any = null;
    const step1Start = performance.now();
    try {
      const config = {
        ...firebaseConfigRaw,
        projectId: projectIdInput || firebaseConfigRaw.projectId
      };
      app = getApps().length > 0 ? getApp() : initializeApp(config);
      steps[0].status = 'success';
      steps[0].durationMs = Math.round(performance.now() - step1Start);
      steps[0].details = `SDK initialized for project ${config.projectId}`;
      addLog('success', `Firebase app initialized in ${steps[0].durationMs}ms`);
    } catch (err: any) {
      steps[0].status = 'failed';
      steps[0].error = err.message || String(err);
      addLog('error', `Firebase app initialization failed: ${err.message}`);
      setIsTesting(false);
      return;
    }
    setTestSteps([...steps]);

    // Step 2: Firestore Instance Binding
    const step2Start = performance.now();
    steps[1].status = 'running';
    setTestSteps([...steps]);

    let db: any = null;
    const targetDbId = dbIdToTest.trim() || '(default)';
    addLog('info', `Binding Firestore database instance ID: "${targetDbId}"`);

    try {
      if (targetDbId === '(default)' || targetDbId === 'default' || !targetDbId) {
        db = getFirestore(app);
      } else {
        db = getFirestore(app, targetDbId);
      }
      steps[1].status = 'success';
      steps[1].durationMs = Math.round(performance.now() - step2Start);
      steps[1].details = `Firestore instance acquired for database "${targetDbId}"`;
      addLog('success', `Firestore instance bound successfully (${steps[1].durationMs}ms)`);
    } catch (err: any) {
      steps[1].status = 'failed';
      steps[1].error = err.message || String(err);
      addLog('error', `Firestore instance binding error: ${err.message}`);
      setIsTesting(false);
      return;
    }
    setTestSteps([...steps]);

    // Step 3: Server Read Test
    const step3Start = performance.now();
    steps[2].status = 'running';
    setTestSteps([...steps]);
    addLog('info', `Executing read operation on Firestore collection "${testCollectionName}"...`);

    try {
      const q = query(collection(db, testCollectionName), limit(5));
      const querySnapshot = await getDocs(q);
      readOk = true;
      foundDocsCount = querySnapshot.size;

      steps[2].status = 'success';
      steps[2].durationMs = Math.round(performance.now() - step3Start);
      steps[2].details = `Read query succeeded. Found ${foundDocsCount} documents in collection "${testCollectionName}".`;
      addLog('success', `Read test passed! Latency: ${steps[2].durationMs}ms. Documents found: ${foundDocsCount}`);
    } catch (err: any) {
      steps[2].status = 'failed';
      steps[2].error = err.message || String(err);
      mainError = err;
      addLog('error', `Firestore read test failed: ${err.message}`);

      if (err.code === 'resource-exhausted' || err.message?.includes('Quota limit exceeded') || err.message?.includes('Free daily read units')) {
        errorSuggestions.push('⚠️ Daily Free Tier Quota Exceeded for GCP Firestore reads (50,000 daily read units reached on project).');
        errorSuggestions.push('The application automatically falls back to high-performance local persistence (IndexedDB & LocalStorage).');
        errorSuggestions.push('Quota resets daily at midnight UTC on Google Cloud.');
      } else if (err.message?.includes('permission-denied') || err.code === 'permission-denied') {
        errorSuggestions.push(`Permission Denied: Your firestore.rules file restricts read access to collection "${testCollectionName}".`);
        errorSuggestions.push('Deploy updated firestore.rules allowing read operations or authenticate user.');
      } else if (err.message?.includes('not-found') || err.code === 'not-found') {
        errorSuggestions.push(`Database Not Found: Verify database ID "${targetDbId}" exists in Firebase Console under project "${projectIdInput}".`);
      } else if (err.message?.includes('offline') || err.code === 'unavailable') {
        errorSuggestions.push('Client is offline or network request to Firebase servers was blocked.');
      } else {
        errorSuggestions.push(`Verify Firebase project & database configuration for database ID "${targetDbId}".`);
      }
    }
    setTestSteps([...steps]);

    // Step 4: Write & Delete Cleanup Test
    if (readOk) {
      const step4Start = performance.now();
      steps[3].status = 'running';
      setTestSteps([...steps]);
      addLog('info', `Testing write & cleanup on Firestore collection "${testCollectionName}"...`);

      try {
        const testDocRef = doc(collection(db, testCollectionName));
        const testPayload = {
          testId: testDocRef.id,
          pingTime: new Date().toISOString(),
          testedBy: 'AdminDashboardDiagnosticConsole',
          dbInstance: targetDbId,
        };

        // Write
        await setDoc(testDocRef, testPayload);
        addLog('info', `Document created with ID: ${testDocRef.id}`);

        // Delete cleanup
        await deleteDoc(testDocRef);
        addLog('success', `Document deleted during cleanup test.`);

        writeOk = true;
        steps[3].status = 'success';
        steps[3].durationMs = Math.round(performance.now() - step4Start);
        steps[3].details = `Write & delete cycle completed cleanly (${steps[3].durationMs}ms).`;
      } catch (err: any) {
        steps[3].status = 'failed';
        steps[3].error = err.message || String(err);
        addLog('warn', `Firestore write/cleanup test failed: ${err.message}`);

        if (err.message?.includes('permission-denied')) {
          errorSuggestions.push(`Write Permission Denied: firestore.rules blocks write access to collection "${testCollectionName}".`);
        }
      }
      setTestSteps([...steps]);
    } else {
      steps[3].status = 'skipped';
      steps[3].details = 'Skipped because read test failed.';
      setTestSteps([...steps]);
    }

    const totalDuration = Math.round(performance.now() - startTime);

    setTestResult({
      success: readOk,
      message: readOk 
        ? `Successfully connected to Firestore database "${targetDbId}"!`
        : `Failed to connect to Firestore database "${targetDbId}".`,
      totalLatencyMs: totalDuration,
      dbInstanceId: targetDbId,
      readSupported: readOk,
      writeSupported: writeOk,
      docsCountInTestCol: foundDocsCount,
      errorDetails: mainError ? {
        code: mainError.code || 'UNKNOWN_FIRESTORE_ERROR',
        message: mainError.message || String(mainError),
      } : null,
      suggestions: errorSuggestions,
    });

    setIsTesting(false);
    loadCollectionsInfo(targetDbId);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const selectedColData = collectionsData[selectedTable];

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header Banner */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500 animate-pulse shrink-0" />
            <h3 className="text-base font-black text-white uppercase tracking-wider font-display">
              Firestore Database Connection & Tables Console
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Database ID: <code className="text-amber-400 font-bold font-mono">ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b</code> (Primary Storage)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleSeedFirestore()}
            disabled={isSyncingInitialData}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all"
            title="Populate/Sync initial products, users, and orders into Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncingInitialData ? 'animate-spin' : ''}`} />
            <span>{isSyncingInitialData ? 'Syncing Data...' : 'Sync / Seed Tables'}</span>
          </button>

          <button
            onClick={() => runDiagnostics()}
            disabled={isTesting}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-500/10"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing Firestore...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>

      {/* Target Database Preset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User's Specified Database ID */}
        <div 
          onClick={() => {
            const userDb = 'ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b';
            setDatabaseIdInput(userDb);
            runDiagnostics(userDb);
          }}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Primary Firestore Database
            </span>
            <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">Primary</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono truncate">
            ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b
          </p>
          <span className="text-[10px] text-amber-500 font-mono font-semibold block group-hover:underline">
            Test Specified Database →
          </span>
        </div>

        {/* Default Database */}
        <div 
          onClick={() => {
            setDatabaseIdInput('(default)');
            runDiagnostics('(default)');
          }}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-400" />
              Default Database
            </span>
            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">(default)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Standard root database instance configured for the Firebase project.
          </p>
          <span className="text-[10px] text-amber-500 font-mono font-semibold block group-hover:underline">
            Test Default Database →
          </span>
        </div>

        {/* Local Storage & IndexedDB Fallback Info */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-400" />
              High-Speed Offline Cache
            </span>
            <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">IndexedDB & LocalStorage</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono truncate">
            Local browser persistent store
          </p>
          <span className="text-[10px] text-emerald-400 font-mono block truncate">
            Status: Active Instant Fallback Engine
          </span>
        </div>
      </div>

      {/* Configuration Inputs & Diagnostic Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection Parameters Form */}
        <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <span>Firestore Parameters</span>
            </h4>
            <span className="text-[9px] font-mono text-slate-500 uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Firebase SDK</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Firebase Project ID</label>
              <input
                type="text"
                value={projectIdInput}
                onChange={(e) => setProjectIdInput(e.target.value)}
                placeholder="project-6ae8de40-5a01-4ab8-a93"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Firestore Database ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={databaseIdInput}
                  onChange={(e) => setDatabaseIdInput(e.target.value)}
                  placeholder="ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(databaseIdInput, 'dbid')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  title="Copy Database ID"
                >
                  {copiedKey === 'dbid' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[9px] text-slate-500">
                Target database: <code className="text-amber-400 font-bold">ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b</code>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Diagnostic Test Collection</label>
              <input
                type="text"
                value={testCollectionName}
                onChange={(e) => setTestCollectionName(e.target.value)}
                placeholder="_connection_test"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[9px] text-slate-500">Collection path used to verify read/write operations.</p>
            </div>

            <button
              onClick={() => runDiagnostics()}
              disabled={isTesting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running Firestore Diagnostic Test...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Firestore Diagnostic Test</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostic Results Breakdown */}
        <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Diagnostic Engine & Test Breakdown</span>
              </h4>
              {testResult && (
                <span className="text-[10px] font-mono text-slate-400">
                  Latency: <strong className="text-amber-400">{testResult.totalLatencyMs} ms</strong>
                </span>
              )}
            </div>

            {/* Overall Status Banner */}
            {testResult && !isTesting && (
              <div className="mt-4">
                {testResult.success ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="font-extrabold text-sm uppercase tracking-wider">{testResult.message}</span>
                    </div>
                    <p className="text-xs text-emerald-300/80 leading-relaxed">
                      Firestore database instance <code className="text-amber-300 font-bold">{testResult.dbInstanceId}</code> is online, active, and accessible from your application.
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span className="font-extrabold text-sm uppercase tracking-wider">{testResult.message}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Execution Steps */}
            <div className="space-y-3 mt-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Execution Steps
              </span>

              <div className="space-y-2">
                {testSteps.map((step, idx) => (
                  <div 
                    key={idx}
                    className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-200 block">{step.name}</span>
                      {step.details && <p className="text-[11px] text-slate-400">{step.details}</p>}
                      {step.error && <p className="text-[11px] text-red-400 font-mono">{step.error}</p>}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {step.status === 'success' && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" /> PASSED
                        </span>
                      )}
                      {step.status === 'failed' && (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-red-400" /> FAILED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: FIRESTORE TABLES / COLLECTIONS EXPLORER */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-display">
                Firestore Database Collections / Tables Explorer
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect database tables (collections), document counts, and live records in database <code className="text-amber-400 font-bold">{databaseIdInput}</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadCollectionsInfo()}
              disabled={isRefreshingTables}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshingTables ? 'animate-spin' : ''}`} />
              <span>Refresh Tables</span>
            </button>
          </div>
        </div>

        {/* Collections Table Grid & Inspector Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table List Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Database Tables ({Object.keys(collectionsData).length})</span>
              <span className="text-[10px] text-slate-500">Firestore Format</span>
            </div>

            <div className="space-y-2">
              {(Object.entries(collectionsData) as [string, CollectionMeta][]).map(([colKey, meta]) => {
                const isSelected = selectedTable === colKey;
                return (
                  <div
                    key={colKey}
                    onClick={() => setSelectedTable(colKey)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <Table className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                          {meta.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 leading-normal">
                        {meta.description}
                      </p>
                    </div>

                    <div className="shrink-0 text-right space-y-1">
                      {meta.loading ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        </span>
                      ) : meta.error ? (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[9px] font-mono font-bold">
                          Error
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                          isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {meta.count !== null ? `${meta.count} doc${meta.count === 1 ? '' : 's'}` : '0 docs'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Content & Record Inspector (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-4">
            {selectedColData ? (
              <>
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider font-mono">
                        Table: {selectedColData.name}
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedColData.description}
                    </p>
                  </div>

                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] font-mono font-bold shrink-0">
                    {selectedColData.sampleDocs.length} Sample Records
                  </span>
                </div>

                {/* Live Document Viewer */}
                {selectedColData.loading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                    <span className="text-xs font-mono">Querying Firestore collection "{selectedColData.name}"...</span>
                  </div>
                ) : selectedColData.sampleDocs.length === 0 ? (
                  <div className="py-12 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center space-y-3 text-center p-6">
                    <Database className="w-8 h-8 text-slate-600" />
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-300 block">No documents in table "{selectedColData.name}" yet</span>
                      <p className="text-[11px] text-slate-500 max-w-sm">
                        You can populate default seed data for products, users, and orders using the sync button.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSeedFirestore()}
                      disabled={isSyncingInitialData}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                    >
                      Seed / Sync Table Data
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Live Records preview (JSON format)
                    </span>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {selectedColData.sampleDocs.map((doc, idx) => (
                        <div 
                          key={doc._id || idx}
                          className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              Doc ID: <code className="text-white">{doc._id}</code>
                            </span>
                            <span className="text-[9px] text-slate-500">Firestore Document</span>
                          </div>

                          <pre className="text-[10px] text-emerald-400/90 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                            {JSON.stringify(doc, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Select a table from the sidebar to view documents.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

