import React from 'react'
import styles from './AppHeader.css' // eslint-disable-line

const AppHeader = (props) => {
  return (
    <header className='app-header'>
      <div className='app-title-wrapper'>
        <div className='app-title-wrapper'>
          <div className='app-left-nav'>           
            <div className='app-title-text'>
              <h1 className='app-title'>Netlify + Fauna DB</h1>              
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
