import { motion } from 'framer-motion';
import {
    Trash2,
    Truck,
    Route,
    Zap,
    Play,
    TrendingUp,
    Clock,
    MapPin,
    Activity,
    Settings2,
    CheckCircle,
    Edit3,
    Cpu,
    Sliders,
    RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './Dashboard.css';

const TRUCK_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

const Dashboard = ({ config, setConfig, results, onRun, isRunning, apiConnected, cityInfo, isConfigValid }) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    // Improved config change handler - allows any valid number
    const handleConfigChange = (key, value) => {
        console.log(`Config change: ${key} = ${value} (type: ${typeof value})`);
        setConfig(prev => {
            const newConfig = { ...prev, [key]: value };
            console.log('New config:', newConfig);
            return newConfig;
        });
    };

    // Parse number input - returns empty string if invalid (no hardcoded fallbacks)
    const parseNumber = (value, isFloat = false) => {
        if (value === '' || value === null || value === undefined) return '';
        const parsed = isFloat ? parseFloat(value) : parseInt(value, 10);
        return isNaN(parsed) ? '' : parsed;
    };

    // Generate route data from actual results
    const routeData = results?.routes
        ? Object.entries(results.routes).map(([truckId, route], idx) => ({
            name: `T${truckId}`,
            distance: route.distance || 0,
            bins: route.bins_count || 0,
            color: TRUCK_COLORS[idx % TRUCK_COLORS.length]
        }))
        : [];

    return (
        <motion.div
            className="dashboard"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="page-header" variants={itemVariants}>
                <h1 className="page-title">
                    <MapPin size={32} className="title-icon" />
                    {cityInfo?.name || 'Islamabad'} <span className="gradient-text">Route Optimizer</span>
                </h1>
                <p className="page-description">
                    Configure parameters and optimize garbage collection routes
                </p>
            </motion.div>

            {/* API Status */}
            <motion.div className={`api-status ${apiConnected ? 'connected' : 'disconnected'}`} variants={itemVariants}>
                {apiConnected ? (
                    <>
                        <CheckCircle size={18} />
                        <span>Backend API Connected - Ready to optimize</span>
                    </>
                ) : (
                    <>
                        <RefreshCw size={18} className="spin" />
                        <span>Connecting to backend API...</span>
                    </>
                )}
            </motion.div>

            {/* Main Configuration Panel - ALL OPTIONS */}
            <motion.div className="main-config-panel" variants={itemVariants}>
                <div className="panel-header">
                    <Edit3 size={22} />
                    <h3>Configuration Parameters</h3>
                    <span className="panel-badge">Enter your data below</span>
                </div>

                {/* Collection Parameters */}
                <div className="config-section">
                    <h4 className="section-label">
                        <MapPin size={18} />
                        Collection Settings
                    </h4>
                    <div className="config-row">
                        <div className="config-field">
                            <label>
                                <Trash2 size={16} />
                                Number of Bins
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={config.bins}
                                onChange={(e) => handleConfigChange('bins', parseNumber(e.target.value))}
                                placeholder="Enter bins (10-500)"
                            />
                            <span className="field-hint">Garbage bins (10-500)</span>
                        </div>

                        <div className="config-field">
                            <label>
                                <Truck size={16} />
                                Number of Trucks
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={config.trucks}
                                onChange={(e) => handleConfigChange('trucks', parseNumber(e.target.value))}
                                placeholder="Enter trucks (1-10)"
                            />
                            <span className="field-hint">Vehicles (1-10)</span>
                        </div>

                        <div className="config-field">
                            <label>
                                <Activity size={16} />
                                Fill Threshold (%)
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={config.threshold}
                                onChange={(e) => handleConfigChange('threshold', parseNumber(e.target.value))}
                                placeholder="Enter threshold (30-90)"
                            />
                            <span className="field-hint">Min fill level (30-90%)</span>
                        </div>
                    </div>
                </div>

                {/* Performance Parameters */}
                <div className="config-section">
                    <h4 className="section-label">
                        <Zap size={18} />
                        Performance Settings
                    </h4>
                    <div className="config-row">
                        <div className="config-field">
                            <label>
                                <Cpu size={16} />
                                Worker Threads
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={config.workers}
                                onChange={(e) => handleConfigChange('workers', parseNumber(e.target.value))}
                                placeholder="Enter workers (1-16)"
                            />
                            <span className="field-hint">Parallel threads (1-16)</span>
                        </div>

                        <div className="config-field">
                            <label>
                                <Route size={16} />
                                Route Candidates
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={config.candidates}
                                onChange={(e) => handleConfigChange('candidates', parseNumber(e.target.value))}
                                placeholder="Enter candidates (1-20)"
                            />
                            <span className="field-hint">More = better (1-20)</span>
                        </div>

                        <div className="config-field">
                            <label>
                                <Sliders size={16} />
                                2-Opt Iterations
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={config.max_2opt}
                                onChange={(e) => handleConfigChange('max_2opt', parseNumber(e.target.value))}
                                placeholder="Enter iterations (10-200)"
                            />
                            <span className="field-hint">Optimization (10-200)</span>
                        </div>

                        <div className="config-field">
                            <label>
                                <Settings2 size={16} />
                                Alpha (α)
                            </label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={config.alpha}
                                onChange={(e) => handleConfigChange('alpha', parseNumber(e.target.value, true))}
                                placeholder="Enter alpha (0.1-5.0)"
                            />
                            <span className="field-hint">Distance weight</span>
                        </div>
                    </div>
                </div>

                {/* Processing Mode */}
                <div className="config-section mode-section">
                    <h4 className="section-label">
                        <TrendingUp size={18} />
                        Processing Mode
                    </h4>
                    <div className="mode-selector">
                        <button
                            type="button"
                            className={`mode-btn-large ${config.mode === 'serial' ? 'active serial' : ''}`}
                            onClick={() => handleConfigChange('mode', 'serial')}
                        >
                            <Clock size={24} />
                            <div className="mode-text">
                                <span className="mode-title">Serial</span>
                                <span className="mode-desc">Single-threaded, baseline</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            className={`mode-btn-large ${config.mode === 'parallel' ? 'active parallel' : ''}`}
                            onClick={() => handleConfigChange('mode', 'parallel')}
                        >
                            <Zap size={24} />
                            <div className="mode-text">
                                <span className="mode-title">Parallel</span>
                                <span className="mode-desc">{config.workers || '?'} workers, faster</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            className={`mode-btn-large ${config.mode === 'both' ? 'active both' : ''}`}
                            onClick={() => handleConfigChange('mode', 'both')}
                        >
                            <TrendingUp size={24} />
                            <div className="mode-text">
                                <span className="mode-title">Compare Both</span>
                                <span className="mode-desc">Show speedup comparison</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Run Button */}
                <div className="run-section">
                    <motion.button
                        type="button"
                        className={`run-btn-main ${!apiConnected || !isConfigValid ? 'disabled' : ''}`}
                        onClick={onRun}
                        disabled={isRunning || !apiConnected || !isConfigValid}
                        whileHover={{ scale: apiConnected && !isRunning && isConfigValid ? 1.02 : 1 }}
                        whileTap={{ scale: apiConnected && !isRunning && isConfigValid ? 0.98 : 1 }}
                    >
                        {isRunning ? (
                            <>
                                <div className="spinner"></div>
                                Optimizing Routes...
                            </>
                        ) : (
                            <>
                                <Play size={22} />
                                Run Optimization
                            </>
                        )}
                    </motion.button>
                    <p className="run-hint">
                        {!apiConnected
                            ? 'Waiting for API connection...'
                            : !isConfigValid
                            ? 'Please fill in all configuration fields above'
                            : `Will optimize ${config.bins} bins with ${config.trucks} trucks using ${config.mode} mode`}
                    </p>
                </div>
            </motion.div>

            {/* Results Summary - Only show after optimization */}
            {results.completed && (
                <motion.div className="results-summary" variants={itemVariants}>
                    <h3>
                        <CheckCircle size={20} className="success-icon" />
                        Optimization Results
                    </h3>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <span className="summary-value">
                                {results.parallel?.distance_total?.toFixed(1) || results.serial?.distance_total?.toFixed(1) || '—'} km
                            </span>
                            <span className="summary-label">Total Distance</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-value">
                                {results.parallel?.bins_selected || results.serial?.bins_selected || '—'}
                            </span>
                            <span className="summary-label">Bins Selected</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-value">
                                {results.parallel?.t_total?.toFixed(3) || results.serial?.t_total?.toFixed(3) || '—'}s
                            </span>
                            <span className="summary-label">
                                {results.speedup ? 'Parallel Time' : 'Compute Time'}
                            </span>
                        </div>
                        {results.speedup && (
                            <div className="summary-item highlight">
                                <span className="summary-value speedup">
                                    {results.speedup.toFixed(2)}x
                                </span>
                                <span className="summary-label">Speedup</span>
                            </div>
                        )}
                    </div>

                    {/* Per-truck summary */}
                    {routeData.length > 0 && (
                        <div className="truck-summary">
                            <h4>Per-Truck Routes</h4>
                            <div className="truck-cards">
                                {routeData.map((truck, idx) => (
                                    <div key={truck.name} className="truck-mini-card" style={{ borderColor: truck.color }}>
                                        <span className="truck-id" style={{ background: truck.color }}>T{idx + 1}</span>
                                        <span className="truck-info">{truck.distance.toFixed(2)} km • {truck.bins} bins</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Quick Stats Footer */}
            <motion.div className="quick-stats" variants={itemVariants}>
                <div className="quick-stat">
                    <MapPin size={16} />
                    <span>{cityInfo?.name || 'Islamabad'}, Pakistan</span>
                </div>
                <div className="quick-stat">
                    <Settings2 size={16} />
                    <span>Mode: {config.mode === 'both' ? 'Compare' : config.mode}</span>
                </div>
                <div className="quick-stat">
                    <Cpu size={16} />
                    <span>{config.workers || '—'} Workers</span>
                </div>
                <div className="quick-stat">
                    <Activity size={16} />
                    <span>≥{config.threshold || '—'}% Fill</span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;
