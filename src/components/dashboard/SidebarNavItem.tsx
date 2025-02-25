
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
  isSelected?: boolean;
}

export const SidebarNavItem = ({
  label,
  icon,
  hasSubmenu,
  isOpen,
  submenuItems,
  onClick,
  isSelected,
}: SidebarNavItemProps) => {
  return (
    <div>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (onClick) onClick();
        }}
        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-200 ${
          isSelected
            ? "bg-gradient-to-r from-gebeya-pink/10 to-gebeya-orange/10 text-gebeya-pink font-medium"
            : hasSubmenu && isOpen
            ? "bg-gebeya-purple/5 text-gebeya-purple"
            : "text-gray-600 hover:bg-gebeya-purple/5 hover:text-gebeya-purple"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`${isSelected ? "text-gebeya-pink" : "text-gray-400"}`}>
            {icon}
          </div>
          {label}
        </div>
        {hasSubmenu && (
          <div className="text-gray-400">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
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
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gebeya-purple/5 hover:text-gebeya-purple rounded-md transition-all duration-200"
            >
              {subItem.icon && <div className="text-gray-400">{subItem.icon}</div>}
              {subItem.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
