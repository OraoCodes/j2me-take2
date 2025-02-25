
import { cn } from "@/lib/utils";
import { SidebarNavItem } from "./SidebarNavItem";
import { ReactNode } from "react";

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
  businessFeatures,
}: DashboardSidebarProps) => {
  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 py-6 z-[95]",
        "transform transition-transform duration-300 ease-in-out",
        "md:transform-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <img src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" alt="Logo" className="h-8 w-8" />
          <div>
            <h2 className="font-semibold">{profile?.company_name || "KicksandSneakers"}</h2>
            <p className="text-sm text-gray-500">take.app/kicksandsneakers</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 px-3">
        {sidebarItems.map((item) => (
          <SidebarNavItem key={item.label} {...item} />
        ))}
      </nav>

      <div className="mt-8">
        <p className="px-6 text-xs font-medium text-gray-400 uppercase mb-2">Apps</p>
        <nav className="space-y-1 px-3">
          {[...premiumFeatures, ...businessFeatures].map((item) => (
            <a
              key={item.label}
              href="#"
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </div>
              {item.badge && (
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    item.badge === "PREMIUM"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
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
