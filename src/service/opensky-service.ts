import {IMapGeoBounds, IStateVector, IStateVectorData, IStateVectorRawData} from './../model/opensky-model'

// const baseURL = 'https://opensky-network.org/api';
const baseURL = 'https://opensky-network.org/api';
const username = 'olyamaii';
const password = 'rR9MtnCXWbJHkE@';

export const getStateVectors = async (mapGeoBounds: IMapGeoBounds) => {
  const stateBounds = `?lamin=${mapGeoBounds.southernLatitude}&lomin=${mapGeoBounds.westernLongitude}&lamax=${mapGeoBounds.northernLatitude}&lomax=${mapGeoBounds.easternLongitude}`;
  const targetUrl = `${baseURL}/states/all${stateBounds}`;
  const response = await fetch(targetUrl, {
    headers: {
      'Authorization': 'Basic ' + window.btoa(`${username}:${password}`)
    }
  });
  if (response.ok) {
    const data = await response.json();
    const rawData: IStateVectorRawData = data;
    const stateVectors = mapRawData(rawData);
    console.log(stateVectors?.states.length);
    if (!stateVectors) {
      return;
    }
    if (!stateVectors.states) {
      return;
    }
    return stateVectors;
  } else {
    return;
  }
}

export const getFlightDetails = async (icao24: string) => {
  const targetUrl = `${baseURL}/states/all?icao24=${icao24}`;
  const response = await fetch(targetUrl, {
    headers: {
      'Authorization': 'Basic ' + window.btoa(`${username}:${password}`)
    }
  });
  if (response.ok) {
    const data = await response.json();
    const rawData: IStateVectorRawData = data;
    const stateVector = mapRawData(rawData);
    if (!stateVector?.states) {
      return;
    }
    const vector: IStateVector = stateVector.states[0];

    return vector;
  } else {
    return;
  }
}

export const mapRawData = (rawData: IStateVectorRawData) => {
  const stateVectorData: IStateVectorData = {
    time: rawData.time,
    states: []
  }
  if (!rawData.states) {
    return;
  }
  for(let rawStateVector of rawData.states) {
    const stateVector: IStateVector = {
      icao24: rawStateVector[0],
      callsign: rawStateVector[1],
      origin_country: rawStateVector[2],
      time_position: rawStateVector[3],
      last_contact: rawStateVector[4],
      longitude: rawStateVector[5],
      latitude: rawStateVector[6],
      baro_altitude: rawStateVector[7],
      on_ground: rawStateVector[8],
      velocity: rawStateVector[9],
      true_track: rawStateVector[10],
      vertical_rate: rawStateVector[11],
      sensors: rawStateVector[12],
      geo_altitude: rawStateVector[13],
      squawk: rawStateVector[14],
      spi: rawStateVector[15],
      position_source: rawStateVector[16],
      category: 0
    }
    stateVectorData.states.push(stateVector);
  }
  return stateVectorData;
}