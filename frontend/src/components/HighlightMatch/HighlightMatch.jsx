import { useContext, useEffect, useState } from 'react';
import './HighLightMatch.css';
import SelectedMatchContext from '../../context/SelectedMatchContext';
import axios from 'axios';
import Loader from '../Spinner/Loader';
import { toast } from 'react-toastify';


const HighlightMatch = () => {

  const [mostGoals, setMostGoals] = useState(0);
  // eslint-disable-next-line no-unused-vars
  // const [matchDetails, setMatchDetails ]  = useState([]);
  const [featuredMatch, setFeaturedMatch ] = useState('');
  // eslint-disable-next-line no-unused-vars
  const { eventList, setEventList, setMatchDetails, matchDetails } = useContext(SelectedMatchContext);

   
  useEffect(() => {

    if(!featuredMatch) {
        // getEventList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(()=>{
        
      //find match with most no of goals
      eventList.map((match) => {
        const totalGoals = parseInt(match.EVENTS[0].AWAY_SCORE) + parseInt(match.EVENTS[0].HOME_SCORE)
        if(totalGoals > mostGoals) {
                  setMostGoals(totalGoals);
                  setFeaturedMatch(match);
        }
      })      
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [matchDetails, mostGoals]);

  // get live events list 
  const getEventList = () => {
    document.getElementById('loader').style.display = 'block';

    console.log('inside api call useffect');
    //post req to backend to start api call
    axios.get('http://localhost:4000/')
    .then((data) => {
        console.log("response from backend api call : ", data);
        //returned data set to matchDetails and eventList in context
        if(data.data.jsonResponse.DATA.length == 0){
          console.log('no live matches to show !');
          toast.warning('no live matches to show!');
        }
        setMatchDetails(data.data.jsonResponse.DATA);
        setEventList(data.data.jsonResponse.DATA);
        document.getElementById('loader').style.display = 'none';

      });
  }


  return (
    <>  
            <Loader />
          { featuredMatch ? 
          <div className='highlight-heading'>
            <h2>Featured Match  </h2>
            {
            featuredMatch && 
            <div className="highlight-container">
            <p>{featuredMatch.EVENTS[0].MATCH_STATUS} <span className='live-red'>LIVE</span> </p>
            <div className='highlight-header'>
                  <img className='team-logo-h' src={`${featuredMatch.EVENTS[0].HOME_TEAM[0].BADGE_SOURCE}`}></img>
                  <div className='highlight-name'>
                    <h2>{`${featuredMatch.EVENTS[0].HOME_TEAM[0].NAME}`} </h2>
                    <h2>VS</h2> 
                    <h2>
                    {`${featuredMatch.EVENTS[0].AWAY_TEAM[0].NAME}`}
                    </h2></div>
                  <img className='team-logo-a' src={`${featuredMatch.EVENTS[0].AWAY_TEAM[0].BADGE_SOURCE}`}></img>
            </div>
            <div className="highlight-score">
                  <h1>{`${featuredMatch.EVENTS[0].HOME_SCORE} : ${featuredMatch.EVENTS[0].AWAY_SCORE}` }</h1>
                  
              </div>
            </div>
          } 
          </div>
          : <div className='btn-div'>
               <button className='get-matches-btn' onClick={getEventList}>GET matches</button>
          </div> 
          } 
        
    </>
  )
}
 
export default HighlightMatch