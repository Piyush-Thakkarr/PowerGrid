import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
            if (menuOpen) setMenuOpen(false);
        };
        const handleClickOutside = (e) => {
            if (menuOpen && navRef.current && !navRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [menuOpen]);

    return (
        <nav id="nav" ref={navRef} className={`${scrolled ? 's' : ''} ${menuOpen ? 'menu-open' : ''}`}>
            <div className="logo">
                <div className="logo-mark">
                    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="rgba(0,170,255,0.5)" strokeWidth="1" />
                        <polygon points="14,6 22,10 22,18 14,22 6,18 6,10" fill="none" stroke="rgba(0,170,255,0.25)" strokeWidth="1" />
                        <line x1="14" y1="2" x2="14" y2="26" stroke="rgba(0,170,255,0.3)" strokeWidth="1" />
                        <line x1="2" y1="8" x2="26" y2="20" stroke="rgba(0,170,255,0.3)" strokeWidth="1" />
                        <line x1="2" y1="20" x2="26" y2="8" stroke="rgba(0,170,255,0.3)" strokeWidth="1" />
                        <circle cx="14" cy="14" r="2" fill="#00aaff" />
                    </svg>
                </div>
                <div className="brand-name">POWER GRID</div>
            </div>
            <div className={`nav-links ${menuOpen ? 'show' : ''}`}>
                <a href="#about" onClick={() => setMenuOpen(false)}>Platform</a>
                <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
                <a href="#how" onClick={() => setMenuOpen(false)}>Process</a>
                <a href="#metrics" onClick={() => setMenuOpen(false)}>Impact</a>
                {user && (
                    <Link to="/dashboard" className="nav-mobile-signin" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                )}
            </div>
            <div className="nav-auth">
                {user ? (
                    <Link to="/dashboard" className="nav-btn">Dashboard</Link>
                ) : (
                    <Link to="/signup" className="nav-btn">Get Started</Link>
                )}
            </div>
            <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                <span></span><span></span><span></span>
            </button>
        </nav>
    );
}
