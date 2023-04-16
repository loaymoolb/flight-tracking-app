import mapboxgl, { Expression, StyleFunction, SymbolLayout, SymbolPaint } from "mapbox-gl";
import { IMapGeoBounds, IStateVectorData } from "../model/opensky-model";
import { Feature, FeatureCollection, GeoJsonProperties, Geometry, Point, Position } from "geojson";

export const svgToImage = (path: string, width: number, height: number) => {
  return new Promise(resolve => {
    const image = new Image(width, height);
    image.addEventListener('load', () => resolve(image));
    image.src = path;
  })
}

export const getMapGeoBounds = (bounds: mapboxgl.LngLatBounds) => {
  let mapGeoBounds: IMapGeoBounds = {
    northernLatitude: 0.0,
    easternLongitude: 0.0,
    southernLatitude: 0.0,
    westernLongitude: 0.0,
  }
  mapGeoBounds.northernLatitude = bounds!.getNorthEast().lat;
  mapGeoBounds.easternLongitude = bounds!.getNorthEast().lng;
  mapGeoBounds.southernLatitude = bounds!.getSouthWest().lat;
  mapGeoBounds.westernLongitude = bounds!.getSouthWest().lng;

  return mapGeoBounds;
}

export const createFeatures = (stateVectors: IStateVectorData | undefined): String | FeatureCollection<Geometry, GeoJsonProperties> | Feature<Geometry, GeoJsonProperties> => {
  if (!stateVectors) {
    return '';
  }
  if (!stateVectors.states) {
    return '';
  }
  let featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: []
  };
  for (let stateVector of stateVectors.states) {
    if (!stateVector.latitude) {
      continue;
    }
    if (!stateVector.longitude) {
      continue;
    }
    const index = stateVectors.states.indexOf(stateVector);
    const callsign = stateVector.callsign ? stateVector.callsign : stateVector.icao24;
    let altitude = stateVector.geo_altitude;
    if ((altitude === null) || (altitude < 0)) {
      altitude = stateVector.baro_altitude;
    }
    if ((altitude === null) || (altitude < 0)) {
      altitude = 0;
    }
    const velocity = stateVector.velocity ? (stateVector.velocity * 3.6) : -1;
    const trueTrack = stateVector.true_track ? stateVector.true_track : 0.0;
    const verticalRate = stateVector.vertical_rate ? stateVector.vertical_rate : 0.0;
    const isOnGround = stateVector.on_ground;
    let color = getColor(altitude);
    if (isOnGround) {
      color = '#e3f2fd';
    }
    let properties: GeoJsonProperties = {
      'iconName': getIconName(verticalRate, altitude, trueTrack),
      'rotation': getRotation(verticalRate, altitude, trueTrack),
      "color": color,
      'icao24': stateVector.icao24,
      'callsign': callsign,
      'altitude': altitude + ' m',
      'velocity': velocity + ' km/h',
      'origin': stateVector.origin_country
    }
    let position: Position = [
      stateVector.longitude, 
      stateVector.latitude, 
    ];
    let point: Point = {
      type: 'Point',
      coordinates: position
    }  
    let feature: Feature<Point, GeoJsonProperties> = {
      type: 'Feature',
      id: `${index}.${stateVector.icao24}`,
      geometry: point,
      properties: properties
    }
    featureCollection.features.push(feature);
  }
  return featureCollection;
}

export const getSymbolLayout = (zoom: number) => {
  let showText = false;
  if (zoom > 7) {
    showText = true;
  }

  let iconSize = 1.0;
  if (zoom > 6) {
    iconSize = 1.2;
  } else if (zoom > 8) {
    iconSize = 1.5;
  }

  const symbolLayout: SymbolLayout = {
    'icon-image': ['get', 'iconName'],
    'icon-allow-overlap': true,
    'icon-rotate': ['get', 'rotation'],
    'icon-size': iconSize,
    'text-field': showText ? getText() : '',
    'text-optional': true,
    'text-allow-overlap': true,
    'text-anchor': showText ? 'top' : 'center',
    'text-offset': showText ? [0, 1] : [0, 0]
  }

  return symbolLayout;
}

export const getText = () => {
  let text: string | Expression | StyleFunction = [
    'format',
    ['get', 'callsign'], {'font-scale': 1.0},
    '\n', {},
    ['get', 'altitude'], {'font-scale': 0.75, 'text-color': '#fff'},
    '\n', {},
    ['get', 'velocity'], {'font-scale': 0.75, 'text-color': '#fff'},
  ] as StyleFunction;

  return text;
}

export const getSymbolPaint = () => {
  let symbolPaint: SymbolPaint = {
    'icon-color': ['get', 'color'],
    'text-color': ['get', 'color'],
    'text-halo-width': 2,
    'text-halo-color': '#000',
    'text-halo-blur': 2,
  };

  return symbolPaint;
}

export const getColor = (altitude: number) => {
  let percent = altitude / 13000 * 100;
  percent = (percent > 100) ? 100 : percent;
  percent = (percent < 0) ? 0 : percent;
  
  let r, g, b = 0;
  if(percent < 50) {
    r = 255;
    g = Math.round(5.1 * percent);
  } else {
    r = Math.round(510 - 5.10 * percent);
    g = 255;
  }

  let h = r * 0x10000 + g * 0x100 + b * 0x1;
  
  return '#' + ('000000' + h.toString(16)).slice(-6);
}

export const getIconName = (verticalRate: number, altitude: number, trueTrack: number) => {
  let iconName: string = 'flight-icon';
  if (verticalRate > 0 && altitude < 1000) {
    if (trueTrack < 100) {
      iconName = 'flight-takeoff-icon';
    } else {
      iconName = 'flight-takeoff-flipped-icon';
    }
  } else if (verticalRate < 0 && altitude < 1000) {
    if (trueTrack < 100) {
      iconName = 'flight-land-icon';
    } else {
      iconName = 'flight-land-flipped-icon';
    }
  }
  
  return iconName;
}

export const getRotation = (verticalRate: number, altitude: number, trueTrack: number) => {
  let rotation: number = 0.0;
  if (verticalRate > 0 && altitude > 1000) {
    return rotation;
  } else if (verticalRate < 0 && altitude < 1000) {
    return rotation;
  } else {
    return trueTrack;
  }
}
