import React from 'react'
import './CoursesContent.css'

const CoursesContent = () => {
  return (
    <div className="courses-content">
      <div className="coming-soon-container">
        <div className="coming-soon-icon">
          <dotlottie-wc 
            src="https://lottie.host/ff10fb99-de37-4044-91a1-e4243afe7aec/B0tSlXmI31.lottie" 
            style={{ width: '300px', height: '300px' }}
            autoplay 
            loop
          ></dotlottie-wc>
        </div>
        <p className="coming-soon-message">
          We're working hard to bring you amazing courses and content. 
          Check back soon!
        </p>
      </div>
    </div>
  )
}

export default CoursesContent
