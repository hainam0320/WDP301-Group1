import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { FaMapMarkerAlt } from 'react-icons/fa';

const createIcon = (iconUrl) =>
  new L.Icon({
    iconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

const pickupIcon = createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png');
const deliveryIcon = createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png');

const RoutingMachine = ({ pickupCoords, deliveryCoords, onRouteFound }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!pickupCoords || !deliveryCoords) return;

    // Xoá tuyến cũ nếu có
    if (routingControlRef.current) {
      try {
        if (map.hasLayer(routingControlRef.current)) {
          map.removeControl(routingControlRef.current);
        }
      } catch (error) {
        console.error('Error removing routing control:', error);
      }
      routingControlRef.current = null;
    }

    try {
      routingControlRef.current = L.Routing.control({
        waypoints: [L.latLng(...pickupCoords), L.latLng(...deliveryCoords)],
        router: new L.Routing.OSRMv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving'
        }),
        routeWhileDragging: false,
        showAlternatives: true,
        lineOptions: {
          styles: [{ color: '#6366f1', weight: 6 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        },
        createMarker: () => null,
        fitSelectedRoutes: true,
        addWaypoints: false,
        show: false
      });

      routingControlRef.current.on('routesfound', (e) => {
        const route = e.routes?.[0];
        if (route) {
          const distance = route.summary.totalDistance / 1000;
          const time = Math.round(route.summary.totalTime / 60);
          onRouteFound(distance, time);
          map.fitBounds(L.latLngBounds(route.coordinates), { padding: [50, 50] });
        }
      });

      routingControlRef.current.addTo(map);
    } catch (error) {
      console.error('Error creating route:', error);
    }

    return () => {
      if (routingControlRef.current) {
        try {
          if (map.hasLayer(routingControlRef.current)) {
            map.removeControl(routingControlRef.current);
          }
        } catch (error) {
          console.error('Error cleaning up route:', error);
        }
        routingControlRef.current = null;
      }
    };
  }, [map, pickupCoords?.[0], pickupCoords?.[1], deliveryCoords?.[0], deliveryCoords?.[1]]);

  return null;
};

const MapClickHandler = ({ onMapClick, isSelectingPoint }) => {
  useMapEvents({
    click: async (e) => {
      if (!isSelectingPoint) return;
      const { lat, lng } = e.latlng;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        if (data.display_name) {
          onMapClick({ lat, lon: lng, display_name: data.display_name }, isSelectingPoint);
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      }
    }
  });
  return null;
};

const DeliveryMap = ({ onLocationUpdate, pickupLocation, deliveryLocation }) => {
  const [map, setMap] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState({ pickup: null, delivery: null });
  const [isSelectingPoint, setIsSelectingPoint] = useState(null);
  const searchTimeoutRef = useRef(null);

  const searchLocation = async (query, type) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5`);
      const data = await response.json();
      setSearchResults(
        data.map((item) => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        }))
      );
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value, type) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value, type);
    }, 500);
  };

  const handleLocationSelect = (location, type) => {
    const newMarker = {
      type,
      position: { lat: location.lat, lng: location.lon },
      address: location.display_name
    };
    setSelectedLocations((prev) => ({ ...prev, [type]: newMarker }));
    setSearchResults([]);
    onLocationUpdate(type, location.display_name, [location.lat, location.lon]);
  };

  const handleMapClick = (location, type) => {
    handleLocationSelect(location, type);
    setIsSelectingPoint(null);
  };

  useEffect(() => {
    if (map && selectedLocations.pickup && selectedLocations.delivery) {
      const bounds = L.latLngBounds([
        [selectedLocations.pickup.position.lat, selectedLocations.pickup.position.lng],
        [selectedLocations.delivery.position.lat, selectedLocations.delivery.position.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, selectedLocations.pickup, selectedLocations.delivery]);

  return (
    <div className="position-relative">
      <div className="mb-3">
        {isSelectingPoint && (
          <div className="alert alert-info">Click vào bản đồ để chọn {isSelectingPoint === 'pickup' ? 'điểm lấy hàng' : 'điểm giao hàng'}</div>
        )}

        <div className="position-relative mb-2">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Điểm lấy hàng..."
              value={pickupLocation}
              onChange={(e) => {
                onLocationUpdate('pickup', e.target.value, null);
                handleSearch(e.target.value, 'pickup');
              }}
            />
            <button
              className={`btn ${isSelectingPoint === 'pickup' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setIsSelectingPoint(isSelectingPoint === 'pickup' ? null : 'pickup')}
            >
              <FaMapMarkerAlt />
            </button>
          </div>
          {isLoading && <div className="spinner-border spinner-border-sm text-primary position-absolute top-50 end-0 me-3" role="status" />}
          {searchResults.length > 0 && (
            <div className="position-absolute w-100 mt-1 shadow-sm bg-white rounded border z-3">
              {searchResults.map((result, index) => (
                <button key={index} className="btn btn-light w-100 text-start border-0 py-2" onClick={() => handleLocationSelect(result, 'pickup')}>
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="position-relative">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Điểm giao hàng..."
              value={deliveryLocation}
              onChange={(e) => {
                onLocationUpdate('delivery', e.target.value, null);
                handleSearch(e.target.value, 'delivery');
              }}
            />
            <button
              className={`btn ${isSelectingPoint === 'delivery' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setIsSelectingPoint(isSelectingPoint === 'delivery' ? null : 'delivery')}
            >
              <FaMapMarkerAlt />
            </button>
          </div>
          {isLoading && <div className="spinner-border spinner-border-sm text-primary position-absolute top-50 end-0 me-3" role="status" />}
          {searchResults.length > 0 && (
            <div className="position-absolute w-100 mt-1 shadow-sm bg-white rounded border z-3">
              {searchResults.map((result, index) => (
                <button key={index} className="btn btn-light w-100 text-start border-0 py-2" onClick={() => handleLocationSelect(result, 'delivery')}>
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: '400px', width: '100%' }}>
        <MapContainer
          center={[21.0285, 105.8542]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenCreated={setMap}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <MapClickHandler onMapClick={handleMapClick} isSelectingPoint={isSelectingPoint} />

          {selectedLocations.pickup && (
            <Marker position={[selectedLocations.pickup.position.lat, selectedLocations.pickup.position.lng]} icon={pickupIcon}>
              <Popup>
                <strong>Điểm lấy hàng:</strong>
                <br />
                {selectedLocations.pickup.address}
              </Popup>
            </Marker>
          )}

          {selectedLocations.delivery && (
            <Marker position={[selectedLocations.delivery.position.lat, selectedLocations.delivery.position.lng]} icon={deliveryIcon}>
              <Popup>
                <strong>Điểm giao hàng:</strong>
                <br />
                {selectedLocations.delivery.address}
              </Popup>
            </Marker>
          )}

          {selectedLocations.pickup && selectedLocations.delivery && (
            <RoutingMachine
              pickupCoords={[selectedLocations.pickup.position.lat, selectedLocations.pickup.position.lng]}
              deliveryCoords={[selectedLocations.delivery.position.lat, selectedLocations.delivery.position.lng]}
              onRouteFound={(distance, time) => {
                onLocationUpdate('route', null, { distance, time });
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default DeliveryMap;
