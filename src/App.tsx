import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Rings from 'react-loader-spinner';
import Home from './pages/home';

const App = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Router>
      {/* {isLoading ? (

        <Rings 
          color="#008fff"
          width={180}
          height={180}
        />
      ) : ( */}
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      {/* )}  */}
    </Router>
  );
}

export default App;
