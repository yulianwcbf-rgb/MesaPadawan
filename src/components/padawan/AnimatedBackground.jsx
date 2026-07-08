export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: '#0A1F16', zIndex: 0 }}>
      {/* Slow drifting glow orbs */}
      <div
        className="absolute rounded-full"
        style={{
          width: 600, height: 600,
          top: '-15%', left: '-10%',
          background: 'radial-gradient(circle, rgba(168,224,99,0.14), transparent 70%)',
          animation: 'floatOrb 18s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 500, height: 500,
          bottom: '-10%', right: '-8%',
          background: 'radial-gradient(circle, rgba(108,158,255,0.10), transparent 70%)',
          animation: 'floatOrb2 22s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 400, height: 400,
          top: '40%', left: '60%',
          background: 'radial-gradient(circle, rgba(168,224,99,0.08), transparent 70%)',
          animation: 'floatOrb3 26s ease-in-out infinite',
        }}
      />
      {/* Subtle diagonal line texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 2px, transparent 2px, transparent 40px)',
        }}
      />
    </div>
  );
}