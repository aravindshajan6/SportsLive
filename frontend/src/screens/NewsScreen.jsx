import News from "../components/News/News"


const NewsScreen = () => {



  return (

    <>
      <div className="news-main-container">
        <div className="featured-news" style={{width: '100vw'}}>
            <h2>Latest News</h2>
            <News />
        </div>
      </div>
    </>
  )
}

export default NewsScreen