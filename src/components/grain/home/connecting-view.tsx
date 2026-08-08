'use client';

export function ConnectingView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in">
      <div className="grain-spinner mb-5" />
      <h2 className="text-base font-bold mb-1 tracking-tight" style={{ color: '#f4f4f5' }}>
        Pairing
      </h2>
      <p className="text-sm" style={{ color: '#a1a1aa' }}>GRAIN-01</p>
    </div>
  );
}
