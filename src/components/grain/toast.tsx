'use client';

import { useGrainStore } from '@/lib/grain-store';

export function Toast() {
  const toast = useGrainStore((s) => s.toast);
  if (!toast) return null;

  return (
    <div className="grain-toast visible">
      {toast}
    </div>
  );
}
