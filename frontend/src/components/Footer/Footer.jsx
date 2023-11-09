import './Footer.css'
  
const Footer = () => {
  return (
    <footer className="footer">
        {/* <div className="footer__addr"> 
          <address>
            Aravind Shajan<br />
                
            
          </address>
        </div> */}

        {/* socail media icons */}
        <div>
          <div className=" social-div ">
            {/* <!-- Section: Social media --> */}
            <section className="mb-4">
              {/* <!-- Facebook --> */}
              <a
                className="btn text-white btn-floating m-1"
                // style="background-color: #3b5998;"
                style={{'backgrounColor':'#3b5998'}}

                href="#!"
                role="button"
                ><i className="fab fa-facebook-f"></i
              ></a>

              {/* <!-- Twitter --> */}
              <a
                className="btn text-white btn-floating m-1"
                // style="background-color: #55acee;"
                style={{'backgroundCcolor':'#55acee'}}

                href="#!"
                role="button"
                ><i className="fab fa-twitter"></i
              ></a>

              {/* <!-- Google --> */}
              <a
                className="btn text-white btn-floating m-1"
                // style="background-color: #dd4b39;"
                style={{'backgroundColor':'#dd4b39'}}

                href="#!"
                role="button"
                ><i className="fab fa-google"></i
              ></a>

              {/* <!-- Instagram --> */}
              <a
                className="btn text-white btn-floating m-1"
                style={{'backgroundColor':'#be2084'}}
                href="#!"
                role="button"
                ><i className="fab fa-instagram"></i
              ></a>

              {/* <!-- Linkedin --> */}
              <a
                className="btn text-white btn-floating m-1"
                style={{'backgroundColor':'#0082ca'}}

                // style="background-color: #0082ca;"
                href="#!"
                role="button"
                ><i className="fab fa-linkedin-in"></i
              ></a>
              {/* <!-- Github --> */}
              <a
                className="btn text-white btn-floating m-1"
                // style="background-color: #333333;"
                style={{'backgroundColor':'#333333'}}

                href="#!"
                role="button"
                ><i className="fab fa-github"></i
              ></a>
            </section>
            {/* <!-- Section: Social media --> */}
                </div>
        </div>
        <div className="legal">
          <p>&copy; 2023. All rights reserved.</p>
          
        </div>
        
  </footer>
  )
}

export default Footer