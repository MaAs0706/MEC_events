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
  },

  {
id: 3,

title: 'Spring Concert 2026',

description:
'An evening of live music performances featuring college bands, solo artists, and cultural performances.',

status: 'approved',

category: 'Music',

venue: 'Open Air Theatre',

date: '2026-05-02',

time: '06:00 PM',

endTime: '10:00 PM',

organizer: 'Music Club',

coordinator: 'Arjun Nair',

contact: '[musicclub@college.edu](mailto:musicclub@college.edu)',

attendees: 420,

capacity: 800,

approvedBy: 'Dean',

priority: 'MEDIUM',

image:
'https://images.unsplash.com/photo-1501386761578-eac5c94b800?q=80&w=1200&auto=format&fit=crop',

requirements: [
'College ID'
],

tags: [
'music',
'concert',
'culture'
],

agenda: [
{
time: '06:00 PM',
event: 'Opening Performance'
},
{
time: '07:00 PM',
event: 'Band Showcase'
},
{
time: '08:30 PM',
event: 'Guest Performance'
},
{
time: '09:30 PM',
event: 'Closing Ceremony'
}
]
},

{
id: 4,

title: 'Startup Meetup',

description:
'Connect with founders, investors, and aspiring entrepreneurs through networking and startup showcases.',

status: 'approved',

category: 'Entrepreneurship',

venue: 'Innovation Hub',

date: '2026-05-05',

time: '04:00 PM',

endTime: '07:00 PM',

organizer: 'Entrepreneurship Cell',

coordinator: 'Meera Thomas',

contact: '[ecell@college.edu](mailto:ecell@college.edu)',

attendees: 140,

capacity: 250,

approvedBy: 'Principal',

priority: 'HIGH',

image:
'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop',

requirements: [
'College ID',
'Registration Required'
],

tags: [
'startup',
'networking',
'business'
],

agenda: [
{
time: '04:00 PM',
event: 'Founder Talks'
},
{
time: '05:00 PM',
event: 'Startup Pitches'
},
{
time: '06:00 PM',
event: 'Networking Session'
}
]
},

{
id: 5,

title: 'Football Finals',

description:
'The annual inter-department football championship final match.',

status: 'approved',

category: 'Sports',

venue: 'College Ground',

date: '2026-05-10',

time: '05:00 PM',

endTime: '07:00 PM',

organizer: 'Sports Club',

coordinator: 'Rahul Menon',

contact: '[sportsclub@college.edu](mailto:sportsclub@college.edu)',

attendees: 950,

capacity: 1000,

approvedBy: 'Principal',

priority: 'HIGH',

image:
'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',

requirements: [
'College ID'
],

tags: [
'football',
'sports',
'championship'
],

agenda: [
{
time: '05:00 PM',
event: 'Kick Off'
},
{
time: '06:45 PM',
event: 'Prize Distribution'
}
]
},

{
id: 6,

title: 'Robotics Expo',

description:
'Showcase innovative robotics projects developed by students across departments.',

status: 'pending',

category: 'Technology',

venue: 'Innovation Center',

date: '2026-05-15',

time: '10:00 AM',

endTime: '04:00 PM',

organizer: 'Robotics Club',

coordinator: 'Aditya Raj',

contact: '[robotics@college.edu](mailto:robotics@college.edu)',

attendees: 180,

capacity: 300,

approvedBy: null,

priority: 'MEDIUM',

image:
'https://images.unsplash.com/photo-1535378917042-10a22c95931a?q=80&w=1200&auto=format&fit=crop',

requirements: [
'College ID'
],

tags: [
'robotics',
'innovation',
'engineering'
],

agenda: [
{
time: '10:00 AM',
event: 'Project Showcase'
},
{
time: '01:00 PM',
event: 'Live Demonstrations'
},
{
time: '03:00 PM',
event: 'Judging'
}
]
},

{
id: 7,

title: 'Design Thinking Workshop',

description:
'Hands-on workshop on creative problem solving and user-centered design.',

status: 'approved',

category: 'Workshop',

venue: 'Seminar Hall B',

date: '2026-05-18',

time: '01:00 PM',

endTime: '05:00 PM',

organizer: 'Design Club',

coordinator: 'Ananya Pillai',

contact: '[designclub@college.edu](mailto:designclub@college.edu)',

attendees: 95,

capacity: 150,

approvedBy: 'Dean',

priority: 'LOW',

image:
'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1200&auto=format&fit=crop',

requirements: [
'Notebook',
'College ID'
],

tags: [
'design',
'creativity',
'workshop'
],

agenda: [
{
time: '01:00 PM',
event: 'Introduction'
},
{
time: '02:00 PM',
event: 'Group Activities'
},
{
time: '04:00 PM',
event: 'Prototype Showcase'
}
]
}


]

export default events