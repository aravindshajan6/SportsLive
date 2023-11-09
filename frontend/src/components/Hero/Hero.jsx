import React from 'react';
import './Hero.css'

const Hero = () => {
  return (
    <div className="hero-container">
        <div className='video-div'>
            <video autoPlay muted loop className='hero-video' src="assets/hero.mp4"></video>
        </div>
        <div className='hero-description'>
            <h1>SportsLive</h1>
            <p>One stop for all Football Enthusiasts</p>
        </div>
    </div> 
  ) 
}

export default Hero