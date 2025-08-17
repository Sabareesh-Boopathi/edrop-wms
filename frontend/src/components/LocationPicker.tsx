import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';
import { Button } from './ui/button';
import { X, MapPin, LocateFixed } from 'lucide-react';
import * as notify from '../lib/notify';

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface LocationPickerProps {
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number) => void;
  initialPosition: [number, number];
}

const SearchAndLocate = ({ onSelect }: { onSelect: (lat: number, lng: number) => void }) => {
    const map = useMap();
  
    useEffect(() => {
      const provider = new OpenStreetMapProvider();
      const searchControl = new (GeoSearchControl as any)({
        provider: provider,
        style: 'bar',
        showMarker: false, // We use our own marker
        showPopup: false,
        autoClose: true,
        retainZoomLevel: false,
        animateZoom: true,
        keepResult: true,
      });
  
      map.addControl(searchControl);
  
      const onResult = (e: any) => {
          const { y: lat, x: lng } = e.location;
          onSelect(lat, lng);
          map.setView([lat, lng], 13);
      };
  
      map.on('geosearch/showlocation', onResult);
  
      return () => {
          map.removeControl(searchControl);
          map.off('geosearch/showlocation', onResult);
      };
    }, [map, onSelect]);

    const handleLocateMe = () => {
        map.locate().on('locationfound', function (e) {
            onSelect(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, 13);
            notify.success("Location found!");
        }).on('locationerror', function(e){
            console.log(e);
            notify.error("Could not find your location.");
        });
    };
  
    return (
        <button type="button" onClick={handleLocateMe} className="locate-me-btn" title="Locate Me">
            <LocateFixed size={18} />
        </button>
    );
};

const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onClose, onLocationSelect, initialPosition }) => {
  const [position, setPosition] = useState<[number, number]>(initialPosition);

  useEffect(() => {
    // Only try to get user's location if it's the default initial position
    if (initialPosition[0] === 51.505 && initialPosition[1] === -0.09) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    notify.info("Your current location has been set as the starting point.");
                },
                () => {
                    notify.warn("Could not get your location. Using default.");
                }
            );
        }
    }
  }, [initialPosition]);

  const handleLocationSelect = () => {
    onLocationSelect(position[0], position[1]);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
  }

  return (
    <div className="modal-overlay">
      <div className="location-picker-content">
        <div className="modal-header">
          <h3 className="modal-title">Select Warehouse Location</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="close-btn">
            <X size={24} />
          </Button>
        </div>
        <div className="map-container">
            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} key={position.toString()}>
                <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={position} />
                <SearchAndLocate onSelect={(lat, lng) => setPosition([lat, lng])} />
                <MapEvents onMapClick={handleMapClick} />
            </MapContainer>
        </div>
        <div className="modal-footer">
            <div className="selected-coords">
                Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
            </div>
            <Button onClick={handleLocationSelect} className="btn-primary-token">
                <MapPin className="icon" />
                Confirm Location
            </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
