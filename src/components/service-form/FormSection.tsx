
import React from "react";

interface FormSectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

export const FormSection = ({ number, title, children }: FormSectionProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white font-semibold text-sm">
          {number}
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};
