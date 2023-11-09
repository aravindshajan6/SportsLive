import  { useContext, useEffect, useState } from 'react';
import '../styles/ProfileScreen.css';
import SelectedMatchContext from '../context/SelectedMatchContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const ProfileScreen = () => {

    const { user, setUser } = useContext(SelectedMatchContext);
    let [username, setUsername] = useState();
    const [email, setEmail] = useState();
    const [_id, set_id] = useState();
    const [password, setPassword] = useState();
    const [cPassword, setCPassword] = useState();
    const [updatedUser, setUpdatedUser] = useState({
        username: '', 
        email: '', 
        password: '',
        _id: ''
    });
    // const [_id, set_id] = useState();
    const navigate = useNavigate();
    const token = Cookies.get('token');
    
    useEffect(() => {
        if(user) {
            username = user.username;
            console.log('user in context: ', user);
        } else if(localStorage.getItem('user')) {
            console.log("user in local storage: ", localStorage.getItem('user'));
        }
        if(token) {
            console.log("inside token if LOOP");
            if(token) {
                console.log("token found in cookies");
                axios.post('http://localhost:4000/user/profile', {token, username})
                    .then((data) => {
                        console.log("data from axios req in profile :", data);
                        setUser({...user, ...data.data});
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            } else {
                toast.error('please login');
                console.log('please login  ... .')
            }
            // set_id(user._id);
        } else {
           console.log("redirect login")
           navigate('/login');
       }
    }, [])

    useEffect(() => {
        console.log("re-render")
    }, [user])


    //fn for updating user details in DB
    const updateUser = async (e) => {

        e.preventDefault();
        console.log(password, cPassword);
        console.log('usernameaaaaaaaaa: ', username);
        console.log('emailllllllllllll: ', email);
        console.log('passwordddddddddd: ', password);
        console.log('idddddddddddddddd: ', user._id);
        
        setUpdatedUser({
            username: username || user.username,
            email: email || user.email,
            password: password ||user.password,
            _id: user._id
        }) 
        // console.log('Updated user : ', updatedUser);
        setUser(updatedUser);
        console.log("updated user: ", user)

        const _id = user._id;
        if(password || email || username) {
            if(password) {
                if(password !== cPassword ) {
                    toast.error('passwords donot match !');
                } else {
                    await axios.post('http://localhost:4000/user/update', {username, email, password, _id})
                    .then((data) => {console.log("data after user updation :", data);
                    // toast.success('user details updated.');
                    toast.success('user details updated !');
                    setUser()

                    })
                    .catch((error) => {
                        console.log(error.message);
                    })
                }
            } else {
                await axios.post('http://localhost:4000/user/update', {username, email, _id})
                .then((data) => {
                    console.log("data after user updation :", data);
                    toast.error('user details updated')
                })
                .catch((error) => {
                    console.log(error.message);
                })
            }
        }
        
        
    }

    //logout user
    const logoutUser = () => {
        console.log("inside logout user ");
        try {
            //set user to null in context
            setUser(null);
            //remove token from cookie-storage
            Cookies.remove('token');
            //remove username from localStorage
            localStorage.removeItem('username');
            navigate('/login');
            toast.success('logout success!');

        } catch (error) {
            console.log(error.message);
        }
    }

  return (
    user &&
    <div className='main-container-div' style={{width: '100vw !important'}}>
        <div className="body-div">
                <div className="heading-container">
                    <h2>{user.username}</h2>
                    <button className='logout' onClick={logoutUser}>LOGOUT</button>
                </div>
                <form action="/user/update" method="post" onSubmit={updateUser}>
                    <div className="profile-details">
                        <div className="details-list">
                            <label className='edit-label' htmlFor="username">Username  </label>
                            <input  className='edit-input' type="text" id="username" name='username' placeholder={user.username} onChange={(e) => setUsername(e.target.value)}/>
                        </div>
                        <div className="details-list">
                            <label htmlFor="email" className='edit-label' >Email  </label>
                            <input  className='edit-input' type="email" id="email" name='email' placeholder={user.email}  onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="details-list"  >
                            <label htmlFor="password" className='edit-label' >Password  </label>
                            <input  className='edit-input' type="password" id="password" name='password'  onChange={(e) => setPassword(e.target.value)}/>
                        </div>
                        <div className="details-list"  >
                            <label htmlFor="password" className='edit-label' >Confirm Password  </label>
                            <input  className='edit-input' type="password" id="cPassword" name='cPassword'  onChange={(e) => setCPassword(e.target.value)}/>
                        </div>
                    </div>
                    <button className="update-user">
                        UPDATE
                    </button>
                </form>
        </div>
    </div>
  )
}

export default ProfileScreen