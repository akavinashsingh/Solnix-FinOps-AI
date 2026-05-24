import React from 'react';

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}> = ({ title, subtitle, right }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div>
      <h1 className="font-display text-[28px] leading-tight m-0 text-ink-1">{title}</h1>
      {subtitle && <p className="text-[13px] text-ink-3 mt-1">{subtitle}</p>}
    </div>
    {right}
  </div>
);

export const SectionHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}> = ({ icon, title, right }) => (
  <div className="flex items-center justify-between">
    <h4 className="m-0 text-[10px] font-data uppercase tracking-label text-ink-3 flex items-center gap-1.5">
      {icon}{title}
    </h4>
    {right}
  </div>
);
