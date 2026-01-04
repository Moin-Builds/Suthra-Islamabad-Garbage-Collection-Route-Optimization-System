import { motion } from 'framer-motion';
import { Loader2, Clock, Zap, TrendingUp } from 'lucide-react';
import './LoadingOverlay.css';

const LoadingOverlay = ({ progress, config }) => {
    const stages = [
        { key: 'start', label: 'Starting...' },
        { key: 'generated', label: 'Generating bins & trucks...' },
        { key: 'filtered', label: 'Filtering bins by threshold...' },
        { key: 'computing', label: 'Computing metrics...' },
        { key: 'serial_done', label: 'Serial complete, starting parallel...' },
        { key: 'parallel_done', label: 'Parallel complete...' },
        { key: 'completed', label: 'Optimization complete!' },
    ];

    const currentStage = stages.find(s => s.key === progress.stage) || stages[0];
    const mode = config?.mode || progress.currentMode || 'parallel';

    const getModeLabel = () => {
        switch (mode) {
            case 'serial': return { icon: Clock, label: 'Serial Mode', color: '#f59e0b' };
            case 'parallel': return { icon: Zap, label: 'Parallel Mode', color: '#22c55e' };
            case 'both': return { icon: TrendingUp, label: 'Comparing Both', color: '#6366f1' };
            default: return { icon: Zap, label: 'Processing', color: '#6366f1' };
        }
    };

    const modeInfo = getModeLabel();
    const ModeIcon = modeInfo.icon;

    return (
        <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="loading-card"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="loading-spinner-container">
                    <motion.div
                        className="spinner-ring"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                        <Loader2 size={48} />
                    </motion.div>
                </div>

                <h3 className="loading-title">Optimizing Routes</h3>

                <div className="mode-badge" style={{ background: `${modeInfo.color}20`, borderColor: modeInfo.color }}>
                    <ModeIcon size={16} style={{ color: modeInfo.color }} />
                    <span style={{ color: modeInfo.color }}>{modeInfo.label}</span>
                </div>

                <p className="loading-stage">{currentStage.label}</p>

                <div className="progress-container">
                    <div className="progress-bar">
                        <motion.div
                            className="progress-fill"
                            style={{ background: modeInfo.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percent}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                    <span className="progress-text">{Math.round(progress.percent)}%</span>
                </div>

                {progress.currentMode && (
                    <div className="current-mode">
                        Processing: <span style={{ color: progress.currentMode === 'serial' ? '#f59e0b' : '#22c55e' }}>
                            {progress.currentMode === 'serial' ? '⏱️ Serial' : '⚡ Parallel'}
                        </span>
                    </div>
                )}

                <p className="loading-hint">
                    {mode === 'both'
                        ? 'Running both modes for comparison...'
                        : `Using ${mode} processing for best results`}
                </p>
            </motion.div>
        </motion.div>
    );
};

export default LoadingOverlay;
