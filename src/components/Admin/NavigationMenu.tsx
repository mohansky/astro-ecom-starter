import React from 'react';
import {
  navigationItems,
  settingsItems,
  type NavItem,
} from '../../config/navigation';

interface NavigationMenuProps {
  userRole?: string;
}

export function NavigationMenu({ userRole }: NavigationMenuProps) {
  return (
    <>
      <ul className="space-y-1" id="nav-menu">
        {navigationItems.map((item: NavItem) => (
          <li key={item.href}>
            <a
              href={item.href}
              data-route={item.href}
              className="nav-link flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-base-100 transition-colors"
            >
              <item.icon size={14} />
              <span>{item.name}</span>
            </a>
          </li>
        ))}

        {/* Divider */}
        <div className="divider my-4"></div>

        {settingsItems.map((item: NavItem) => {
          // Skip admin-only items if user is not admin
          if (item.adminOnly && userRole !== 'admin') {
            return null;
          }

          return (
            <li key={item.href}>
              <a
                href={item.href}
                data-route={item.href}
                className="nav-link flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-base-100 transition-colors"
              >
                <item.icon size={14} />
                <span>{item.name}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
