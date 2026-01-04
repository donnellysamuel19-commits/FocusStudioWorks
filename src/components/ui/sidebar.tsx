'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, LayoutDashboard, History, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/history', icon: History, label: 'History' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <aside className="w-48 flex-shrink-0 bg-gray-900 text-white flex flex-col">
      <div className="h-16 flex items-center justify-center px-4 border-b border-gray-800">
        <Brain className="h-6 w-6 mr-2" />
        <h1 className="text-lg font-bold">FocusSprint</h1>
      </div>
      <nav className="flex-1 px-4 py-4">
        <ul>
          {navItems.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link href={href} className={`flex items-center px-4 py-2 rounded-md transition-colors ${pathname === href ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}>
                  <Icon className="h-5 w-5 mr-3" />
                  <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-800 relative">
        <div 
          className="flex items-center cursor-pointer hover:bg-gray-800 p-2 rounded-md"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.email ? user.email.split('@')[0] : 'User'}</p>
          </div>
        </div>
        {dropdownOpen && (
          <div className="absolute bottom-full mb-2 w-full left-0 bg-gray-800 rounded-md shadow-lg">
            <div className="p-4">
              <p className="text-sm text-gray-400">Signed in as</p>
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
            <div className="border-t border-gray-700 p-2">
              <button 
                onClick={() => { signOut(); setDropdownOpen(false); }}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 rounded-md"
              >
                <LogOut className="h-4 w-4 mr-2"/>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
