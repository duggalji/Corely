"use client"

import React, { useState, useEffect } from 'react';
import { Home, Terminal, Settings, Brain, Code, Database, Shield, Sparkle, Network, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const ModernSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { id: '/dashboard', icon: Home, label: 'Home' },
    { id: '/dashboard/generate', icon: Terminal, label: 'Generate' },
    { id: '/dashboard/settings', icon: Settings, label: 'Settings' },
    { id: '/dashboard/create', icon: Brain, label: 'AI' },
    { id: '/dashboard/code', icon: Code, label: 'Code' },
    { id: '/dashboard/data', icon: Database, label: 'Data' },
    { id: '/dashboard/security', icon: Shield, label: 'Security' },
    { id: '/dashboard/analytics', icon: Sparkle, label: 'Analytics' },
    { id: '/dashboard/network', icon: Network, label: 'Network' }
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
   
    
    <motion.nav
      initial={false}
      animate={{ width: isExpanded ? 240 : 80 }}
      className="top-0 left-0 z-50 fixed border-gray-800 bg-blue-950/30 border-r h-full text-white overflow-hidden"
      style={{
        boxShadow: '0 4px 60px 0 rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
       <motion.div
      className="top-4 right-4 absolute mt-20 pr-8 cursor-pointer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
    </motion.div>

        <div className="space-y-2 mt-28 p-4 pb-20">
          {menuItems.map(({ id, icon: Icon, label }) => (
            <Link key={id} href={id}>
              <motion.div
                className={`
                flex items-center p-3 rounded-xl transition-all duration-300 cursor-pointer
                ${pathname === id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-400 hover:bg-gradient-to-r hover:from-blue-600/50 hover:to-purple-600/50 hover:text-white'}
              `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-6 min-w-[24px] h-6" />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      className="ml-3 font-medium"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {label}
                    </motion.span>
                  )}


                </AnimatePresence>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.nav>
  );
};

export default ModernSidebar;
