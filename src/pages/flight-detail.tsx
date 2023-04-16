import { useEffect, useState } from 'react';
import './../map.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getFlightDetails } from '../service/opensky-service';
import { IStateVector } from '../model/opensky-model';
import moment from 'moment';
import { TailSpin } from 'react-loader-spinner';

interface ILocalProps {
  icao24: string;
  color: string;
  rotation: number;
}

type Props = ILocalProps;

const FlightDetails = (props: Props) => {
  const [stateVector, setStateVector] = useState<IStateVector>();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  
  useEffect(() => {
    const flightDetail = async () => {
      const detail = await getFlightDetails(props.icao24);
      if (!detail) {
        return;
      }
      setStateVector(detail);
      setIsLoaded(true);
    }

    flightDetail();
    
    const interval = setInterval(() => flightDetail(), 6000);
  
    return () => {
      clearInterval(interval);
    }
  }, []);

  

  return (
    <div className="flight-detail-box">
      <div className="card-content">
        {isLoaded ? 
        <div className="card-root">
          <div className="card-header flex-row">
            <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="30"
              viewBox="0 0 24 24"
              fill={props.color}
              style={{transform: `rotate(${props.rotation || 0}deg)`}}
            >
              <path
                d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              <path
                d="M0 0h24v24H0z"
                fill="none"/>
              </svg>
            </div>
            <div>{stateVector?.icao24}</div>
          </div>
          <div className="card-body flex-column">
            <div className="card-item">
              <div>Last Contact</div>
              <div>
              <>{moment.unix(stateVector ? stateVector.last_contact : 0).fromNow}</>
              </div>
            </div>
            <div className="card-item">
              <div>Origin Country</div>
              <div>{stateVector?.origin_country}</div>
            </div>
            <div className="card-item">
              <div>Velocity</div>
              <div>{stateVector?.velocity} m/s {(stateVector?.velocity! * 3.6).toFixed(2)} km/h</div>
            </div>
            <div className="card-item">
              <div>Geometric Altitude</div>
              <div>{parseFloat((stateVector?.geo_altitude! / 0.3048).toFixed(2))} ft ({stateVector?.geo_altitude} m)</div>
            </div>
            <div className="card-item">
              <div>Barometric Altitude</div>
              <div>{parseFloat((stateVector?.baro_altitude! / 0.3048).toFixed(2))} ft ({stateVector?.baro_altitude} m)</div>
            </div>
            <div className="card-item">
              <div>Vertical Rate</div>
              <div>{stateVector?.vertical_rate}</div>
            </div>
            <div className="card-item">
              <div>Squawk</div>
              <div>{stateVector?.squawk}</div>
            </div>
            <div className="card-item">
              <div>ICAO24</div>
              <div>{stateVector?.icao24}</div>
            </div>
            <div className="card-item">
              <div>Position Source</div>
              <div>{stateVector?.position_source}</div>
            </div>
          </div>
        </div>
      : 
      <TailSpin 
        color="#008fff"
        width={50}
        height={50}
      />      }
      </div> 
  </div>
  )
}

export default FlightDetails