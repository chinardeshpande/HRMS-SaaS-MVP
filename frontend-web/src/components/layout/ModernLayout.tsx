import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DemoJourneyPanel from '../demo/DemoJourneyPanel';
import { filterNavItemsForRole, navigationItems, NavItemConfig } from '../../config/accessControl';
import settingsService, { OrganizationSettings } from '../../services/settingsService';
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface ModernLayoutProps {
  children: ReactNode;
}

const DEFAULT_PLATFORM_LOGO = '/images/AuroraHR_logo.svg?v=20260514b';
const DEFAULT_PLATFORM_NAME = 'AuroraHR';

export const ModernLayout = ({ children }: ModernLayoutProps) => {
  const { user, logout, switchToDemo, exitDemo, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [demoSwitching, setDemoSwitching] = useState(false);
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(null);

  const navigation = filterNavItemsForRole(navigationItems, user?.role);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const assetBaseUrl = apiBaseUrl.replace('/api/v1', '');
  const resolveAssetUrl = (value?: string | null) => {
    if (!value) return '';
    if (value.startsWith('http') || value.startsWith('data:')) return value;
    if (value.startsWith('/images')) return value;
    if (value.startsWith('/')) return `${assetBaseUrl}${value}`;
    return `${assetBaseUrl}/${value}`;
  };

  const profilePhotoUrl = user?.profilePhotoUrl
    ? user.profilePhotoUrl.startsWith('http')
      ? user.profilePhotoUrl
      : `${assetBaseUrl}${user.profilePhotoUrl}`
    : '';
  const tenantBrand = useMemo(() => {
    const companyName =
      organizationSettings?.companyName ||
      user?.tenant?.companyName ||
      DEFAULT_PLATFORM_NAME;
    const logoUrl = resolveAssetUrl(
      organizationSettings?.logo ||
      organizationSettings?.branding?.logoUrl ||
      user?.tenant?.logoUrl
    );
    const primaryColor =
      organizationSettings?.branding?.primaryColor ||
      user?.tenant?.primaryColor ||
      '#2563eb';

    return {
      companyName,
      logoUrl,
      primaryColor,
    };
  }, [assetBaseUrl, organizationSettings, user?.tenant]);

  useEffect(() => {
    let cancelled = false;

    const loadTenantIdentity = async () => {
      if (!user?.tenantId) {
        setOrganizationSettings(null);
        return;
      }

      try {
        const settings = await settingsService.getOrganizationSettings();
        if (!cancelled) {
          setOrganizationSettings(settings);
        }
      } catch (error) {
        if (!cancelled) {
          setOrganizationSettings(null);
        }
        console.warn('Tenant organization settings unavailable; using platform defaults.', error);
      }
    };

    loadTenantIdentity();

    return () => {
      cancelled = true;
    };
  }, [user?.tenantId]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDemoToggle = async () => {
    if (isDemoMode) {
      exitDemo();
      navigate('/dashboard');
      return;
    }

    setDemoSwitching(true);
    try {
      await switchToDemo('hr');
      navigate('/dashboard');
    } finally {
      setDemoSwitching(false);
    }
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName) ? prev.filter((m) => m !== menuName) : [...prev, menuName]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (item: NavItemConfig) =>
    item.children?.some((child) => isActive(child.href)) || isActive(item.href);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6">
            <img
              src={DEFAULT_PLATFORM_LOGO}
              alt="AuroraHR - Illuminate The Journey | Grow Every Person"
              className="h-10 w-auto cursor-pointer"
              onClick={() => navigate('/dashboard')}
            />
          </div>

          {/* Navigation */}
          <nav data-testid="primary-navigation" className="mt-8 flex-1 px-3 space-y-1">
            <div className="mb-4 px-3">
              <button
                onClick={handleDemoToggle}
                disabled={demoSwitching}
                className={`w-full rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                  isDemoMode
                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isDemoMode ? 'Return to my account' : demoSwitching ? 'Switching...' : 'Switch to demo mode'}
              </button>
              {isDemoMode && (
                <p className="mt-2 text-xs text-amber-700">
                  Demo workspace: {user?.tenant?.companyName || 'AuroraHR Demo'}
                </p>
              )}
            </div>
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
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 overflow-hidden">
                  {profilePhotoUrl ? (
                    <img src={profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  )}
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
                <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
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
                  <img
                    src={DEFAULT_PLATFORM_LOGO}
                    alt="AuroraHR - Illuminate The Journey | Grow Every Person"
                    className="h-10 w-auto cursor-pointer"
                    onClick={() => { navigate('/dashboard'); setSidebarOpen(false); }}
                  />
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  <button
                    onClick={() => {
                      handleDemoToggle();
                      setSidebarOpen(false);
                    }}
                    disabled={demoSwitching}
                    className={`mb-3 w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold ${
                      isDemoMode
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-primary-200 bg-primary-50 text-primary-700'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {isDemoMode ? 'Return to my account' : 'Switch to demo mode'}
                  </button>
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
                              return;
                            }
                            navigate(item.href);
                            setSidebarOpen(false);
                          }}
                          className={`
                            group flex items-center px-2 py-2 text-base font-medium rounded-md w-full
                            ${
                              itemActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          <item.icon className="mr-4 h-6 w-6" />
                          <span className="flex-1 text-left">{item.name}</span>
                          {hasChildren && (
                            <ChevronDownIcon
                              className={`ml-auto h-4 w-4 transition-transform ${
                                isExpanded ? 'transform rotate-180' : ''
                              }`}
                            />
                          )}
                        </button>

                        {hasChildren && isExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children?.map((child) => (
                              <button
                                key={child.name}
                                onClick={() => {
                                  navigate(child.href);
                                  setSidebarOpen(false);
                                }}
                                className={`
                                  group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium
                                  ${
                                    isActive(child.href)
                                      ? 'bg-primary-50 text-primary-700'
                                      : 'text-gray-600 hover:bg-gray-50'
                                  }
                                `}
                              >
                                <child.icon className="mr-3 h-5 w-5" />
                                {child.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
          <div className="flex-1 min-w-0 px-3 sm:px-4 flex justify-between items-center">
            {/* Search bar */}
            <div className="flex-1 min-w-0 flex">
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
                    className="block w-full h-full min-w-0 pl-8 pr-3 py-2 border-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent"
                    placeholder="Search"
                    type="search"
                  />
                </div>
              </form>
            </div>
            <div className="ml-2 flex shrink-0 items-center md:ml-6 space-x-2 sm:space-x-3">
              <div
                className="flex max-w-[180px] items-center gap-2.5 rounded-full border bg-white py-1 pl-1 pr-3 text-xs font-semibold text-gray-700 shadow-sm sm:max-w-[240px] sm:pr-4"
                style={{ borderColor: `${tenantBrand.primaryColor}33` }}
                title={tenantBrand.companyName}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm sm:h-10 sm:w-10">
                  {tenantBrand.logoUrl ? (
                    <img src={tenantBrand.logoUrl} alt={`${tenantBrand.companyName} logo`} className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
                  ) : (
                    <span className="text-xs font-bold text-primary-700">
                      {tenantBrand.companyName
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((word) => word.charAt(0))
                        .join('')
                        .toUpperCase() || 'AH'}
                    </span>
                  )}
                </span>
                <span className="truncate">{tenantBrand.companyName}</span>
              </div>
              {isDemoMode && (
                <div className="hidden sm:flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                  Demo Mode
                </div>
              )}
              {/* Notifications */}
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors relative">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />
              </button>

              {/* User menu - only show on desktop, mobile shows in sidebar */}
              <div className="hidden md:block">
                <div
                  onClick={() => navigate('/edit-profile')}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 overflow-hidden">
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {user?.fullName?.charAt(0) || 'U'}
                      </span>
                    )}
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
              {isDemoMode && (
                <DemoJourneyPanel
                  currentPath={location.pathname}
                  onNavigate={(route) => navigate(route)}
                />
              )}
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
