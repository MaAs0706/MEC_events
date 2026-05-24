import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './HeroPage.css'

// Simple SVG Icons to avoid React version conflicts
const SearchIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
)

const UserIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

const MenuIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
)

const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const PlayIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
)

const StarIcon = ({ size = 16, fill = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
)

const ClockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
)

const CalendarIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
)

const ChevronLeftIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
)

const ChevronRightIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
)

export default function HeroPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Movies', href: '#' },
    { label: 'TV Series', href: '#' },
    { label: "Editor's Pick", href: '#' },
    { label: 'Interviews', href: '#' },
    { label: 'User Reviews', href: '#' },
  ]

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        className="fixed inset-0 w-full h-full object-cover z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
      />

      {/* Blur Overlay */}
      <div className="fixed inset-0 z-1 pointer-events-none blur-overlay" />

      {/* Navbar */}
      <nav className="relative z-50 flex justify-between items-center px-4 sm:px-6 md:px-12 py-4 md:py-6">
        {/* Logo */}
        <div 
          className="h-8 md:h-10 text-white text-xl md:text-2xl font-bold tracking-wide"
          style={{ animation: 'blurFadeUp 1s ease-out forwards', animationDelay: '0ms' }}
        >
          NEXUS.
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className="text-sm text-white hover:text-gray-300 transition-colors"
              style={{ 
                animation: 'blurFadeUp 1s ease-out forwards', 
                animationDelay: `${100 + idx * 50}ms`,
                opacity: 0
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search Button */}
          <button
            className="hidden sm:flex items-center gap-2 liquid-glass rounded-full px-4 md:px-6 py-2 text-white text-sm hover:bg-white/5 transition-colors"
            style={{ 
              animation: 'blurFadeUp 1s ease-out forwards', 
              animationDelay: '350ms',
              opacity: 0
            }}
          >
            <SearchIcon size={18} />
            <span className="hidden md:inline">Search</span>
          </button>

          {/* User Button */}
          <button
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full liquid-glass text-white hover:bg-white/5 transition-colors"
            style={{ 
              animation: 'blurFadeUp 1s ease-out forwards', 
              animationDelay: '400ms',
              opacity: 0
            }}
          >
            <UserIcon size={18} />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full liquid-glass text-white hover:bg-white/5 transition-colors"
            style={{ 
              animation: 'blurFadeUp 1s ease-out forwards', 
              animationDelay: '350ms',
              opacity: 0
            }}
          >
            {mobileMenuOpen ? (
              <XIcon size={18} style={{ animation: 'rotateIcon 500ms ease-out forwards' }} />
            ) : (
              <MenuIcon size={18} style={{ animation: 'rotateIcon 500ms ease-out forwards' }} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`absolute top-[72px] left-0 right-0 z-40 lg:hidden bg-gray-900/95 backdrop-blur-lg border-t border-b border-gray-800 shadow-2xl transition-all duration-500 ease-out ${
          mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col px-4 py-4">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className="py-3 px-3 rounded-lg text-white hover:bg-gray-800/50 transition-colors"
              style={{ 
                animation: mobileMenuOpen ? 'slideInNav 500ms ease-out forwards' : 'none',
                animationDelay: `${idx * 50}ms`,
                opacity: mobileMenuOpen ? 1 : 0,
                transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-10px)'
              }}
            >
              {link.label}
            </a>
          ))}

          {/* Mobile Search and Profile */}
          <div className="border-t border-gray-800 mt-4 pt-4 flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 liquid-glass rounded-lg py-2 text-white text-sm hover:bg-white/5 transition-colors">
              <SearchIcon size={18} />
              Search
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-lg liquid-glass text-white hover:bg-white/5 transition-colors">
              <UserIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-4 sm:px-6 md:px-12 pb-8 md:pb-16">
        <div className="flex flex-col md:flex-row items-end gap-8">
          {/* Left Side - Content */}
          <div className="flex-1">
            {/* Metadata */}
            <div
              className="flex flex-wrap gap-3 sm:gap-6 mb-6 md:mb-8 text-xs sm:text-sm text-gray-300"
              style={{ 
                animation: 'blurFadeUp 1s ease-out forwards', 
                animationDelay: '300ms',
                opacity: 0
              }}
            >
              <div className="flex items-center gap-1.5">
                <StarIcon size={16} fill={true} />
                <span className="font-medium">8.7/10 IMDB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ClockIcon size={16} />
                <span>132 min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarIcon size={16} />
                <span>April, 2025</span>
              </div>
            </div>

            {/* Title */}
            <h1
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal text-white mb-4 md:mb-6 leading-tight"
              style={{ 
                letterSpacing: '-0.04em',
                animation: 'blurFadeUp 1s ease-out forwards', 
                animationDelay: '400ms',
                opacity: 0
              }}
            >
              Step Through.<br />Work Smarter.
            </h1>

            {/* Description */}
            <p
              className="text-base sm:text-lg md:text-xl text-gray-400 mb-6 md:mb-12 max-w-2xl"
              style={{ 
                animation: 'blurFadeUp 1s ease-out forwards', 
                animationDelay: '500ms',
                opacity: 0
              }}
            >
              A voyage through forgotten realms, where past and future intertwine.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-wrap gap-3 sm:gap-4"
              style={{ 
                animation: 'blurFadeUp 1s ease-out forwards', 
                animationDelay: '600ms',
                opacity: 0
              }}
            >
              <Link
                to="/login"
                className="bg-white text-black rounded-full font-medium px-6 sm:px-8 py-2.5 sm:py-3 flex items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <PlayIcon size={18} />
                Watch Now
              </Link>

              <button className="liquid-glass rounded-full font-medium px-6 sm:px-8 py-2.5 sm:py-3 text-white hover:bg-white/10 transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* Right Side - Navigation Arrows */}
          <div
            className="flex gap-3 sm:gap-4 md:w-auto justify-start md:justify-end"
            style={{ 
              animation: 'blurFadeUp 1s ease-out forwards', 
              animationDelay: '800ms',
              opacity: 0
            }}
          >
            <button className="liquid-glass rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-white hover:bg-white/10 transition-colors flex items-center gap-2">
              <ChevronLeftIcon size={18} />
              <span className="hidden sm:inline text-sm">Previous</span>
            </button>

            <button 
              className="liquid-glass rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              style={{ 
                animation: 'blurFadeUp 1s ease-out forwards', 
                animationDelay: '900ms',
                opacity: 0
              }}
            >
              <span className="hidden sm:inline text-sm">Next</span>
              <ChevronRightIcon size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}