import { BrowserRouter, Route, Routes, useLocation  } from "react-router-dom";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from './screens/LoginScreen'
import MatchDetailsScreen from './screens/MatchDetailsScreen'
import './App.css';
import Footer from "./components/Footer/Footer";
import  Navbar  from "./components/Navbar/Navbar";
import AboutScreen from "./screens/AboutScreen";
import NewsScreen from "./screens/NewsScreen";
import SelectedMatchContextProvider from "./context/SelectedMatchContextProvider";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NewsDetails from "./components/NewsDetails/NewsDetails";
import ProfileScreen from "./screens/ProfileScreen";

import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

// import ScrollToTop from './components/ScrollToTop/ScrollToTop';


const Routing = () => {
  
  return (
    <>
        <ScrollToTop />
        <Routes>
          <Route path='/' element={<HomeScreen />} />
          <Route path='/news' element={<NewsScreen />} />
          <Route path='/login' element={<LoginScreen />} />
          <Route path='/profile' element={<ProfileScreen />} />
          <Route path='/match/:matchId' element={<MatchDetailsScreen  />} />
          <Route path='/about' element={<AboutScreen />} />
          <Route path='/news/details' element={<NewsDetails />} />
        </Routes>
    </>
      
  );
}


function App() {

  
  return (
    <>
    <BrowserRouter>
          <SelectedMatchContextProvider>
              <Navbar />
              <Routing />
          </SelectedMatchContextProvider>
              <Footer />
        <ToastContainer />
    </BrowserRouter>

    </>
  )
}



export default App
