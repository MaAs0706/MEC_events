import React from 'react'
import { useNavigate } from 'react-router-dom'
import './PageBackButton.css'

function PageBackButton({ fallback = '/' }) {
  const navigate = useNavigate()

  const goBack = () => {
    // React Router stores an index for entries created within this app. This
    // avoids sending a directly opened NEXUS page back to an unrelated site.
    if (window.history.state?.idx > 0) {
      navigate(-1)
      return
    }

    navigate(fallback)
  }

  return (
    <button
      className="page-back-button"
      type="button"
      onClick={goBack}
      aria-label="Go back"
    >
      <span aria-hidden="true">←</span>
      Back
    </button>
  )
}

export default PageBackButton
