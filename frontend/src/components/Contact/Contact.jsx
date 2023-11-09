import { useState } from 'react';
import './Contact.css';
import axios from 'axios';
import {toast} from 'react-toastify'
 
const Contact = () => {
  const [name, setName] = useState();
  const [email, setEmail] = useState();
  const [message, setMessage] = useState();


  const contactFormHandler = async (e) => {
    e.preventDefault()
    console.log('inside contact form');
    await axios.post('http://localhost:4000/contact', {name, email, message})
                .then((data) => {
                  console.log('res from contact axios req : ', data.data.newMessage);
                  toast.success('Message sent successfully !');
                })
  }


  return (
    <>
        <section id="contact"> 
  
  <h1 className="section-header">Contact US</h1>
  
  <div className="contact-wrapper" >
  
  {/* <!-- Left contact page -->  */}
    
    <form id="contact-form" className="form-horizontal" role="form" method='post' action='/contact' onSubmit={contactFormHandler}>
       
      <div className="form-group">
        <div className="col-sm-12">
          <input type="text" className="form-control" id="name" placeholder="NAME" name="name"  required onChange={(e) => setName(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <div className="col-sm-12">
          <input type="email" className="form-control" id="email" placeholder="EMAIL" name="email"  required onChange={(e) => setEmail(e.target.value)}/>
        </div>
      </div>

      <textarea className="form-control" rows="10" placeholder="MESSAGE" name="message" required onChange={(e) => setMessage(e.target.value)}></textarea>
      
      <button className="btn btn-primary send-button" id="submit" type="submit" value="SEND">
        <div className="alt-send-button">
          <i className="fa fa-paper-plane"></i><span className="send-text">SEND</span>
        </div>
      
      </button>
      
    </form>
    
  {/* <!-- Right contact page -->  */}
    
      <div className="direct-contact-container">

        <ul className="contact-list">
          <li className="list-item"><i className="fa fa-map-marker fa-2x"><span className="contact-text place">Kannur, Kerala</span></i></li>
          
          <li className="list-item"><i className="fa fa-phone fa-2x"><span className="contact-text phone"><a href="tel:1-212-555-5555" title="Give me a call">+91 999999999</a></span></i></li>
          
          <li className="list-item"><i className="fa fa-envelope fa-2x"><span className="contact-text gmail"><a href="mailto:#" title="Send me an email">aravindshajan6@gmail.com</a></span></i></li>
          
        </ul>

        <hr />
        <ul className="social-media-list">
          <li><a href="#" target="_blank" className="contact-icon">
            <i className="fa fa-github" aria-hidden="true"></i></a>
          </li>
          <li><a href="#" target="_blank" className="contact-icon">
            <i className="fa fa-codepen" aria-hidden="true"></i></a>
          </li>
          <li><a href="#" target="_blank" className="contact-icon">
            <i className="fa fa-twitter" aria-hidden="true"></i></a>
          </li>
          <li><a href="#" target="_blank" className="contact-icon">
            <i className="fa fa-instagram" aria-hidden="true"></i></a>
          </li>       
        </ul>
        <hr />

       
      </div>
    
  </div>
  
</section>  
    </>
  )
}

export default Contact