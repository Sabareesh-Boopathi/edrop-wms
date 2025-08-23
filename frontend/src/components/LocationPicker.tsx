import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import './LocationPicker.css';
import L from 'leaflet';
import { Button } from './ui/button';
import { X, MapPin, LocateFixed } from 'lucide-react';
// notifications removed on request

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
  title?: string;
  /** When true, tries to fetch system geolocation on open and center marker there. Defaults to true. */
  autoLocate?: boolean;
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
    }).on('locationerror', function(e){
      // keep UX silent but satisfy linter by handling the error
      console.debug('Leaflet locate() error:', (e as any)?.message || e);
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

const AutoLocate: React.FC<{ onSelect: (lat: number, lng: number) => void; enabled: boolean }> = ({ onSelect, enabled }) => {
  const map = useMap();
  const doneRef = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    if (doneRef.current) return;
    doneRef.current = true;
    const handler = (e: any) => {
      onSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, 13);
    };
    map.locate({ setView: false, enableHighAccuracy: true, maxZoom: 13 })
      .on('locationfound', handler)
      .on('locationerror', (e: any) => {
        console.debug('Leaflet auto-locate error:', e?.message || e);
      });
    return () => {
      map.off('locationfound', handler);
    };
  }, [enabled, map, onSelect]);
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ onClose, onLocationSelect, initialPosition, title, autoLocate = true }) => {
  const [position, setPosition] = useState<[number, number]>(initialPosition);

  // Try to auto-locate on mount if enabled
  const navGeoOnce = useRef(false);
  useEffect(() => {
    if (!autoLocate) return;
    if (navGeoOnce.current) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          navGeoOnce.current = true;
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          navGeoOnce.current = true;
          console.debug('Navigator geolocation error:', (err as any)?.message || err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const handleLocationSelect = () => {
    onLocationSelect(position[0], position[1]);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
  }

  return (
    <div className="location-picker-overlay" onClick={(e)=>{ e.stopPropagation(); onClose(); }} onMouseDown={(e)=> e.stopPropagation()}>
      <div className="location-picker-content" onClick={(e)=> e.stopPropagation()} onMouseDown={(e)=> e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title || 'Select Location'}</h3>
          <Button variant="ghost" size="icon" onClick={(e)=>{ e.stopPropagation(); onClose(); }} className="close-btn">
            <X size={24} />
          </Button>
        </div>
        <div className="map-container">
            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={position} />
                <AutoLocate enabled={autoLocate} onSelect={(lat, lng) => setPosition([lat, lng])} />
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
