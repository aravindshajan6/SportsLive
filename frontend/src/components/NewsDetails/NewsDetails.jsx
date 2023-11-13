import { useContext, useEffect } from 'react'
import './NewsDetails.css'
import SelectedMatchContext from '../../context/SelectedMatchContext'


const NewsDetails = () => {

    // let x; 
    const {newsContext, newsId} = useContext(SelectedMatchContext);
    useEffect(() => {
        console.log("newsId inside detials : ", newsId );
        console.log("newsCOntext in details ", newsContext);

    }, []);
    
    const selectedNews = newsContext.find(item => item.id === newsId);
    if(selectedNews) {
        console.log("selected news after array op :", selectedNews);
    }
    
    //fn to remove html tags from news body
    function removeHtmlTags(input) {
        const regex = /(<([^>]+)>)/ig; // Regular expression to match HTML tags
        const dataToChange = input.data.content;
        if(dataToChange) {
            const tagsRemoved = dataToChange.replace(regex, '');
            return  tagsRemoved;// Replace HTML tags with an empty string
        }
      }
    
  return (
    selectedNews && 
    <div className="news-container">
        <div className="news-title">
            <h1>{selectedNews.title}</h1>
            {selectedNews.authors[0] && <h4>{selectedNews.authors[0].name}</h4>}
        </div>
        <div className="news-img-container">
            <img className="detail-img" src={selectedNews.image.data.urls.uploaded.original} alt="news-details-img" />
        </div>
        <div className="subtitle">
            <p>{selectedNews.subtitle}</p>
        </div>
        <div className="news-body">
            
        {
            selectedNews.body && 
            selectedNews.body.map((item, index) => (
                <div className='body-item' key={index}>
                    <span>
                        { 
                         item && removeHtmlTags(item) }
                    </span>
                </div>
            ))
        }
        </div>

    </div>
  )
}

export default NewsDetails