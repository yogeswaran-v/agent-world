import React from 'react';
import Head from 'next/head';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-gray-100">
      <Head>
        <title>Agent's World</title>
        <meta name="description" content="A 3D simulation of AI agents interacting in a virtual world" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <header className="bg-slate-800 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-blue-500 mr-3"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="10" r="3"></circle>
                <path d="M7 16.3c0-3 2.5-5.3 5-5.3s5 2.3 5 5.3"></path>
              </svg>
              <h1 className="text-2xl font-bold text-white">Agent's World</h1>
            </div>
            <div className="text-sm text-gray-400">
              <span>Powered by React, Three.js, and FastAPI</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-6">
        {children}
      </main>
      
      <footer className="bg-slate-800 mt-8 py-6">
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