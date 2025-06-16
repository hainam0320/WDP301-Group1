import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { FaMapMarkerAlt } from 'react-icons/fa';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;

// Custom icons for pickup and dropoff
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultCenter = [21.0285, 105.8542]; // Hanoi coordinates

// Map click handler component
const MapClickHandler = ({ onMapClick, isSelectingPoint }) => {
  const map = useMapEvents({
    click: async (e) => {
      if (!isSelectingPoint) return;
      
      const { lat, lng } = e.latlng;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        if (data.display_name) {
          onMapClick({
            lat,
            lon: lng,
            display_name: data.display_name
          }, isSelectingPoint);
        }
      } catch (error) {
        console.error('Error in reverse geocoding:', error);
      }
    }
  });
  return null;
};

// Routing machine component
const RoutingMachine = ({ pickupCoords, dropoffCoords, onRouteFound }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    try {
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(pickupCoords[0], pickupCoords[1]),
          L.latLng(dropoffCoords[0], dropoffCoords[1])
        ],
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
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const route = routes[0];
          const distance = route.summary.totalDistance / 1000;
          const time = Math.round(route.summary.totalTime / 60);
          onRouteFound(distance, time);
        }
      });

      routingControlRef.current.addTo(map);
    } catch (error) {
      console.error('Error creating route:', error);
    }

    return () => {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (error) {
          console.error('Error cleaning up route:', error);
        }
      }
    };
  }, [map, pickupCoords, dropoffCoords]);

  return null;
};

const RideMap = ({ onLocationUpdate, pickupLocation, dropoffLocation, isSelectingPoint, onSelectingPointChange }) => {
  const [map, setMap] = useState(null);
  const [searchResults, setSearchResults] = useState({
    pickup: [],
    dropoff: []
  });
  const [isLoading, setIsLoading] = useState({
    pickup: false,
    dropoff: false
  });
  const [selectedLocations, setSelectedLocations] = useState({
    pickup: null,
    dropoff: null
  });
  const searchTimeoutRef = useRef(null);

  const searchLocation = async (query, type) => {
    if (!query.trim()) {
      setSearchResults(prev => ({ ...prev, [type]: [] }));
      return;
    }

    setIsLoading(prev => ({ ...prev, [type]: true }));
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5`
      );
      const data = await response.json();
      setSearchResults(prev => ({ 
        ...prev, 
        [type]: data.map(item => ({
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon
        }))
      }));
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSearch = (query, type) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query, type);
    }, 500);
  };

  const handleLocationSelect = (location, type) => {
    const newMarker = {
      position: [parseFloat(location.lat), parseFloat(location.lon)],
      address: location.display_name
    };

    // Convert 'dropoff' to 'delivery' when updating state
    const stateType = type === 'dropoff' ? 'dropoff' : type;
    const updateType = type === 'dropoff' ? 'dropoff' : type;

    setSelectedLocations(prev => ({ ...prev, [stateType]: newMarker }));
    setSearchResults(prev => ({ ...prev, [stateType]: [] }));
    onLocationUpdate(updateType, location.display_name, [parseFloat(location.lat), parseFloat(location.lon)]);
  };

  const handleMapClick = (location, type) => {
    handleLocationSelect(location, type);
    onSelectingPointChange(null);
  };

  return (
    <div className="position-relative">
      <div className="mb-3">
        <div className="position-relative mb-2">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Điểm đón..."
              value={pickupLocation}
              onChange={(e) => {
                onLocationUpdate('pickup', e.target.value, null);
                handleSearch(e.target.value, 'pickup');
              }}
            />
            <button
              className={`btn ${isSelectingPoint === 'pickup' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => onSelectingPointChange(isSelectingPoint === 'pickup' ? null : 'pickup')}
              title="Click để chọn điểm trên bản đồ"
            >
              <FaMapMarkerAlt />
            </button>
          </div>
          {searchResults.pickup.length > 0 && (
            <div className="position-absolute w-100 mt-1 shadow-sm bg-white rounded border z-3">
              {searchResults.pickup.map((result, index) => (
                <button
                  key={index}
                  className="btn btn-light w-100 text-start border-0 py-2"
                  onClick={() => handleLocationSelect(result, 'pickup')}
                >
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
              placeholder="Điểm đến..."
              value={dropoffLocation}
              onChange={(e) => {
                onLocationUpdate('dropoff', e.target.value, null);
                handleSearch(e.target.value, 'dropoff');
              }}
            />
            <button
              className={`btn ${isSelectingPoint === 'dropoff' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => onSelectingPointChange(isSelectingPoint === 'dropoff' ? null : 'dropoff')}
              title="Click để chọn điểm trên bản đồ"
            >
              <FaMapMarkerAlt />
            </button>
          </div>
          {searchResults.dropoff?.length > 0 && (
            <div className="position-absolute w-100 mt-1 shadow-sm bg-white rounded border z-3">
              {searchResults.dropoff.map((result, index) => (
                <button
                  key={index}
                  className="btn btn-light w-100 text-start border-0 py-2"
                  onClick={() => handleLocationSelect(result, 'dropoff')}
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isSelectingPoint && (
        <div className="alert alert-info mb-3">
          Click vào bản đồ để chọn {isSelectingPoint === 'pickup' ? 'điểm đón' : 'điểm đến'}
        </div>
      )}

      <div style={{ height: '400px', width: '100%' }}>
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenCreated={setMap}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapClickHandler onMapClick={handleMapClick} isSelectingPoint={isSelectingPoint} />
          
          {selectedLocations.pickup && (
            <Marker 
              position={selectedLocations.pickup.position}
              icon={pickupIcon}
              eventHandlers={{
                click: () => {
                  onSelectingPointChange('pickup');
                  map.setView(selectedLocations.pickup.position, 15);
                }
              }}
            >
              <Popup>
                <strong>Điểm đón:</strong><br />
                {selectedLocations.pickup.address}
              </Popup>
            </Marker>
          )}
          
          {selectedLocations.dropoff && (
            <Marker 
              position={selectedLocations.dropoff.position}
              icon={dropoffIcon}
              eventHandlers={{
                click: () => {
                  onSelectingPointChange('dropoff');
                  map.setView(selectedLocations.dropoff.position, 15);
                }
              }}
            >
              <Popup>
                <strong>Điểm đến:</strong><br />
                {selectedLocations.dropoff.address}
              </Popup>
            </Marker>
          )}

          {selectedLocations.pickup && selectedLocations.dropoff && (
            <RoutingMachine
              pickupCoords={selectedLocations.pickup.position}
              dropoffCoords={selectedLocations.dropoff.position}
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

export default RideMap;