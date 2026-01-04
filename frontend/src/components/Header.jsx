import { motion } from 'framer-motion';
import {
    Search,
    Bell,
    Moon,
    Settings,
    MapPin,
    Wifi,
    WifiOff
} from 'lucide-react';
import './Header.css';

const Header = ({ apiConnected, cityInfo }) => {
    return (
        <header className="header">
            <div className="header-left">
                <div className="logo">
                    <div className="logo-icon">
                        <span>🚛</span>
                    </div>
                    <div className="logo-text">
                        <span className="logo-title">Optimized Truck Routes</span>
                        <span className="logo-subtitle">Islamabad Garbage Collection</span>
                    </div>
                </div>
            </div>

            <div className="header-center">
                <div className="city-indicator">
                    <MapPin size={16} />
                    <span>{cityInfo?.name || 'Islamabad'}, {cityInfo?.country || 'Pakistan'}</span>
                </div>
            </div>

            <div className="header-right">
                <div className={`connection-status ${apiConnected ? 'connected' : 'disconnected'}`}>
                    {apiConnected ? (
                        <>
                            <Wifi size={16} />
                            <span>API Connected</span>
                        </>
                    ) : (
                        <>
                            <WifiOff size={16} />
                            <span>API Offline</span>
                        </>
                    )}
                </div>

                <div className="user-avatar">
                    <span>PK</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
