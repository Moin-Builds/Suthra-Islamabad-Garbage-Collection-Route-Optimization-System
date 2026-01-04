import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Map as MapIcon,
    Truck,
    Trash2,
    Navigation,
    Eye,
    EyeOff,
    RefreshCw,
    MapPin
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Truck colors
const TRUCK_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981'];

// Custom truck icon
const createTruckIcon = (color, id) => {
    return L.divIcon({
        className: 'truck-marker',
        html: `<div style="background: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-weight: bold; color: white; font-size: 12px;">T${id}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
};

// Custom bin icon
const createBinIcon = (fill, selected, color) => {
    const size = selected ? 14 : 10;
    const opacity = selected ? 1 : 0.4;
    const bgColor = selected ? color : '#666';

    return L.divIcon({
        className: 'bin-marker',
        html: `<div style="background: ${bgColor}; width: ${size}px; height: ${size}px; border-radius: 50%; opacity: ${opacity}; border: 2px solid rgba(255,255,255,0.5); box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

// Map center updater component
const MapCenterUpdater = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

const MapView = ({ config, results, cityInfo, apiConnected }) => {
    const [selectedTruck, setSelectedTruck] = useState(null);
    const [showAllBins, setShowAllBins] = useState(true);
    const [showRoutes, setShowRoutes] = useState(true);

    const hasRoutes = results?.routes && Object.keys(results.routes).length > 0;
    const bins = results?.bins || [];
    const trucks = results?.trucks || [];

    // Default to Islamabad center
    const center = cityInfo?.center || [33.6844, 73.0479];
    const zoom = cityInfo?.zoom || 12;

    // Get bins assigned to a specific truck
    const getBinsForTruck = (truckId) => {
        const route = results?.routes?.[String(truckId)];
        if (!route) return [];
        return route.waypoints || [];
    };

    // Get truck color
    const getTruckColor = (index) => TRUCK_COLORS[index % TRUCK_COLORS.length];

    // Build route polyline for a truck
    const getRoutePolyline = (truckId) => {
        const route = results?.routes?.[String(truckId)];
        if (!route || !route.waypoints || route.waypoints.length === 0) return [];

        const points = [];
        // Start from truck
        points.push([route.truck_lat, route.truck_lng]);
        // Add all waypoints
        route.waypoints.forEach(wp => {
            points.push([wp.lat, wp.lng]);
        });
        // Return to truck
        points.push([route.truck_lat, route.truck_lng]);

        return points;
    };

    return (
        <motion.div
            className="map-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="page-header">
                <h1 className="page-title">
                    <MapIcon className="title-icon" size={32} />
                    Islamabad <span className="gradient-text">Route Map</span>
                </h1>
                <p className="page-description">
                    Interactive map showing garbage bin locations and optimized collection routes in Islamabad, Pakistan
                </p>
            </div>

            {!apiConnected && (
                <div className="api-warning">
                    <MapPin size={20} />
                    <span>Connect to API to view real routes. Start the backend server first.</span>
                </div>
            )}

            <div className="map-controls">
                <div className="control-group">
                    <button
                        className={`control-btn ${showAllBins ? 'active' : ''}`}
                        onClick={() => setShowAllBins(!showAllBins)}
                    >
                        {showAllBins ? <Eye size={18} /> : <EyeOff size={18} />}
                        <span>All Bins</span>
                    </button>
                    <button
                        className={`control-btn ${showRoutes ? 'active' : ''}`}
                        onClick={() => setShowRoutes(!showRoutes)}
                    >
                        <Navigation size={18} />
                        <span>Routes</span>
                    </button>
                </div>
            </div>

            <div className="map-container-wrapper">
                <MapContainer
                    center={center}
                    zoom={zoom}
                    className="leaflet-map"
                    scrollWheelZoom={true}
                >
                    <MapCenterUpdater center={center} zoom={zoom} />

                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Draw routes if available */}
                    {showRoutes && hasRoutes && trucks.map((truck, idx) => {
                        if (selectedTruck !== null && selectedTruck !== truck.id) return null;

                        const routePoints = getRoutePolyline(truck.id);
                        if (routePoints.length === 0) return null;

                        return (
                            <Polyline
                                key={`route-${truck.id}`}
                                positions={routePoints}
                                color={getTruckColor(idx)}
                                weight={4}
                                opacity={0.8}
                            />
                        );
                    })}

                    {/* Draw all bins */}
                    {showAllBins && bins.map((bin, idx) => {
                        const isSelected = bin.fill >= config.threshold;
                        // Find which truck this bin belongs to
                        let binColor = '#666';
                        trucks.forEach((truck, tIdx) => {
                            const truckBins = getBinsForTruck(truck.id);
                            if (truckBins.some(b => b.id === bin.id)) {
                                binColor = getTruckColor(tIdx);
                            }
                        });

                        return (
                            <Marker
                                key={`bin-${bin.id}`}
                                position={[bin.lat, bin.lng]}
                                icon={createBinIcon(bin.fill, isSelected, binColor)}
                            >
                                <Popup>
                                    <div className="popup-content">
                                        <strong>Bin #{bin.id}</strong>
                                        <div>Fill Level: {bin.fill.toFixed(1)}%</div>
                                        <div>Status: {isSelected ? '✅ Selected' : '⬜ Not Selected'}</div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* Draw truck markers */}
                    {trucks.map((truck, idx) => (
                        <Marker
                            key={`truck-${truck.id}`}
                            position={[truck.lat, truck.lng]}
                            icon={createTruckIcon(getTruckColor(idx), truck.id)}
                            eventHandlers={{
                                click: () => setSelectedTruck(selectedTruck === truck.id ? null : truck.id)
                            }}
                        >
                            <Popup>
                                <div className="popup-content">
                                    <strong>🚛 Truck #{truck.id}</strong>
                                    {results?.routes?.[String(truck.id)] && (
                                        <>
                                            <div>Bins to collect: {results.routes[String(truck.id)].bins_count}</div>
                                            <div>Distance: {results.routes[String(truck.id)].distance.toFixed(2)} km</div>
                                        </>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Truck Route Legend */}
            <div className="route-legend">
                <h4><Truck size={18} /> Truck Routes</h4>
                <div className="legend-grid">
                    {trucks.map((truck, idx) => {
                        const route = results?.routes?.[String(truck.id)];
                        const isActive = selectedTruck === null || selectedTruck === truck.id;

                        return (
                            <div
                                key={truck.id}
                                className={`legend-card ${isActive ? 'active' : 'inactive'} ${selectedTruck === truck.id ? 'selected' : ''}`}
                                onClick={() => setSelectedTruck(selectedTruck === truck.id ? null : truck.id)}
                            >
                                <div className="legend-color" style={{ background: getTruckColor(idx) }}></div>
                                <div className="legend-info">
                                    <span className="legend-title">Truck {truck.id}</span>
                                    {route && (
                                        <span className="legend-stats">
                                            {route.bins_count} bins • {route.distance.toFixed(1)} km
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {trucks.length === 0 && (
                    <div className="no-routes">
                        <RefreshCw size={24} />
                        <p>Run optimization to see truck routes</p>
                    </div>
                )}
            </div>

            {/* Statistics */}
            <div className="map-stats">
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <Trash2 size={24} />
                    </div>
                    <div className="stat-value">{bins.filter(b => b.fill >= config.threshold).length}</div>
                    <div className="stat-label">Selected Bins</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon info">
                        <Truck size={24} />
                    </div>
                    <div className="stat-value">{trucks.length}</div>
                    <div className="stat-label">Active Trucks</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon success">
                        <Navigation size={24} />
                    </div>
                    <div className="stat-value">
                        {results?.parallel?.distance_total
                            ? `${results.parallel.distance_total.toFixed(1)} km`
                            : '—'}
                    </div>
                    <div className="stat-label">Total Distance</div>
                </div>
            </div>
        </motion.div>
    );
};

export default MapView;
