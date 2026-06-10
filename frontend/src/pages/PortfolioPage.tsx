import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Hero } from '../components/sections/Hero';
import { Projects } from '../components/sections/Projects';
import { Experience } from '../components/sections/Experience';
import { Skills } from '../components/sections/Skills';
import { Articles } from '../components/sections/Articles';
import { SupportWidget } from '../components/sections/SupportWidget';
import { Footer } from '../components/sections/Footer';

export const PortfolioPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bgBase text-textPrimary selection:bg-green/20 selection:text-green">
      <Navbar />
      <main>
        <Hero />
        <Projects isHomePage={true} />
        <Experience />
        <Skills isHomePage={true} />
        <Articles isHomePage={true} />
        <SupportWidget />
      </main>
      <Footer />
    </div>
  );
};


