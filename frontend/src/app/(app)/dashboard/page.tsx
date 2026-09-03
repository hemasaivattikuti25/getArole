'use client';

import React from 'react';
import { WelcomeHero } from '@/components/features/dashboard/WelcomeHero';
import { MetricsGrid } from '@/components/features/dashboard/MetricsGrid';
import { ActionTrack } from '@/components/features/dashboard/ActionTrack';

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
      <WelcomeHero />
      <MetricsGrid />
      <ActionTrack />
    </div>
  );
}
