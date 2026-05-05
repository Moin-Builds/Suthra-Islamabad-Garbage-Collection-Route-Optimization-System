import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Trash2,
    Truck,
    Zap,
    Cpu,
    Sliders,
    MapPin,
    Info,
    Database,
    Target,
    Activity,
    Gauge
} from 'lucide-react';
import './Configuration.css';
import { CONFIG_LIMITS } from '../configLimits';
import { blockNonNumericKeyDown, clampToLimits, parseNumericOrEmpty } from '../utils/numericInput';

const Configuration = ({ config, setConfig }) => {
    const [livePreview, setLivePreview] = useState({
        estimatedBins: 0,
        estimatedTime: 0,
        complexity: 'Low'
    });

    // Check if value is out of limits
    const isOutOfLimits = (key, value) => {
        if (!CONFIG_LIMITS[key]) return false;
        const limit = CONFIG_LIMITS[key];
        return value < limit.min || value > limit.max;
    };

    const clampConfigKey = (key) => {
        const limit = CONFIG_LIMITS[key];
        if (!limit) return;
        setConfig(prev => ({
            ...prev,
            [key]: clampToLimits(prev[key], limit)
        }));
    };

    // Calculate live preview based on current configuration
    useEffect(() => {
        const bins = config.bins || 0;
        const trucks = config.trucks || 1;
        const threshold = config.threshold || 50;
        const candidates = config.candidates || 1;
        const workers = config.workers || 1;

        // Estimate selected bins based on threshold (higher threshold = fewer bins)
        const estimatedBins = bins > 0 ? Math.round(bins * ((100 - threshold) / 50)) : 0;
        
        // Estimate processing time (rough calculation)
        const baseTime = (bins * candidates * 0.001);
        const serialTime = baseTime;
        const parallelTime = baseTime / Math.max(1, workers * 0.7);
        
        // Determine complexity
        let complexity = 'Low';
        if (bins > 200 || candidates > 10) complexity = 'Medium';
        if (bins > 400 || candidates > 15) complexity = 'High';

        setLivePreview({
            estimatedBins,
            serialTime: serialTime.toFixed(2),
            parallelTime: parallelTime.toFixed(2),
            complexity,
            binsPerTruck: Math.ceil(estimatedBins / trucks)
        });
    }, [config]);

    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleNumericChange = (key, raw, { allowDecimal = false } = {}) => {
        handleChange(key, parseNumericOrEmpty(raw, { allowDecimal }));
    };

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

    return (
        <motion.div
            className="configuration"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="page-header" variants={itemVariants}>
                <h1 className="page-title">
                    <Settings className="title-icon" size={32} />
                    <span className="gradient-text">Configuration</span>
                </h1>
                <p className="page-description">
                    Enter your data below - all parameters will be used in real-time optimization
                </p>
            </motion.div>

            {/* Live Preview Panel */}
            <motion.div className="live-preview-panel" variants={itemVariants}>
                <div className="preview-header">
                    <Activity size={18} />
                    <span>Live Preview</span>
                    <span className={`complexity-badge ${livePreview.complexity.toLowerCase()}`}>
                        {livePreview.complexity} Complexity
                    </span>
                </div>
                <div className="preview-stats">
                    <div className="preview-stat">
                        <Trash2 size={16} />
                        <span className="stat-value">~{livePreview.estimatedBins}</span>
                        <span className="stat-label">Bins to collect</span>
                    </div>
                    <div className="preview-stat">
                        <Truck size={16} />
                        <span className="stat-value">~{livePreview.binsPerTruck}</span>
                        <span className="stat-label">Bins per truck</span>
                    </div>
                    <div className="preview-stat">
                        <Gauge size={16} />
                        <span className="stat-value">~{livePreview.serialTime}s</span>
                        <span className="stat-label">Est. serial time</span>
                    </div>
                    <div className="preview-stat highlight">
                        <Zap size={16} />
                        <span className="stat-value">~{livePreview.parallelTime}s</span>
                        <span className="stat-label">Est. parallel time</span>
                    </div>
                </div>
            </motion.div>

            <motion.div className="config-grid" variants={itemVariants}>
                {/* Basic Parameters */}
                <div className="config-section">
                    <div className="section-header">
                        <MapPin size={20} />
                        <h3>Collection Parameters</h3>
                    </div>

                    <div className="config-group">
                        <label className="config-label">
                            <Trash2 size={16} />
                            <span>Number of Bins</span>
                        </label>
                        <input
                            type="number"
                            value={config.bins}
                            onKeyDown={(e) => blockNonNumericKeyDown(e)}
                            onChange={(e) => handleNumericChange('bins', e.target.value)}
                            onBlur={() => clampConfigKey('bins')}
                            min={CONFIG_LIMITS.bins.min}
                            max={CONFIG_LIMITS.bins.max}
                            placeholder={`Enter bins (${CONFIG_LIMITS.bins.min}-${CONFIG_LIMITS.bins.max})`}
                            className={`config-input ${config.bins !== '' && isOutOfLimits('bins', config.bins) ? 'input-error' : ''}`}
                        />
                        <span className="config-hint">
                            Garbage bins ({CONFIG_LIMITS.bins.min}-{CONFIG_LIMITS.bins.max})
                            {config.bins !== '' && isOutOfLimits('bins', config.bins) && <span className="error-text"> ⚠ Out of limits!</span>}
                        </span>
                    </div>

                    <div className="config-group">
                        <label className="config-label">
                            <Truck size={16} />
                            <span>Number of Trucks</span>
                        </label>
                        <input
                            type="number"
                            value={config.trucks}
                            onKeyDown={(e) => blockNonNumericKeyDown(e)}
                            onChange={(e) => handleNumericChange('trucks', e.target.value)}
                            onBlur={() => clampConfigKey('trucks')}
                            min={CONFIG_LIMITS.trucks.min}
                            max={CONFIG_LIMITS.trucks.max}
                            placeholder={`Enter trucks (${CONFIG_LIMITS.trucks.min}-${CONFIG_LIMITS.trucks.max})`}
                            className={`config-input ${config.trucks !== '' && isOutOfLimits('trucks', config.trucks) ? 'input-error' : ''}`}
                        />
                        <span className="config-hint">
                            Waste collection vehicles ({CONFIG_LIMITS.trucks.min}-{CONFIG_LIMITS.trucks.max})
                            {config.trucks !== '' && isOutOfLimits('trucks', config.trucks) && <span className="error-text"> ⚠ Out of limits!</span>}
                        </span>
                    </div>

                    <div className="config-group">
                        <label className="config-label">
                            <Sliders size={16} />
                            <span>Fill Threshold (%)</span>
                        </label>
                        <input
                            type="range"
                            value={config.threshold || 60}
                            onChange={(e) => handleChange('threshold', parseInt(e.target.value))}
                            min={CONFIG_LIMITS.threshold.min}
                            max={CONFIG_LIMITS.threshold.max}
                            className="config-slider"
                        />
                        <div className="slider-value">
                            <span>Only collect bins ≥ {config.threshold || '—'}% full</span>
                        </div>
                    </div>
                </div>

                {/* Performance Parameters */}
                <div className="config-section">
                    <div className="section-header">
                        <Zap size={20} />
                        <h3>Performance Settings</h3>
                    </div>

                    <div className="config-group">
                        <label className="config-label">
                            <Cpu size={16} />
                            <span>Worker Threads</span>
                        </label>
                        <input
                            type="number"
                            value={config.workers}
                            onKeyDown={(e) => blockNonNumericKeyDown(e)}
                            onChange={(e) => handleNumericChange('workers', e.target.value)}
                            onBlur={() => clampConfigKey('workers')}
                            min={CONFIG_LIMITS.workers.min}
                            max={CONFIG_LIMITS.workers.max}
                            placeholder={`Enter workers (${CONFIG_LIMITS.workers.min}-${CONFIG_LIMITS.workers.max})`}
                            className={`config-input ${config.workers !== '' && isOutOfLimits('workers', config.workers) ? 'input-error' : ''}`}
                        />
                        <span className="config-hint">
                            Parallel processing threads ({CONFIG_LIMITS.workers.min}-{CONFIG_LIMITS.workers.max})
                            {config.workers !== '' && isOutOfLimits('workers', config.workers) && <span className="error-text"> ⚠ Out of limits!</span>}
                        </span>
                    </div>

                    <div className="config-group">
                        <label className="config-label">
                            <Sliders size={16} />
                            <span>Route Candidates</span>
                        </label>
                        <input
                            type="number"
                            value={config.candidates}
                            onKeyDown={(e) => blockNonNumericKeyDown(e)}
                            onChange={(e) => handleNumericChange('candidates', e.target.value)}
                            onBlur={() => clampConfigKey('candidates')}
                            min={CONFIG_LIMITS.candidates.min}
                            max={CONFIG_LIMITS.candidates.max}
                            placeholder={`Enter candidates (${CONFIG_LIMITS.candidates.min}-${CONFIG_LIMITS.candidates.max})`}
                            className={`config-input ${config.candidates !== '' && isOutOfLimits('candidates', config.candidates) ? 'input-error' : ''}`}
                        />
                        <span className="config-hint">
                            More candidates = better routes but slower ({CONFIG_LIMITS.candidates.min}-{CONFIG_LIMITS.candidates.max})
                            {config.candidates !== '' && isOutOfLimits('candidates', config.candidates) && <span className="error-text"> ⚠ Out of limits!</span>}
                        </span>
                    </div>

                    <div className="config-group">
                        <label className="config-label">
                            <Sliders size={16} />
                            <span>2-Opt Iterations</span>
                        </label>
                        <input
                            type="number"
                            value={config.max_2opt}
                            onKeyDown={(e) => blockNonNumericKeyDown(e)}
                            onChange={(e) => handleNumericChange('max_2opt', e.target.value)}
                            onBlur={() => clampConfigKey('max_2opt')}
                            min={CONFIG_LIMITS.max_2opt.min}
                            max={CONFIG_LIMITS.max_2opt.max}
                            placeholder={`Enter iterations (${CONFIG_LIMITS.max_2opt.min}-${CONFIG_LIMITS.max_2opt.max})`}
                            className={`config-input ${config.max_2opt !== '' && isOutOfLimits('max_2opt', config.max_2opt) ? 'input-error' : ''}`}
                        />
                        <span className="config-hint">
                            Route optimization iterations ({CONFIG_LIMITS.max_2opt.min}-{CONFIG_LIMITS.max_2opt.max})
                            {config.max_2opt !== '' && isOutOfLimits('max_2opt', config.max_2opt) && <span className="error-text"> ⚠ Out of limits!</span>}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Advanced Parameters Section */}
            <motion.div className="config-section advanced-section" variants={itemVariants}>
                <div className="section-header">
                    <Database size={20} />
                    <h3>Advanced Algorithm Parameters</h3>
                </div>

                <div className="advanced-grid">
                    <div className="config-group">
                        <label className="config-label">
                            <Target size={16} />
                            <span>Alpha (α) - Distance Weight</span>
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={config.alpha}
                            onKeyDown={(e) => blockNonNumericKeyDown(e, { allowDecimal: true })}
                            onChange={(e) => handleNumericChange('alpha', e.target.value, { allowDecimal: true })}
                            onBlur={() => clampConfigKey('alpha')}
                            min={CONFIG_LIMITS.alpha.min}
                            max={CONFIG_LIMITS.alpha.max}
                            placeholder={`Enter alpha (${CONFIG_LIMITS.alpha.min}-${CONFIG_LIMITS.alpha.max})`}
                            className={`config-input ${config.alpha !== '' && isOutOfLimits('alpha', config.alpha) ? 'input-error' : ''}`}
                        />
                        <span className="config-hint">
                            Higher value prioritizes closer bins ({CONFIG_LIMITS.alpha.min}-{CONFIG_LIMITS.alpha.max})
                            {config.alpha !== '' && isOutOfLimits('alpha', config.alpha) && <span className="error-text"> ⚠ Out of limits!</span>}
                        </span>
                    </div>

                    <div className="config-group">
                        <label className="config-label">
                            <Activity size={16} />
                            <span>Beta (β) - Fill Level Weight</span>
                        </label>
                        <input
                            type="number"
                            step="1"
                            value={config.beta}
                            onKeyDown={(e) => blockNonNumericKeyDown(e, { allowDecimal: true })}
                            onChange={(e) => handleNumericChange('beta', e.target.value, { allowDecimal: true })}
                            onBlur={() => clampConfigKey('beta')}
                            min={CONFIG_LIMITS.beta.min}
                            max={CONFIG_LIMITS.beta.max}
                            placeholder={`Enter beta (${CONFIG_LIMITS.beta.min}-${CONFIG_LIMITS.beta.max})`}
                            className={`config-input ${config.beta !== '' && isOutOfLimits('beta', config.beta) ? 'input-error' : ''}`}
                        />
                        <span className="config-hint">
                            Higher value prioritizes fuller bins ({CONFIG_LIMITS.beta.min}-{CONFIG_LIMITS.beta.max})
                            {config.beta !== '' && isOutOfLimits('beta', config.beta) && <span className="error-text"> ⚠ Out of limits!</span>}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Info Card */}
            <motion.div className="info-card" variants={itemVariants}>
                <div className="info-icon">
                    <Info size={20} />
                </div>
                <div className="info-content">
                    <h4>How Your Data Affects Results</h4>
                    <ul>
                        <li><strong>Number of Bins:</strong> Total garbage bins to generate in Islamabad</li>
                        <li><strong>Fill Threshold:</strong> Only bins ≥ this % full will be collected</li>
                        <li><strong>Trucks:</strong> Vehicles available for collection routes</li>
                        <li><strong>Workers:</strong> CPU threads for parallel processing</li>
                        <li><strong>α/β:</strong> Tune priority between distance vs fill level</li>
                    </ul>
                </div>
            </motion.div>

            {/* Current Settings Summary */}
            <motion.div className="settings-summary" variants={itemVariants}>
                <h4>Your Configuration Summary</h4>
                <div className="summary-grid">
                    <div className="summary-item">
                        <span className="summary-label">Bins</span>
                        <span className="summary-value">{config.bins || '—'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Trucks</span>
                        <span className="summary-value">{config.trucks || '—'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Threshold</span>
                        <span className="summary-value">{config.threshold ? `${config.threshold}%` : '—'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Workers</span>
                        <span className="summary-value">{config.workers || '—'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Candidates</span>
                        <span className="summary-value">{config.candidates || '—'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">2-Opt Iters</span>
                        <span className="summary-value">{config.max_2opt || '—'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Alpha (α)</span>
                        <span className="summary-value">{config.alpha || '—'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Beta (β)</span>
                        <span className="summary-value">{config.beta || '—'}</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Configuration;
