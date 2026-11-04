type SidebarPanelIconProps = {
  className?: string;
};

/**
 * Sidebar panel icon used by the dashboard menu toggle.
 * The outlined frame and left divider match the sidebar control users expect.
 */
export default function SidebarPanelIcon({ className = 'h-4 w-4' }: SidebarPanelIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3.5" y="4" width="17" height="16" rx="3" />
      <path d="M9 4v16" />
    </svg>
  );
}
