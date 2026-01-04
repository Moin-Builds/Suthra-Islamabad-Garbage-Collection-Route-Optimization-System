import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Map,
    Settings,
    BarChart3,
    Zap,
    Play,
    Clock,
    Cpu,
    TrendingUp
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'map', icon: Map, label: 'Route Map' },
    { id: 'config', icon: Settings, label: 'Configuration' },
    { id: 'results', icon: BarChart3, label: 'Results' },
];

const Sidebar = ({ activeTab, setActiveTab, onRunOptimization, isRunning, config, setConfig, apiConnected, isConfigValid }) => {
    const handleModeChange = (mode) => {
        if (setConfig) {
            setConfig(prev => ({ ...prev, mode }));
        }
    };

    const currentMode = config?.mode || 'both';

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <span className="nav-label">MAIN MENU</span>
                    <ul className="nav-list">
                        {menuItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(item.id)}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            {/* Mode Selection Card */}
            <div className="sidebar-card mode-card">
                <div className="card-icon">
                    <Cpu size={24} />
                </div>
                <h4>Processing Mode</h4>
                <p>Select how to run the optimization</p>

                <div className="mode-buttons">
                    <button
                        className={`mode-btn ${currentMode === 'serial' ? 'active serial' : ''}`}
                        onClick={() => handleModeChange('serial')}
                        type="button"
                    >
                        <Clock size={16} />
                        <span>Serial</span>
                    </button>
                    <button
                        className={`mode-btn ${currentMode === 'parallel' ? 'active parallel' : ''}`}
                        onClick={() => handleModeChange('parallel')}
                        type="button"
                    >
                        <Zap size={16} />
                        <span>Parallel</span>
                    </button>
                    <button
                        className={`mode-btn ${currentMode === 'both' ? 'active both' : ''}`}
                        onClick={() => handleModeChange('both')}
                        type="button"
                    >
                        <TrendingUp size={16} />
                        <span>Compare</span>
                    </button>
                </div>

                <div className="mode-info">
                    {currentMode === 'serial' && (
                        <span><Clock size={14} /> Single-threaded execution</span>
                    )}
                    {currentMode === 'parallel' && (
                        <span><Zap size={14} /> Multi-threaded ({config?.workers || '?'} workers)</span>
                    )}
                    {currentMode === 'both' && (
                        <span><TrendingUp size={14} /> Run both & compare speedup</span>
                    )}
                </div>

                <motion.button
                    className="run-btn-sidebar"
                    onClick={onRunOptimization}
                    disabled={isRunning || !apiConnected || !isConfigValid}
                    whileHover={{ scale: apiConnected && !isRunning && isConfigValid ? 1.02 : 1 }}
                    whileTap={{ scale: apiConnected && !isRunning && isConfigValid ? 0.98 : 1 }}
                    type="button"
                >
                    {isRunning ? (
                        <>
                            <div className="spinner"></div>
                            Running...
                        </>
                    ) : (
                        <>
                            <Play size={18} />
                            Run Optimization
                        </>
                    )}
                </motion.button>

                {!apiConnected && (
                    <div className="api-warning-small">
                        ⚠️ Connecting to API...
                    </div>
                )}

                {apiConnected && !isConfigValid && (
                    <div className="api-warning-small">
                        ⚠️ Enter all config values
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
