import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface ModernLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: typeof HomeIcon;
  badge?: string;
  children?: NavItem[];
}

export const ModernLayout = ({ children }: ModernLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Employees', href: '/employees', icon: UsersIcon },
    { name: 'Attendance', href: '/attendance', icon: CalendarIcon },
    { name: 'Leave Management', href: '/leave', icon: ClipboardDocumentCheckIcon },
    { name: 'Performance', href: '/performance', icon: ChartBarIcon },
    { name: 'Onboarding', href: '/onboarding', icon: UserPlusIcon },
    {
      name: 'Master Data',
      href: '/master-data',
      icon: BuildingOfficeIcon,
      children: [
        { name: 'Departments', href: '/departments', icon: BuildingOfficeIcon },
        { name: 'Designations', href: '/designations', icon: BriefcaseIcon },
      ],
    },
    { name: 'Exit Management', href: '/exit', icon: ArrowRightOnRectangleIcon },
    { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName) ? prev.filter((m) => m !== menuName) : [...prev, menuName]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (item: NavItem) =>
    item.children?.some((child) => isActive(child.href)) || isActive(item.href);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg p-2">
                <BriefcaseIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HRMS</h1>
                <p className="text-xs text-gray-500">Enterprise Edition</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus.includes(item.name);
              const itemActive = isParentActive(item);

              return (
                <div key={item.name}>
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        toggleMenu(item.name);
                      } else {
                        navigate(item.href);
                      }
                    }}
                    className={`
                      group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150
                      ${
                        itemActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        itemActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <span className="badge badge-danger ml-auto">{item.badge}</span>
                    )}
                    {hasChildren && (
                      <ChevronDownIcon
                        className={`ml-auto h-4 w-4 transition-transform ${
                          isExpanded ? 'transform rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Sub-menu */}
                  {hasChildren && isExpanded && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.children?.map((child) => (
                        <button
                          key={child.name}
                          onClick={() => navigate(child.href)}
                          className={`
                            group flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150
                            ${
                              isActive(child.href)
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}
                        >
                          <child.icon
                            className={`mr-3 flex-shrink-0 h-4 w-4 ${
                              isActive(child.href)
                                ? 'text-primary-600'
                                : 'text-gray-400 group-hover:text-gray-500'
                            }`}
                          />
                          {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
                  <span className="text-sm font-medium text-white">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 flex z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
              {/* Mobile menu content - reuse desktop sidebar content */}
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4">
                  <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg p-2">
                    <BriefcaseIcon className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="ml-3 text-xl font-bold text-gray-900">HRMS</h1>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`
                        group flex items-center px-2 py-2 text-base font-medium rounded-md w-full
                        ${
                          isActive(item.href)
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <item.icon className="mr-4 h-6 w-6" />
                      {item.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            {/* Search bar */}
            <div className="flex-1 flex">
              <form className="w-full flex md:ml-0" action="#" method="GET">
                <label htmlFor="search-field" className="sr-only">
                  Search
                </label>
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </div>
                  <input
                    id="search-field"
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                    placeholder="Search employees, attendance, leave..."
                    type="search"
                  />
                </div>
              </form>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              {/* Notifications */}
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors relative">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />
              </button>

              {/* User menu - only show on desktop, mobile shows in sidebar */}
              <div className="hidden md:block">
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
                    <span className="text-xs font-medium text-white">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">{user?.fullName || 'User'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
