import About from "../components/About/About";
import Contact from "../components/Contact/Contact";
import '../styles/AboutScreen.css';

const AboutScreen = () => {
  return (
    <div >
      <div className="about-main-div" style={{width: '100vw'}}  > 
        <About />
        <Contact />

      </div>
    </div>
  )
}

export default AboutScreen