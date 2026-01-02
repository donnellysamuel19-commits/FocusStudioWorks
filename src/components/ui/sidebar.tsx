'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket, LayoutDashboard, History, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/history', icon: History, label: 'History' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 text-white flex flex-col">
      <div className="h-16 flex items-center justify-center px-4 border-b border-gray-800">
        <Rocket className="h-6 w-6 mr-2" />
        <h1 className="text-xl font-bold">FocusSprint</h1>
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
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.email || 'Not logged in'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
