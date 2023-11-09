import { useContext, useEffect, useState } from 'react';
import './Commentary.css';
import SelectedMatchContext from '../../context/SelectedMatchContext';
// import {scrollToBottom} from './script.js';
import axios from 'axios';

const Commentary = () => { 

  const [commentsList, setCommentsList] = useState([]);
  const {matchId } = useContext(SelectedMatchContext);
  // const myListRef = useRef(); //for scrolling to bootom of commentary list
  
  // Get match comments when component mounts
  useEffect(() => {
    
    console.log("matchId in comments xxx : ", matchId);
    
    // getCommentaryList();

  }), [];

  //fn for getting commentary list 
  const getCommentaryList = async () => {
    console.log("inside fn getCommentaryList()");
        try {
            // eslint-disable-next-line no-unused-vars
            const response = await axios.get(`http://localhost:4000/match/${matchId}/comments`)
                .then((data) => {
                  console.log("comments data from axios req : ", data.data.DATA.COMMENTS);
                  setCommentsList(data.data.DATA.COMMENTS);
                  // console.log("comments in commentary : " ,data);  
                })
                // const jsonResponse = await response.json(); 
          } catch( error) {
          console.log(error.message);
        }
  }


  return (
    
        <div className='commentary-container'>
          {/* <h1> Live Commentary</h1> */}
          <button className='commentary-btn' onClick={getCommentaryList}>GET COMMENTARY</button>
          <div className="commentary-box">
            <ul id="sentences-list" >
              {/* map commentary */}
                {
                  commentsList && 
                    commentsList.map((comment, index) => (
                      <li key={index}>{comment.COMMENT } </li>
                    ))
                    
                }
            </ul>
          </div>
        </div>
    );
};

export default Commentary;