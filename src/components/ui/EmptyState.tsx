import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconType?: "book" | "history" | "member" | "pending";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  iconType = "book",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[12px] border border-dashed border-[#E5E5E5] bg-[#FAFAFA] my-6">
      <div className="w-16 h-16 rounded-full bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#0F766E]">
        {iconType === "book" && (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M12 6v6" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        {iconType === "history" && (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        {iconType === "pending" && (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" />
            <line x1="23" y1="11" x2="17" y2="11" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        {iconType === "member" && (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <line x1="7" y1="8" x2="17" y2="8" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" />
            <line x1="7" y1="12" x2="13" y2="12" />
            <line x1="7" y1="16" x2="10" y2="16" />
          </svg>
        )}
      </div>
      <h4 className="font-serif-academic text-lg font-medium text-[#1A1A1A] mb-1.5">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-[#666666] max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
