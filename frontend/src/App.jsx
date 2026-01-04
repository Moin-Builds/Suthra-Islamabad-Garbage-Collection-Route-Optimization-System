import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import Configuration from './components/Configuration';
import Results from './components/Results';
import LoadingOverlay from './components/LoadingOverlay';

// API Base URL - Change this if running on different port
const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRunning, setIsRunning] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [cityInfo, setCityInfo] = useState(null);
  const [defaults, setDefaults] = useState(null);

  // All configuration options - user must enter values before optimization
  const [config, setConfig] = useState({
    bins: '',
    trucks: '',
    threshold: '',
    alpha: '',
    beta: '',
    candidates: '',
    max_2opt: '',
    workers: '',
    mode: 'both', // serial, parallel, or both
    // seed is auto-calculated on backend based on bins
  });

  // Check if all required config values are filled
  const isConfigValid = () => {
    return (
      config.bins !== '' && config.bins > 0 &&
      config.trucks !== '' && config.trucks > 0 &&
      config.threshold !== '' && config.threshold > 0 &&
      config.workers !== '' && config.workers > 0 &&
      config.candidates !== '' && config.candidates > 0 &&
      config.max_2opt !== '' && config.max_2opt > 0 &&
      config.alpha !== '' && config.alpha > 0
    );
  };

  const [results, setResults] = useState({
    serial: null,
    parallel: null,
    speedup: null,
    completed: false,
    routes: {},
    bins: [],
    trucks: []
  });

  const [progress, setProgress] = useState({
    stage: 'idle',
    percent: 0,
    currentMode: null
  });

  // Check API connection - retry until connected
  const checkApiConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        setApiConnected(true);
        console.log('✅ Connected to Truck Routes API');
        return true;
      }
    } catch (error) {
      console.log('⏳ Waiting for API connection...');
    }
    return false;
  }, []);

  // Fetch city info
  const fetchCityInfo = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/city/info`);
      if (response.ok) {
        const data = await response.json();
        setCityInfo(data);
      }
    } catch (error) {
      setCityInfo({
        name: "Islamabad",
        country: "Pakistan",
        center: [33.6844, 73.0479],
        zoom: 12
      });
    }
  }, []);

  // Fetch system info (for reference only, doesn't auto-set values)
  const [systemInfo, setSystemInfo] = useState(null);
  const fetchSystemInfo = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/system/info`);
      if (response.ok) {
        const data = await response.json();
        setSystemInfo(data); // Store for display, but don't auto-set config
      }
    } catch (error) {
      // System info not available
    }
  }, []);

  // Fetch backend defaults (used as fallback values; does not auto-fill UI)
  const fetchDefaults = useCallback(async () => {
    if (defaults) return;
    try {
      const response = await fetch(`${API_BASE_URL}/config/defaults`);
      if (!response.ok) return;
      const data = await response.json();
      setDefaults(data);
    } catch (error) {
      // Defaults endpoint not available
    }
  }, [defaults]);

  // Initial connection and retry every 2 seconds if not connected
  useEffect(() => {
    let retryInterval;

    const initConnection = async () => {
      const connected = await checkApiConnection();
      if (connected) {
        await fetchCityInfo();
        await fetchSystemInfo();
        await fetchDefaults();
      } else {
        // Retry every 2 seconds
        retryInterval = setInterval(async () => {
          const success = await checkApiConnection();
          if (success) {
            clearInterval(retryInterval);
            await fetchCityInfo();
            await fetchSystemInfo();
            await fetchDefaults();
          }
        }, 2000);
      }
    };

    initConnection();

    return () => {
      if (retryInterval) clearInterval(retryInterval);
    };
  }, [checkApiConnection, fetchCityInfo, fetchSystemInfo, fetchDefaults]);

  // Run optimization with user's configuration
  const runOptimization = async () => {
    if (!apiConnected) {
      alert('Please wait for API connection or start the backend server.\n\nRun: python api_server.py\nIn folder: pdc_garbage_routes');
      return;
    }

    if (!isConfigValid()) {
      alert('Please fill in all configuration parameters before running optimization.\n\nGo to Configuration or Dashboard to enter all required values.');
      return;
    }

    setIsRunning(true);
    setResults({ serial: null, parallel: null, speedup: null, completed: false, routes: {}, bins: [], trucks: [] });
    setProgress({ stage: 'start', percent: 0, currentMode: config.mode });

    try {
      // Drop empty-string values and apply backend defaults as fallbacks
      const cleaned = Object.fromEntries(
        Object.entries(config).filter(([, value]) => value !== '')
      );

      const payload = {
        ...(defaults || {}),
        ...cleaned,
      };

      const response = await fetch(`${API_BASE_URL}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResults(data.results);
          setProgress({ stage: 'completed', percent: 100, currentMode: null });
          // Show results automatically
          setActiveTab('results');
        } else {
          console.error('Optimization failed:', data.message);
          alert(`Optimization failed: ${data.message}`);
        }
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        alert(`API Error: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Failed to connect to API server. Make sure the backend is running.');
    }

    setIsRunning(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            config={config}
            setConfig={setConfig}
            results={results}
            onRun={runOptimization}
            isRunning={isRunning}
            apiConnected={apiConnected}
            cityInfo={cityInfo}
            isConfigValid={isConfigValid()}
          />
        );
      case 'map':
        return <MapView config={config} results={results} cityInfo={cityInfo} apiConnected={apiConnected} />;
      case 'config':
        return <Configuration config={config} setConfig={setConfig} />;
      case 'results':
        return <Results results={results} config={config} cityInfo={cityInfo} />;
      default:
        return (
          <Dashboard
            config={config}
            setConfig={setConfig}
            results={results}
            onRun={runOptimization}
            isRunning={isRunning}
            apiConnected={apiConnected}
            cityInfo={cityInfo}
            isConfigValid={isConfigValid()}
          />
        );
    }
  };

  return (
    <div className="app">
      <Header apiConnected={apiConnected} cityInfo={cityInfo} />
      <div className="app-container">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRunOptimization={runOptimization}
          isRunning={isRunning}
          config={config}
          setConfig={setConfig}
          apiConnected={apiConnected}
          isConfigValid={isConfigValid()}
        />
        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="content-wrapper"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {isRunning && (
          <LoadingOverlay progress={progress} config={config} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
