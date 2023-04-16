import React, { useEffect, useRef, useState } from 'react'
import mapboxgl, { FullscreenControl, GeolocateControl, NavigationControl } from 'mapbox-gl';
import './../map.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import flightIcon from '../source/flight.svg';
import flightLandIcon from '../source/flight_land.svg';
import flightLandFlippedIcon from '../source/flight_land_flipped.svg';
import flightTakeoffIcon from '../source/flight_takeoff.svg';
import flightTakeoffFlippedIcon from '../source/flight_takeoff_flipped.svg';
import { createFeatures, getMapGeoBounds, getSymbolLayout, getSymbolPaint, svgToImage } from '../helper/helper';
import { getStateVectors } from '../service/opensky-service';
import { TailSpin } from 'react-loader-spinner';
import FlightDetails from './flight-detail';

interface IMapboxViewProps {
  children: any;
  center: mapboxgl.LngLat;
  zoom: number
} 

type Props = IMapboxViewProps;

mapboxgl.accessToken = 'pk.eyJ1Ijoib2x5YW1haWkiLCJhIjoiY2xnNmx2aDBqMGJkODNsczE5Z3BuanV4NyJ9.tb7RlW2t8lGVZc-Lc_h-OQ';

const MapView = (props: Props) => {
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map>();
  const [showLoading, setShowLoading] = useState<boolean>(true);
  const [icao24, setIcao24] = useState<string>('');
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [flightColor, setFlightColor,] = useState<string>('');
  const [flightRotation, setFlightRotation] = useState<number>(0);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [totalLight, setTotalLight] = useState<number | undefined>(0);

  const mapContainer = useRef<HTMLDivElement | null>(null);

  const svgImages = [
    flightIcon,
    flightLandIcon,
    flightLandFlippedIcon,
    flightTakeoffIcon,
    flightTakeoffFlippedIcon
  ];

  const iconName = [
    'flight-icon',
    'flight-land-icon',
    'flight-land-flipped-icon',
    'flight-takeoff-icon',
    'flight-takeoff-flipped-icon'
  ]

  useEffect(() => {
    if(!mapInstance) {
      if(!mapContainer.current) {
        return;
      }
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        center: props.center,
        zoom: props.zoom,
        style: 'mapbox://styles/mapbox/dark-v11'
      });

      map.on('load', async () => {
        svgImages.map((image, index) => {
          return svgToImage(image, 18, 18).then((img: any) => {
            map.addImage(iconName[index], img, {sdf: true});
          })
        });

        // load state vector
        const bounds = getMapGeoBounds(map.getBounds());
        const stateVectors = await getStateVectors(bounds);
        setTotalLight(stateVectors?.states.length);
        if(!stateVectors) {
          return;
        }
        const features = createFeatures(stateVectors) as string;
        map.addSource('flight-source', {
          type: 'geojson',
          data: features
        });
        map.addLayer({
          id: 'flight-layer',
          type: 'symbol',
          source: 'flight-source',
          layout: getSymbolLayout(map.getZoom()),
          paint: getSymbolPaint(),
        })
        map.addControl(
          new NavigationControl({
             showCompass: true,
             showZoom: true,
          }),
          'bottom-right'
        );
        map.addControl(
          new FullscreenControl(),
          'top-right'
        );
        map.addControl(
          new GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true
          }),
          'bottom-right'
        );    
      });
      
      map.on('mouseenter', 'flight-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'flight-layer', (e) => {
        map.getCanvas().style.cursor = '';
      })
      // to fix
      map.on('click', 'flight-layer', (e) => {
        e.preventDefault();
        setShowDetail(false);
        const icao24 = e.features![0].properties?.icao24;
        const fromOrigin = e.features![0].properties?.origin;
        const color = e.features![0].properties?.color;
        const rotation = e.features![0].properties?.rotation;

        new mapboxgl.Popup({ closeButton: false }).setLngLat(e.lngLat).setHTML('<div><strong>' + icao24 + '</strong><br />' + fromOrigin + '</div>').addTo(map);

        setIcao24(icao24);
        setShowDetail(true);
        setFlightColor(color);
        setFlightRotation(rotation);

      });
      map.on('click', (e) => {
        if (e.defaultPrevented === false) {
          setShowDetail(false);
        }
      });

      setMapInstance(map);
      setShowLoading(false);
    }

    const updateMap = setInterval(() => {
      updateFlight();
    }, 12000);

    return () => {
      clearInterval(updateMap);
    } 
  }, [mapInstance]);

  const updateFlight = async () => {
    if (!mapInstance) {
      return;
    }
    setShowLoading(true);
    const bounds = getMapGeoBounds(mapInstance.getBounds());
    const stateVectors = await getStateVectors(bounds);
    setTotalLight(stateVectors?.states.length);

    if (!stateVectors) {
      return;
    }
    const features = createFeatures(stateVectors) as string;
    const source: mapboxgl.GeoJSONSource = mapInstance.getSource('flight-source') as mapboxgl.GeoJSONSource;
    if (!source) {
      return;
    }
    source.setData(features);
    if(mapInstance.getLayer('flight-layer')) {
      mapInstance.removeLayer('flight-layer');
      mapInstance.addLayer({
        id: 'flight-layer',
        type: 'symbol',
        source: 'flight-source',
        layout: getSymbolLayout(mapInstance.getZoom()),
        paint: getSymbolPaint(),
      });
    }
    setShowLoading(false);
  }

  return (
    <div className="root">
      <div className="map-root" ref={mapContainer}></div>
      {showLoading && 
        <div className="loading-box">
          <TailSpin 
            color="#008fff"
            width={18}
            height={18}
          />
        </div>
      }
      {showDetail &&
        <FlightDetails 
          icao24={icao24}
          color={flightColor}
          rotation={flightRotation}
        />
      }
      {showInfo ? 
        <div className="info-box">
          <div className="card-content">
            <div className="card-root" style={{width: '300px'}}>
              <div className="card-info">
                <div>
                  Total flights: {totalLight}
                </div>
                <div style={{cursor: 'pointer'}} onClick={() => {setShowInfo(false)}}>
                  <strong>X</strong>
                </div>
              </div>
            </div>
          </div>
        </div> : <div className="info-box">
        <div onClick={() => {setShowInfo(true)}} className="card-content" style={{cursor: 'pointer'}}>

          <svg width="16px" height="16px" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
<path d="M4 18L20 18" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
<path d="M4 12L20 12" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
<path d="M4 6L20 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
</svg>
        </div>
      </div>}
    </div>

  )
}

export default MapView