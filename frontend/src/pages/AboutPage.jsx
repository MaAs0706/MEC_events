import React from 'react'
import { Link } from 'react-router-dom'
import './AboutPage.css'

const capabilities = [
  ['01', 'Shared planning', 'Clubs can check dates and venue availability before they submit a request.'],
  ['02', 'Clear approvals', 'Approvers can review requests digitally and leave a useful reason when one needs changes.'],
  ['03', 'One event record', 'Students, coordinators, and approvers work from the same approved event information.'],
  ['04', 'Less paperwork', 'Approved events have a downloadable permission letter and a visible registration count.'],
]

function AboutPage() {
  return (
    <main className="about-page">
      <nav className="about-nav">
        <Link to="/" className="about-logo" aria-label="Back to NEXUS home">NEXUS.</Link>
        <div>
          <Link to="/events" className="about-nav-link">Explore events</Link>
          <Link to="/calendar" className="about-nav-link">Calendar</Link>
          <Link to="/faq" className="about-nav-link">FAQ</Link>
          <Link to="/login" className="about-join">Join NEXUS</Link>
        </div>
      </nav>

      <header className="about-header">
        <span>ABOUT NEXUS</span>
        <h1>One place for<br />campus events.</h1>
        <p>
          NEXUS is an event-management platform built for the Government Model
          Engineering College, Kochi community. It brings event requests,
          approvals, venue planning, registrations, and updates into one system.
        </p>
      </header>

      <section className="about-problem" aria-labelledby="why-nexus">
        <div>
          <span>WHY IT EXISTS</span>
          <h2 id="why-nexus">Campus events should not depend on scattered messages and paper files.</h2>
        </div>
        <div className="about-problem-copy">
          <p>Before NEXUS, clubs often had to coordinate dates in chat groups, check venue availability manually, and carry approval letters from office to office.</p>
          <p>NEXUS gives every role the information it needs while keeping the workflow visible: clubs submit, reviewers decide, and students discover and register.</p>
        </div>
      </section>

      <section className="about-capabilities" aria-labelledby="what-it-does">
        <div className="about-section-heading">
          <span>WHAT IT DOES TODAY</span>
          <h2 id="what-it-does">Built around how MEC events actually run.</h2>
        </div>
        <div className="about-capability-grid">
          {capabilities.map(([number, title, description]) => (
            <article className="about-capability" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-credit">
        <div>
          <span>BUILT AT MEC</span>
          <h2>Made for the people who make campus happen.</h2>
          <p>NEXUS was designed and built by <strong>Aswanth Madhav</strong> for the MEC community. The platform will keep improving through feedback from students, clubs, and college staff.</p>
        </div>
        <Link to="/events" className="about-credit-action">Explore events</Link>
      </section>
    </main>
  )
}

export default AboutPage
