import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/background.png';

const Welcome = () => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="relative min-h-screen bg-black text-white overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center "
                style={{
                    backgroundImage: `url(${backgroundImage})`,

                }}
            />

            {/* Overlay for Text Readability */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-center items-start min-h-screen px-4">
                {/* Content Container */}
                <div
                    className="flex flex-col justify-between p-8"
                    style={{
                        height: '744px',
                        flexShrink: 0,
                        alignSelf: 'stretch',
                        borderRadius: '24px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 0 40px 0 rgba(0, 0, 0, 0.60) inset, 0 0 20px 0 rgba(255, 255, 255, 0.1)'
                    }}
                >
                    {/* Logo/Brand */}
                    <div>
                        <h1 className="text-2xl font-bold">
                            reko<span className="underline decoration-blue-500 underline-offset-4">mi</span>
                        </h1>
                    </div>

                    {/* Main Content */}
                    <div className="max-w-4xl space-y-8 ml-12">
                        {/* Hero Text */}
                        <div className="space-y-4 text-left">
                            <h2
                                style={{
                                    color: '#FFF',
                                    fontFamily: 'Inter',
                                    fontSize: '64px',
                                    fontWeight: 700,
                                    lineHeight: '67.2px',
                                    letterSpacing: '-1.6px',
                                    textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                                }}
                            >
                                TRACK WHAT YOU <br />
                                <span className="text-blue-500">LOVE</span>.<br />
                                SHARE WHAT<br />
                                <span className="text-blue-500">MOVES YOU</span>.
                            </h2>

                            <p
                                className="max-w-2xl"
                                style={{
                                    color: '#C1CEEE',
                                    fontFamily: 'Inter',
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    lineHeight: '24.75px',
                                    textShadow: '0 1px 4px rgba(0,0,0,0.8)'
                                }}
                            >
                                Discover a new way to experience movies, anime, and books - all in one place.
                                Track what you've watched, what you're reading, and what's next. Share recommendations
                                with friends, keep memories through ratings and comments, and never lose a great title again.
                                From late-night films to unforgettable stories, everything you love lives here - all together.
                            </p>
                        </div>

                        {/* CTA Button */}
                        <div className="text-left">
                            <button
                                onClick={() => navigate('/signup')}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                className="font-bold text-lg transition-all hover:scale-105"
                                style={{
                                    display: 'inline-flex',
                                    height: '75px',
                                    padding: '0 21px 0 20px',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderRadius: '30px',
                                    border: '2px solid rgba(51, 81, 147, 0.75)',
                                    background: isHovered ? '#2563eb' : 'rgba(255, 255, 255, 0.00)',
                                    boxShadow: '0 0 30px 0 rgba(107, 182, 255, 0.30), 0 1px 2px 0 rgba(255, 255, 255, 0.30) inset'
                                }}
                            >
                                Get Started
                            </button>
                        </div>

                        {/* Secondary CTA */}
                        <p className="text-slate-500 text-sm text-left">
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Welcome;