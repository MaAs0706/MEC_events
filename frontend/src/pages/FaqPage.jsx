import React from 'react'
import { Link } from 'react-router-dom'
import './FaqPage.css'

const faqGroups = [
  {
    label: 'DISCOVERING EVENTS',
    title: 'For students and campus visitors',
    questions: [
      {
        question: 'Do I need an account to browse events?',
        answer: 'No. Upcoming events, past events, the public calendar, and venue occupancy are available to everyone. You need a NEXUS account only when you want to register for an event or use a dashboard.',
      },
      {
        question: 'How do I register for an event?',
        answer: 'Open an approved event, sign in as a student, and choose RSVP. Your registration is saved immediately if the event still has capacity.',
      },
      {
        question: 'Why can’t I see an event I heard about?',
        answer: 'Events become publicly visible only after an approver has approved them. Pending and rejected requests are visible only to the people managing them.',
      },
      {
        question: 'Are registrations paid?',
        answer: 'NEXUS currently supports free event registration. Payment and ticketing are planned separately and are not part of the current platform.',
      },
    ],
  },
  {
    label: 'CLUBS & COORDINATORS',
    title: 'Planning an event',
    questions: [
      {
        question: 'How do I check whether a venue is available?',
        answer: 'Use the shared venue calendar before submitting your request. Select a date to see how each venue is occupied, then choose a suitable date, time, and venue for your event.',
      },
      {
        question: 'What happens after I submit an event request?',
        answer: 'The request is marked pending and reviewers are notified. You can follow its status from My Events. An approved event becomes visible to students and is ready for registrations.',
      },
      {
        question: 'Where do I get the permission letter?',
        answer: 'Once an event is approved, its Permission Letter card appears under My Events. Use Download to receive the generated PDF.',
      },
      {
        question: 'Can I see who registered for my event?',
        answer: 'Yes. Coordinators can open View attendees from their event management view to see the registrations for events they created.',
      },
    ],
  },
  {
    label: 'APPROVALS & SUPPORT',
    title: 'Keeping the platform reliable',
    questions: [
      {
        question: 'Who can approve or reject an event?',
        answer: 'Approver and admin accounts can review pending event requests. They can approve an event or reject it with a remark for the coordinator.',
      },
      {
        question: 'Will I be notified about a decision?',
        answer: 'Yes. NEXUS shows in-app notifications for relevant changes such as submissions, approvals, and rejections. Reviewers can also receive new-event emails when email delivery is configured.',
      },
      {
        question: 'What should I do if something looks wrong?',
        answer: 'Contact the NEXUS administrator or your club coordinator with the event name, the page you were using, and a screenshot if possible. That makes issues much easier to trace.',
      },
    ],
  },
]

function FaqPage() {
  return (
    <main className="faq-page">
      <nav className="faq-nav">
        <Link to="/" className="faq-logo" aria-label="Back to NEXUS home">NEXUS.</Link>
        <div>
          <Link to="/events" className="faq-nav-link">Explore events</Link>
          <Link to="/calendar" className="faq-nav-link">Calendar</Link>
          <Link to="/about" className="faq-nav-link">About</Link>
          <Link to="/login" className="faq-join">Join NEXUS</Link>
        </div>
      </nav>

      <header className="faq-header">
          <span>HELP CENTER</span>
          <h1>Frequently asked<br />questions.</h1>
          <p>
            Quick answers about events, RSVPs, venue requests, approvals, and
            using NEXUS at MEC.
          </p>
      </header>

      <div className="faq-quick-links" aria-label="FAQ sections">
        {faqGroups.map((group) => (
          <a href={`#${group.label.toLowerCase().replaceAll(' ', '-')}`} key={group.label}>
            {group.label.replace(' & ', ' + ')}
          </a>
        ))}
      </div>

      <section className="faq-list" aria-label="Frequently asked questions">
        {faqGroups.map((group) => (
          <section
            className="faq-group"
            id={group.label.toLowerCase().replaceAll(' ', '-')}
            key={group.label}
          >
            <div className="faq-group-heading">
              <span>{group.label}</span>
              <h2>{group.title}</h2>
            </div>
            <div className="faq-questions">
              {group.questions.map(({ question, answer }) => (
                <details key={question}>
                  <summary>{question}<span aria-hidden="true">+</span></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="faq-support">
        <span>STILL NEED HELP?</span>
        <h2>Start with the people who run your event.</h2>
        <p>For an event-specific question, contact its listed organizer. For an account or platform issue, contact a NEXUS administrator.</p>
        <Link to="/events" className="faq-support-action">Explore events</Link>
      </section>
    </main>
  )
}

export default FaqPage
