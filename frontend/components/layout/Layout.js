import React from 'react';
import Head from 'next/head';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen text-white relative">
      <Head>
        <title>Agent's World</title>
        <meta name="description" content="A 3D simulation of AI agents interacting in a virtual world" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      {/* Background with animated gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-cyan-500/10 animate-pulse"></div>
      </div>
      
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full glass-button flex items-center justify-center mr-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-cyan-300"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="10" r="3"></circle>
                  <path d="M7 16.3c0-3 2.5-5.3 5-5.3s5 2.3 5 5.3"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                  Agent's World
                </h1>
                <p className="text-xs text-white/60 font-light">AI Agent Simulation</p>
              </div>
            </div>
            <div className="glass-button px-4 py-2 rounded-full text-sm font-medium text-white/80">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Live Simulation
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
      
      <footer className="glass border-t border-white/10 mt-12 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            Agent's World Simulation &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;