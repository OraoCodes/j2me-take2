
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SidebarNavItem } from "./SidebarNavItem";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  hasSubmenu?: boolean;
  isOpen?: boolean;
  submenuItems?: Array<{
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
  }>;
  onClick?: () => void;
  isSelected?: boolean;
}

interface DashboardSidebarProps {
  isMobileMenuOpen: boolean;
  profile: {
    company_name: string | null;
  } | null;
  sidebarItems: SidebarItemProps[];
  premiumFeatures: Array<{
    icon: ReactNode;
    label: string;
    badge?: string;
  }>;
  businessFeatures: Array<{
    icon: ReactNode;
    label: string;
    badge?: string;
  }>;
}

export const DashboardSidebar = ({
  isMobileMenuOpen,
  profile,
  sidebarItems,
  premiumFeatures,
  businessFeatures
}: DashboardSidebarProps) => {
  return (
    <div className={cn(
      "fixed left-0 top-0 h-full w-64 bg-white border-r border-gebeya-purple/10 py-6 z-[95]",
      "transform transition-transform duration-300 ease-in-out",
      "md:transform-none",
      isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange flex items-center justify-center">
            <span className="text-white font-semibold">
              {profile?.company_name?.charAt(0).toUpperCase() || "M"}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-gebeya-purple">{profile?.company_name || "My Business"}</h2>
          </div>
        </div>
      </div>

      <nav className="space-y-1 px-3">
        {sidebarItems.map(item => <SidebarNavItem key={item.label} {...item} />)}
      </nav>

      <div className="mt-8">
        <p className="px-6 text-xs font-medium text-gebeya-pink uppercase mb-2">Premium Features</p>
        <nav className="space-y-1 px-3">
          {premiumFeatures.map(item => (
            <a 
              key={item.label} 
              href="#" 
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gebeya-purple/5 hover:text-gebeya-purple transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="text-gray-400">{item.icon}</div>
                {item.label}
              </div>
              {item.badge && (
                <span className="text-xs px-2 py-1 rounded bg-gebeya-purple/10 text-gebeya-purple">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        <p className="px-6 text-xs font-medium text-gebeya-orange uppercase mb-2">Business Features</p>
        <nav className="space-y-1 px-3">
          {businessFeatures.map(item => (
            <a 
              key={item.label} 
              href="#" 
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gebeya-purple/5 hover:text-gebeya-purple transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="text-gray-400">{item.icon}</div>
                {item.label}
              </div>
              {item.badge && (
                <span className="text-xs px-2 py-1 rounded bg-gebeya-orange/10 text-gebeya-orange">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};
