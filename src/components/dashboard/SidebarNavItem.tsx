
import { ChevronDown, ChevronUp } from "lucide-react";
import { ReactNode } from "react";

interface SidebarNavItemProps {
  label: string;
  icon: ReactNode;
  hasSubmenu?: boolean;
  isOpen?: boolean;
  submenuItems?: Array<{
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
  }>;
  onClick?: () => void;
}

export const SidebarNavItem = ({
  label,
  icon,
  hasSubmenu,
  isOpen,
  submenuItems,
  onClick,
}: SidebarNavItemProps) => {
  return (
    <div>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (onClick) onClick();
        }}
        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${
          hasSubmenu && isOpen
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-3">
          {icon}
          {label}
        </div>
        {hasSubmenu && (
          isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </a>
      {hasSubmenu && isOpen && submenuItems && (
        <div className="ml-9 mt-1 space-y-1">
          {submenuItems.map((subItem) => (
            <a
              key={subItem.label}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (subItem.onClick) subItem.onClick();
              }}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
            >
              {subItem.icon}
              {subItem.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
