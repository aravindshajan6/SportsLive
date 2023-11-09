/* eslint-disable no-unused-vars */
import { useContext, useEffect, useState } from 'react';
import './ScoreCard.css';
import axios from 'axios';
import {  useNavigate } from 'react-router-dom';
import SelectedMatchContext from '../../context/SelectedMatchContext';
import Loader from '../Spinner/Loader';

 
const ScoreCard = () => {

    const navigate = useNavigate();
    const { matchDetails } = useContext(SelectedMatchContext);
    const {setMatchId, setEventList} = useContext(SelectedMatchContext);
    console.log('matchDetails from context : ', matchDetails)
    // const [matchDetails, setMatchDetails ]  = useState([]);

    // Function to show the loader
    function showLoader() {
        document.getElementById('loader').style.display = 'block';
    }

    // Function to hide the loader and show the content when data is loaded
    function hideLoader() {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    }

    //for getting the selected match details
    const callMatchDetails = async (event) => {
            console.log('event ID :  ', event.currentTarget.id);
            let matchId = event.currentTarget.id;
            setMatchId(matchId);
            navigate(`/match/${matchId}`); 
        }

  return (
    <>
        <div className="match-card-container">
            <h1 className='card-heading'>Live Matches </h1><br/>
            
            { !matchDetails ? <Loader className='loader' /> :
                matchDetails.map((match, index) => (
                    <div className="match-cards "  key={index} id={match.EVENTS[0].MATCH_ID}  onClick={(e) => callMatchDetails(e)}
                    >
                        <div className="team">
                            <img className='team-logo' src={`${match.EVENTS[0].HOME_TEAM[0].BADGE_SOURCE}`}></img>
                            <h2>{match.EVENTS[0].HOME_TEAM[0].NAME}</h2>
                        </div>
                        <div className='match-score'>
                            <p>LIVE</p>
                            <h3>{match.EVENTS[0].HOME_SCORE ? `${match.EVENTS[0].HOME_SCORE} : ${match.EVENTS[0].AWAY_SCORE}` : 'Match Starting' }</h3>
                            <p>{match.EVENTS[0].MATCH_STATUS}</p>
                        </div>
                        <div className="team">
                            <img className='team-logo' src={`${match.EVENTS[0].AWAY_TEAM[0].BADGE_SOURCE}`}></img>
                            <h2>{match.EVENTS[0].AWAY_TEAM[0].NAME}</h2>
                        </div>
                    </div>
                ))
            }


            
        </div>
    </>
  )
}

export default ScoreCard