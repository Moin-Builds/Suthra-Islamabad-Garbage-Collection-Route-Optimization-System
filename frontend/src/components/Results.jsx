import { motion } from 'framer-motion';
import {
    BarChart3,
    Clock,
    Zap,
    TrendingUp,
    CheckCircle,
    Route,
    Truck,
    Trash2,
    Timer,
    Cpu,
    Activity,
    MapPin,
    Navigation,
    ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './Results.css';

const TRUCK_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981'];

const Results = ({ results, config, cityInfo }) => {
    const hasResults = results?.serial || results?.parallel || (results?.routes && Object.keys(results.routes).length > 0);
    const hasComparison = results?.serial && results?.parallel;

    // Prepare route data for charts
    const routeData = results?.routes
        ? Object.entries(results.routes).map(([truckId, route], idx) => ({
            id: truckId,
            name: `Truck ${truckId}`,
            distance: route.distance || 0,
            bins_count: route.bins_count || 0,
            color: TRUCK_COLORS[idx % TRUCK_COLORS.length]
        }))
        : [];

    // Timing comparison data
    const timingData = hasComparison ? [
        { name: 'Metrics', serial: results.serial.t_metrics, parallel: results.parallel.t_metrics },
        { name: 'Assign', serial: results.serial.t_assign, parallel: results.parallel.t_assign },
        { name: 'Routes', serial: results.serial.t_routes, parallel: results.parallel.t_routes },
    ] : [];

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

    if (!hasResults) {
        return (
            <motion.div
                className="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="page-header">
                    <h1 className="page-title">
                        <BarChart3 className="title-icon" size={32} />
                        <span className="gradient-text">Results</span>
                    </h1>
                    <p className="page-description">
                        View optimized routes and performance comparison
                    </p>
                </div>

                <div className="empty-state">
                    <div className="empty-state-icon">
                        <MapPin size={48} />
                    </div>
                    <h3 className="empty-state-title">No Results Yet</h3>
                    <p className="empty-state-text">
                        Run the optimization from the Dashboard to see results. Select "Compare Both" mode to see Serial vs Parallel comparison.
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="results"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="page-header" variants={itemVariants}>
                <h1 className="page-title">
                    <CheckCircle className="title-icon success" size={32} />
                    Optimization <span className="gradient-text">Complete</span>
                </h1>
                <p className="page-description">
                    Routes optimized for {cityInfo?.name || 'Islamabad'} • Mode: {results?.mode || config.mode}
                </p>
            </motion.div>

            {/* Speedup Hero - Show when comparison */}
            {hasComparison && results.speedup && (
                <motion.div className="speedup-hero" variants={itemVariants}>
                    <div className="speedup-main">
                        <div className="speedup-icon">
                            <Zap size={36} />
                        </div>
                        <div className="speedup-info">
                            <span className="speedup-value">{results.speedup.toFixed(2)}x</span>
                            <span className="speedup-label">Parallel Speedup</span>
                        </div>
                    </div>
                    <div className="speedup-comparison">
                        <div className="comparison-item serial">
                            <Clock size={18} />
                            <span className="comp-label">Serial</span>
                            <span className="comp-value">{results.serial.t_total.toFixed(3)}s</span>
                        </div>
                        <ArrowRight size={20} className="comparison-arrow" />
                        <div className="comparison-item parallel">
                            <Zap size={18} />
                            <span className="comp-label">Parallel</span>
                            <span className="comp-value">{results.parallel.t_total.toFixed(3)}s</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Comparison Cards - Serial vs Parallel */}
            {hasComparison && (
                <motion.div className="comparison-grid" variants={itemVariants}>
                    {/* Serial Card */}
                    <div className="comparison-card serial">
                        <div className="card-badge serial">
                            <Clock size={16} />
                            Serial Mode
                        </div>
                        <div className="card-stats">
                            <div className="stat-row">
                                <span className="stat-name">Total Time</span>
                                <span className="stat-val">{results.serial.t_total.toFixed(4)}s</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-name">Distance</span>
                                <span className="stat-val">{results.serial.distance_total.toFixed(2)} km</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-name">Bins Selected</span>
                                <span className="stat-val">{results.serial.bins_selected}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-name">Workers</span>
                                <span className="stat-val">1 (single-thread)</span>
                            </div>
                        </div>
                        <div className="timing-detail">
                            <h5>Timing Breakdown</h5>
                            <div className="timing-rows">
                                <div className="timing-row">
                                    <span>Metrics</span>
                                    <span>{results.serial.t_metrics.toFixed(4)}s</span>
                                </div>
                                <div className="timing-row">
                                    <span>Assign</span>
                                    <span>{results.serial.t_assign.toFixed(4)}s</span>
                                </div>
                                <div className="timing-row">
                                    <span>Routes</span>
                                    <span>{results.serial.t_routes.toFixed(4)}s</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VS Divider */}
                    <div className="vs-divider">
                        <span className="vs-text">VS</span>
                    </div>

                    {/* Parallel Card */}
                    <div className="comparison-card parallel">
                        <div className="card-badge parallel">
                            <Zap size={16} />
                            Parallel Mode
                        </div>
                        <div className="card-stats">
                            <div className="stat-row">
                                <span className="stat-name">Total Time</span>
                                <span className="stat-val highlight">{results.parallel.t_total.toFixed(4)}s</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-name">Distance</span>
                                <span className="stat-val">{results.parallel.distance_total.toFixed(2)} km</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-name">Bins Selected</span>
                                <span className="stat-val">{results.parallel.bins_selected}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-name">Workers</span>
                                <span className="stat-val highlight">{results.parallel.workers || config.workers} threads</span>
                            </div>
                        </div>
                        <div className="timing-detail">
                            <h5>Timing Breakdown</h5>
                            <div className="timing-rows">
                                <div className="timing-row winner">
                                    <span>Metrics</span>
                                    <span>{results.parallel.t_metrics.toFixed(4)}s</span>
                                </div>
                                <div className="timing-row">
                                    <span>Assign</span>
                                    <span>{results.parallel.t_assign.toFixed(4)}s</span>
                                </div>
                                <div className="timing-row winner">
                                    <span>Routes</span>
                                    <span>{results.parallel.t_routes.toFixed(4)}s</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Single Mode Results */}
            {!hasComparison && (results.serial || results.parallel) && (
                <motion.div className="single-result-card" variants={itemVariants}>
                    <div className={`result-badge ${results.serial ? 'serial' : 'parallel'}`}>
                        {results.serial ? <Clock size={18} /> : <Zap size={18} />}
                        {results.serial ? 'Serial Mode' : 'Parallel Mode'}
                    </div>
                    <div className="result-grid">
                        <div className="result-stat">
                            <Timer size={24} />
                            <span className="value">{(results.serial?.t_total || results.parallel?.t_total).toFixed(4)}s</span>
                            <span className="label">Total Time</span>
                        </div>
                        <div className="result-stat">
                            <Navigation size={24} />
                            <span className="value">{(results.serial?.distance_total || results.parallel?.distance_total).toFixed(2)} km</span>
                            <span className="label">Total Distance</span>
                        </div>
                        <div className="result-stat">
                            <Trash2 size={24} />
                            <span className="value">{results.serial?.bins_selected || results.parallel?.bins_selected}</span>
                            <span className="label">Bins Selected</span>
                        </div>
                        <div className="result-stat">
                            <Cpu size={24} />
                            <span className="value">{results.parallel?.workers || 1}</span>
                            <span className="label">Workers</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Per-Truck Routes */}
            {routeData.length > 0 && (
                <motion.div className="truck-routes-section" variants={itemVariants}>
                    <h2 className="section-title">
                        <Route size={22} />
                        Individual Truck Routes
                    </h2>
                    <div className="truck-routes-grid">
                        {routeData.map((truck, idx) => (
                            <div
                                key={truck.id}
                                className="truck-route-card"
                                style={{ '--truck-color': truck.color }}
                            >
                                <div className="truck-header" style={{ background: truck.color }}>
                                    <Truck size={18} />
                                    <span>Truck {truck.id}</span>
                                </div>
                                <div className="truck-details">
                                    <div className="detail-item">
                                        <Navigation size={16} />
                                        <span>{truck.distance.toFixed(2)} km</span>
                                    </div>
                                    <div className="detail-item">
                                        <Trash2 size={16} />
                                        <span>{truck.bins_count} bins</span>
                                    </div>
                                </div>
                                {results.routes?.[truck.id]?.waypoints && (
                                    <div className="route-preview">
                                        <span className="route-stop">🚛 Start</span>
                                        {results.routes[truck.id].waypoints.slice(0, 3).map((wp, i) => (
                                            <span key={wp.id} className="route-stop">→ Bin #{wp.id}</span>
                                        ))}
                                        {results.routes[truck.id].waypoints.length > 3 && (
                                            <span className="route-stop">→ +{results.routes[truck.id].waypoints.length - 3} more</span>
                                        )}
                                        <span className="route-stop">→ 🏁 End</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Timing Comparison Chart */}
            {hasComparison && (
                <motion.div className="card chart-card" variants={itemVariants}>
                    <div className="card-header">
                        <h4 className="card-title">
                            <Activity size={20} />
                            Processing Time Comparison
                        </h4>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={timingData} layout="vertical" barGap={8}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={60} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(26, 26, 37, 0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white'
                                    }}
                                    formatter={(value) => `${value.toFixed(4)}s`}
                                />
                                <Bar dataKey="serial" fill="#f59e0b" name="Serial" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="parallel" fill="#22c55e" name="Parallel" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#f59e0b' }}></span>
                            Serial (single-thread)
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#22c55e' }}></span>
                            Parallel ({results.parallel?.workers || config.workers} workers)
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Summary Footer */}
            <motion.div className="results-footer" variants={itemVariants}>
                <CheckCircle size={24} className="success-icon" />
                <div className="footer-text">
                    <strong>Routes Ready!</strong>
                    <span>
                        {routeData.length} trucks will collect from {results.parallel?.bins_selected || results.serial?.bins_selected || 0} bins
                        in {cityInfo?.name || 'Islamabad'}
                        {results.speedup && ` - Parallel was ${results.speedup.toFixed(2)}x faster`}
                    </span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Results;
