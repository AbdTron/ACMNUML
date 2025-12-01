import React from 'react'
import './FlairDisplay.css'

/**
 * Centralized component for displaying user flairs
 * Uses flairs stored in user profile (computed and stored when profile changes)
 * @param {Array} flairs - Array of flair objects from user profile: [{ text, class }, ...]
 * @param {number} maxFlairs - Maximum number of flairs to display (default: 3)
 */
const FlairDisplay = ({ flairs = [], maxFlairs = 3 }) => {
  if (!flairs || flairs.length === 0) {
    return null
  }

  // Display up to maxFlairs
  const displayFlairs = flairs.slice(0, maxFlairs)

  return (
    <div className="flair-container">
      {displayFlairs.map((flair, index) => (
        <span key={index} className={`flair ${flair.class || ''}`}>
          {flair.text}
        </span>
      ))}
    </div>
  )
}

export default FlairDisplay


