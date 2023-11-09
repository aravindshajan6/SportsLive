// import React from 'react';
// import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Hero/Hero';
import ScoreCard from '../components/ScoreCards/ScoreCard';
import HighLightMatch from '../components/HighlightMatch/HighlightMatch';
import '../styles/HomeScreen.css';

const HomeScreen = () => {
  return (
    <div className='homescreen-div' style = {{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', }}>
      <Hero />
      <HighLightMatch />
      <ScoreCard  />

    </div>
  )
} 

export default HomeScreen  