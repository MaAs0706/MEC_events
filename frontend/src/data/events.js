const events = [

  {
    id: 1,

    title: 'TechHack 2026',

    description:
      'Build amazing projects in 24 hours with your team and compete for exciting prizes.',

    status: 'approved',

    category: 'Tech',

    venue: 'Main Auditorium',

    date: '2026-04-25',

    time: '09:00 AM',

    endTime: '09:00 AM (Next Day)',

    organizer: 'Tech Club',

    coordinator: 'John Doe',

    contact: 'techclub@college.edu',

    attendees: 234,

    capacity: 500,

    approvedBy: 'Dean',

    priority: 'HIGH',

    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',

    requirements: [
      'Laptop',
      'College ID',
      'Team of 2-4 members'
    ],

    tags: [
      'hackathon',
      'technology',
      'coding'
    ],

    agenda: [
      {
        time: '09:00 AM',
        event: 'Opening Ceremony'
      },
      {
        time: '10:00 AM',
        event: 'Hackathon Begins'
      },
      {
        time: '08:00 PM',
        event: 'Mentoring Session'
      },
      {
        time: '09:00 AM',
        event: 'Final Presentations'
      }
    ]
  },

  {
    id: 2,

    title: 'AI Workshop',

    description:
      'Learn practical AI skills and build your first machine learning application.',

    status: 'pending',

    category: 'Workshop',

    venue: 'Tech Lab',

    date: '2026-04-30',

    time: '02:00 PM',

    endTime: '05:00 PM',

    organizer: 'AI Club',

    coordinator: 'Jane Smith',

    contact: 'aiclub@college.edu',

    attendees: 120,

    capacity: 200,

    approvedBy: null,

    priority: 'MEDIUM',

    image:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop',

    requirements: [
      'Laptop',
      'Basic Python Knowledge'
    ],

    tags: [
      'ai',
      'machine-learning',
      'workshop'
    ],

    agenda: [
      {
        time: '02:00 PM',
        event: 'Introduction to AI'
      },
      {
        time: '03:00 PM',
        event: 'Hands-on Session'
      },
      {
        time: '04:30 PM',
        event: 'Q&A'
      }
    ]
  }

]

export default events