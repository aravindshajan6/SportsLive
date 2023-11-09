import SelectedMatch from '../components/SelectedMatch/SelectedMatch';
import TeamStats from '../components/TeamStats/TeamStats';
import UserComments from '../components/UserComments/UserComments';

const MatchDetailsScreen = () => {
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100vw' }}>
        {/* <h1>Match details</h1> */}
        <SelectedMatch />

        {/* //match stats table */}
        <TeamStats  />

        {/* //user comments section */}
        <UserComments />
        
    </div>
    
  )
}

export default MatchDetailsScreen