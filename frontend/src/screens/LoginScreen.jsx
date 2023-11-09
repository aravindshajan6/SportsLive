/* eslint-disable no-unused-vars */
import { useContext, useState } from 'react';
import '../styles/LoginScreen.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import SelectedMatchContext from '../context/SelectedMatchContext';
import Cookies from 'js-cookie';


const LoginScreen = () => {

  const [username, setUsername ] = useState('');
  const [email, setEmail ] = useState('');
  const [password, setPassword ] = useState('');
  const [passwordR, setPasswordR ] = useState('');
  const navigate = useNavigate();
  const {user, setUser } = useContext(SelectedMatchContext); 

  //post signup details
  const signupHandler = async (e) => {
    e.preventDefault();
    if (password !== passwordR) {
      toast.error("Passwords do not match !",{
        bodyClassName: "custom-toast",
      });
      } else {
        try {
          await axios.post("http://localhost:4000/user/signup", {
            username, email, password
          })
          .then((data) => {
            console.log("data : ", data);
            toast.success('Sugnup Successfull !, proceed to Login');
            navigate('/login');
          })
        } catch (error) {
          console.log(error.message);
          toast.error(error.message);
        }
    }
  }

  //auth login details
  const loginHandler = async (e) => {
    e.preventDefault();
    // try {
      await axios.post("http://localhost:4000/user/login", {
        username, password
      })
      .then((data) => {
        console.log("data : ", data);
        if(data.data.userExist){
          toast.success('Login success !');
          //set username in localStorage
          localStorage.setItem('username', data.data.userExist.username);
          //set user details in context
          setUser(data.data.userExist);
          //set token in cookie storage
          Cookies.set('token', data.data.token, {expires: 1});
          navigate('/profile');
        } else if(data.data.userNotExist) {
          toast.warning('Username or Password is incorrect !');
        }
      })
      .catch((error) => { 
        console.log(error.message)
      })
    // } catch (error) {
    //   console.log(error.message);
    //   toast.error("User not found !")
    // }
  }

  return (
  <>
  <div className="main-container">
      <div className="main">  	
        <input type="checkbox" id="chk" aria-hidden="true" />

        {/* login */} 
        <div className="login">
        <form action='/login' method='post' onSubmit={loginHandler}>
            <label htmlFor="chk" aria-hidden="true">Login</label>
            <input type="txt" name="username" placeholder="Username" id='username' required value={username} onChange={(e) => setUsername(e.target.value)}/>
            <input type="password" name="passsword" placeholder="Password" id='password' required  value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type='submit'>Login</button>
          </form>
        </div>
        
        {/* signup */}
        <div className="signup">
        <form action='/signup' method='post' onSubmit={signupHandler}>
              <label htmlFor="chk" aria-hidden="true">Sign up</label>
              <input type="text" name="txt" placeholder="User name" id='username' required onChange={(e) => setUsername(e.target.value)}/>
              <input type="email" name="email" placeholder="Email" id='email' required onChange={(e) => setEmail(e.target.value)}/>
              <input type="password" value={password} name="password" placeholder="Password" id='password' required onChange={(e) => setPassword(e.target.value)}/>
              <input type="password" name="passwordR" placeholder="Repeat Password" id='passwordR' required onChange={(e) => setPasswordR(e.target.value)} />
              <button type='submit'>Sign up</button>
          </form>
          
			</div>
      </div>

  </div>
  </>
  )
}

export default LoginScreen;