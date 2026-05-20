'use client';

import TabButton from './TabButton';

export interface TabBarItem<T extends string> {
  label: string;
  value: T;
  count?: number;
}

export interface TabBarProps<T extends string> {
  tabs: TabBarItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: TabBarProps<T>) {
  return (
    <div className={className ?? 'flex gap-2'}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.value}
          active={value === tab.value}
          onClick={() => onChange(tab.value)}
          count={tab.count}
        >
          {tab.label}
        </TabButton>
      ))}
    </div>
  );
}

