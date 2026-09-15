"use client";

interface Tab {
  id: string;
  label: string;
}

interface SegmentedTabsProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
}

export function SegmentedTabs({ tabs, activeId, onChange }: SegmentedTabsProps) {
  return (
    <div className="inline-flex bg-elevated rounded-full p-1 border border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            activeId === tab.id
              ? "bg-cta text-cta-ink"
              : "text-muted hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
