import { useContext, useEffect, useState } from 'react';
// import { options4, url4 } from '../../api';
import './UserComments.css';
import axios from 'axios';
import SelectedMatchContext from '../../context/SelectedMatchContext';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../helper';

 

const UserComments = () => {

    // let i = Math.floor(Math.random()*10 ); //random no of news
    const [commentsList, setCommentsList] = useState([]);
    const {matchId } = useContext(SelectedMatchContext) || 702080;
    const {user } = useContext(SelectedMatchContext);
    const [userComment, setUserComment] = useState('');

    // console.log("user form context : ", user);
    let username;

    //call comments API
    useEffect(() => {
        getUserComments();
        console.log("user value: ", user)
    },[userComment]);
  
    //fn for posting comments
    const postCommentHandler  = async (e) => {
      e.preventDefault();
      console.log("inside postComment handler");
      if(!user) {
        toast.error('Login to post comments !');
      } else {
        console.log("author value inside post fn :", user.username);
        username = user.username;
        try {
          await axios.post(`${BASE_URL}/user/addcomment`, { matchId, username, userComment })
          .then((data) => {
            toast.success('comment posted successfully !');
            console.log('data from axios response : ', data);
            getUserComments();
          });
        } catch (error) {
          console.log(error.message);
        }
      }
     
    }

    // fn for getting user comments of selected match 
    const getUserComments = async () => {
      console.log("inside getUserComments() ");

      try {
        const response = await axios.post('http://localhost:4000/match/getcom', {matchId} )
          .then((data) => {
            console.log("comment data from axios response : ", data.data.usersComments);
            if(data){
              //reverse order of array for newest comment first
              let commentsArray = data.data.usersComments;
              const reversedData = commentsArray.slice().reverse(); // Create a copy of the array and reverse it
              setCommentsList(reversedData);
              console.log("commentsList after call in reverse order : ", commentsList);
            }
          });
      } catch (error) {
        console.log(error.message);
      }
    }

  return (
    <> 
    {
        <div className="comments-container">
              <form action='/addcomment' method='post' onSubmit={postCommentHandler}className="add-comments-container">
                  <label className="add-cmt" htmlFor="userComment">Add a Comment</label>
                  <textarea className='txtarea' type= 'text' name="userComment"  cols="30" rows="10" placeholder='add a comment . . . ' onChange={(e) => setUserComment(e.target.value)}></textarea>
                  <button className="post-comment" type='submit'  >
                  POST Comment 
                  </button>
              </form>
              <h2 className='comment-heading'>COMMENTS</h2>


            {
                    // commentsList && commentsList.slice(0, i).map((comment, index) => (
                    commentsList && commentsList.map((comment, index) => (
                        <>
                          <div className="user-comment" key={index} >
                            <div className="user-details" >
                                <h6>{comment.username}</h6> <span>Today at 2:56 PM</span>
                            </div>
                            <p  className='comment-text'>{comment.userComment}</p>
          
                          </div> 
                        </>
                    ))
                    
            }
        </div>

    }
        
    </>
  )
}

export default UserComments