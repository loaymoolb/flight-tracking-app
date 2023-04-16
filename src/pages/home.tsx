import React from 'react'
import mapboxgl from 'mapbox-gl';
import MapView from './map-view';

const Home = () => {
  return (
    <div className='root'>
      <MapView
        center={new mapboxgl.LngLat(4.0778828, 49.724997)}
        zoom={4}
      >

      </MapView>
    </div>
  )
}

export default Home;