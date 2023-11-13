import { useContext, useEffect, useState } from 'react';
import './News.css';
import SelectedMatchContext from '../../context/SelectedMatchContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loader from '../Spinner/Loader';
import { BASE_URL } from '../../helper.js'

const News = () => {
 
    // let i = 10;
    const [news, setNews ] = useState();
    const {newsContext, setNewsContext, setNewsId} = useContext(SelectedMatchContext);
    const navigate = useNavigate();

    useEffect(() => {
      // getNewsData();
        if(newsContext) { 
          setNews(newsContext);
          console.log("news : ", news);
        }
    },[])

    //fn for getting news data
    const getNewsData = async () => {
      document.getElementById('loader').style.display = 'block';
      console.log("inside getNewsData()");
      if(newsContext){
        setNews(newsContext);
      } else {
        try {
          await axios.get(`${BASE_URL}/news/getnews`)
                      .then((data) => {
                        console.log("response data from axios req : ", data);
                        setNews(data.data.jsonResponse.data) ;
                        document.getElementById('loader').style.display = 'none';

                        setNewsContext(data.data.jsonResponse.data);
                        console.log("News : ", news);
  
  
  
                      })
        } catch (error) {
          console.log(error.message);
        }
      }
     
    }

    //fn for getting selected news details
    const gotoNews = async (e) => {
      console.log("inside gotoNews()");
      const selectedNewsId = e.target.id;
      console.log("newsID inside gotoNews() : ", selectedNewsId);
      await setNewsId(selectedNewsId);
      navigate('/news/details');
    }

  return (
    // <h1>news</h1>
    <div>
      <Loader />
        {
          news ? 
          <div className="news-container " >
              { news.slice(0, 10).map((newsItem, index) => (
                  <div key={index} className='single-news'>
                      <div className="img-container hover01" >
                                  <img className='news-card-img ' src={`${newsItem.image.data.urls.uploaded.original}`} alt="img111" />
                      </div>
                      <div  onClick={(e) =>gotoNews(e)} className="right-container" id={newsItem.id} >
                          <h3 className='article-heading'>{newsItem.title}</h3>
                          <div className="tags">
                            {
                              newsItem.sports_related[0] &&
                              <button disabled className='tag-btn'>{newsItem.sports_related[0].data.name}</button>

                            }
                            {
                              newsItem.sports_related[1] &&
                              <button disabled className='tag-btn'>{newsItem.sports_related[1].data.name}</button>

                            }
                            {
                              newsItem.sports_related[2] &&
                              <button disabled className='tag-btn'>{newsItem.sports_related[2].data.name}</button>

                            }
                  
                          </div>
                      </div>
                        
                  </div>  
                ))
              }
          </div>
          : <button className='get-news-button' onClick={getNewsData}>GET NEWS</button>
        }
    </div>
  )
}

export default News