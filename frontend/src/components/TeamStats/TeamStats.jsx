import { useContext, useEffect, useState } from 'react';
import './TeamStats.css';
import axios from 'axios';
import SelectedMatchContext from '../../context/SelectedMatchContext';

const TeamStats = () => {

  const [matchStats, setMatchStats] = useState('');
  const {matchId} = useContext(SelectedMatchContext);


  useEffect(() => { 
    // getTeamStatistics();
 }, []);


 //fn for getting match Statistics using matchId
 const getTeamStatistics = async () => {
  try {
      // eslint-disable-next-line no-unused-vars
      const response = await axios.get(`http://localhost:4000/match/${matchId}/statistics`)
                            .then((data) => {
                              console.log('Statistics data from axios req : ', data.data.jsonResponse.DATA);
                              setMatchStats(data.data.jsonResponse.DATA);
                            })
  } catch (error) {
    console.log(error.message);
  }
} 

// console.log("matchStats in TeamStats.jsx : ", matchStats);
 
  return (
    <div className='parent-div'>
      <h2 className='parent-header'>MATCH STATS </h2>
      {
        !matchStats && 
        <div className="stats-top-heading">
          <button className="get-stats" onClick={getTeamStatistics}>
            GET stats
          </button>
        </div>
      }
        <div className="main-container">
          <table className='match-stats'>
                                <thead>
                                    <tr>
                                        <th>HOME</th>
                                        <th>Event</th>
                                        <th>AWAY</th>
                                    </tr>
                                </thead>
                                { matchStats.STATISTICS && 
                                  <tbody>
                                        <tr>
                                          <td>{matchStats.STATISTICS[0].FOULS}</td>
                                          <td>FOULS</td>
                                          <td>{matchStats.STATISTICS[1].FOULS}</td>
                                        </tr>
                                        <tr>
                                        <td>{matchStats.STATISTICS[0].OFFSIDES}</td>
                                        <td>OFFSIDES</td>
                                        <td>{matchStats.STATISTICS[1].OFFSIDES}</td>
                                      </tr>
                                      <tr>
                                        <td>{matchStats.STATISTICS[0].POSSESSION}%</td>
                                        <td>POSSESSION</td>
                                        <td>{matchStats.STATISTICS[1].POSSESSION} %</td>
                                      </tr>
                                      <tr>
                                        <td>{matchStats.STATISTICS[0].CORNER_KICKS}</td>
                                        <td>CORNERS</td>
                                        <td>{matchStats.STATISTICS[1].CORNER_KICKS}</td>
                                      </tr>
                                      <tr className='yellow-card'>
                                        <td>{matchStats.STATISTICS[0].YELLOW_CARDS}</td>
                                        <td>YELLOW CARDS</td>
                                        <td>{matchStats.STATISTICS[1].YELLOW_CARDS}</td>
                                      </tr>
                                      <tr className='red-card'>
                                        <td>{matchStats.STATISTICS[0].RED_CARDS}</td>
                                        <td>RED CARDS</td>
                                        <td>{matchStats.STATISTICS[1].RED_CARDS}</td>
                                      </tr>
                                      <tr>
                                        <td>{matchStats.STATISTICS[0].SHOTS_ON_TARGET}</td>
                                        <td>SHOT ON TARGET</td>
                                        <td>{matchStats.STATISTICS[1].SHOTS_ON_TARGET}</td>
                                      </tr>
                                      <tr>
                                        <td>{matchStats.STATISTICS[0].GOALKEEPER_SAVES}</td>
                                        <td>SAVES</td>
                                        <td>{matchStats.STATISTICS[1].GOALKEEPER_SAVES}</td>
                                      </tr>
                                      <tr>
                                        <td>{matchStats.STATISTICS[0].BLOCKED_SHOTS}</td>
                                        <td>BLOCKED SHOTS</td>
                                        <td>{matchStats.STATISTICS[1].BLOCKED_SHOTS}</td>
                                      </tr>
                                      <tr>
                                        <td>{matchStats.STATISTICS[0].COUNTER_ATTACKS}</td>
                                        <td>COUNTER_ATTACKS </td>
                                        <td>{matchStats.STATISTICS[1].COUNTER_ATTACKS}</td>
                                      </tr>
                                      <tr>
                                        <td>{matchStats.STATISTICS[0].CROSSES}</td>
                                        <td>CROSSES </td>
                                        <td>{matchStats.STATISTICS[1].CROSSES}</td>
                                      </tr>
                                </tbody>
                                  }
                            
          </table>
        </div>
    </div>
  )
}

export default TeamStats