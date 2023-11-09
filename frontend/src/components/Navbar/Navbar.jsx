import { Link } from 'react-router-dom';
import './Navbar.css';
import { useContext, useState } from 'react';
import SelectedMatchContext from '../../context/SelectedMatchContext';
import Cookies from 'js-cookie';
// import { Link } from 'react-router-dom'; 

const Navbar = () => {

  const { user } = useContext(SelectedMatchContext);
  console.log("user in context :", user);
  //get token from cookie-storage
  const token = Cookies.get('token');
  const username = localStorage.getItem('username');
  const [navOn, setNavOn] = useState(false);

  const showNavbar = () => {
    console.log('navbar-show-hide');
    setNavOn(!navOn);
    if(navOn){
      document.getElementById('nav-links').classList.add('show-navbar');
    } else if(!navOn) {
      document.getElementById('nav-links').classList.remove('show-navbar');

    }
  }

  return (
    <> 
        <div className="navbar">
            <div className="brand">
              <Link to='/' >
                <img className='brand-image' src="logo/logo-no-background.png" alt="Navbar-LOGO" />
              </Link> 
            </div>
            <div className="nav-links" id='nav-links' onClick={showNavbar}>
                <ul className='nav-li'>
                  <Link  to='/' className='hover-3'> Home</Link>
                </ul>
                <ul className='nav-li'>
                  <Link  to='/match/matchId' className='hover-3'> Matches</Link>
                </ul>
                <ul className='nav-li'>
                  <Link  to='/news' className='hover-3'>News</Link>
                </ul>
                <ul className='nav-li'>
                  <Link to='/about' className='hover-3'>About</Link>
                </ul>
                <ul className='nav-li'>
                  { 
                    token && username ? <Link to='/profile' className='hover-3'>{username}</Link>
                    : <Link to='/login' className='hover-3'>Login</Link>
                    }
                </ul>    
                {/* <ul className='nav-li'>
                </ul> */}
            </div>
            <div className="nav-button">
              <div className='navbar-toggle' onClick={showNavbar}>
                <div className="lines">
                  <h2>--</h2>
                  <h2>--</h2>
                  <h2>--</h2>
                </div>
              </div>
            </div>
        </div>
    
    
    </>
  )
}

export default Navbar