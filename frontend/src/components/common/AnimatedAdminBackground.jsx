import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * AnimatedAdminBackground — High-visibility "Business Boom" animated background for Admin View.
 * Features:
 * - Crystal clear visibility with vibrant Mysuru-Bengaluru Darshini restaurant scene
 * - Real-time canvas continuous steam simulation for kitchen tawa, oven, and food tables
 * - 10-step looping "Business Boom" sequence ending in the Boss Dance & Thumbs Up!
 * - Floating order notification pills & flying rupee/coin celebration particles
 * - Translucent frosted-glass readability layer (customizable with dimmer slider)
 * - Floating glass HUD controls (Play/Pause, Instant Boss Dance, Ka-Ching sound, Dimmer)
 */
export default function AnimatedAdminBackground({
  overlayOpacity = 0.32,
  children,
  showControls = true,
}) {
  const canvasRef = useRef(null);
  const [stage, setStage] = useState('calm'); // 'calm' | 'sales_rise' | 'orders_ringing' | 'chef_fire' | 'boss_dance'
  const [bgDim, setBgDim] = useState(overlayOpacity);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [burstItems, setBurstItems] = useState([]);
  const [orderPills, setOrderPills] = useState([]);
  const [showEndingBanner, setShowEndingBanner] = useState(false);
  const audioCtxRef = useRef(null);

  // Synthesize fun Ka-Ching & celebratory fanfare via Web Audio API
  const playKaChingSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const freqs = [1567.98, 2093.00, 2637.02, 3135.96];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.04);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.04 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.04);
        osc.stop(ctx.currentTime + i * 0.04 + 0.4);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }, [soundEnabled]);

  const playBossDanceFanfare = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const chord = [261.63, 329.63, 392.0, 523.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + idx * 0.09 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.55);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }, [soundEnabled]);

  // Trigger full "Business Boom" sequence
  const triggerBusinessBoom = useCallback(() => {
    setStage('sales_rise');
    playKaChingSound();

    const simulatedOrders = [
      { id: 1, text: '🔔 Order #104: Masala Dosa x 3', amount: '+₹360', delay: 200 },
      { id: 2, text: '🚀 Order #105: Dum Biryani Handi x 2', amount: '+₹720', delay: 700 },
      { id: 3, text: '☕ Order #106: Filter Coffee x 5', amount: '+₹200', delay: 1200 },
      { id: 4, text: '⭐ Review: "Best Dosa in Mysuru!"', amount: '5.0 ★★★★★', delay: 1800 },
    ];

    simulatedOrders.forEach((item) => {
      setTimeout(() => {
        setOrderPills((prev) => [...prev.slice(-3), item]);
      }, item.delay);
    });

    setTimeout(() => {
      setStage('boss_dance');
      setShowEndingBanner(true);
      playBossDanceFanfare();

      const boomIcons = ['📈', '💰', '₹', '🔥', '⭐', '🕺', '💃', '💯', '✨', '🎉'];
      const newBursts = Array.from({ length: 18 }).map((_, i) => ({
        id: Math.random() + i,
        icon: boomIcons[Math.floor(Math.random() * boomIcons.length)],
        x: 18 + (Math.random() * 22 - 11),
        y: 40 + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 110,
        vy: -60 - Math.random() * 90,
        rot: (Math.random() - 0.5) * 80,
      }));
      setBurstItems(newBursts);
    }, 2200);

    setTimeout(() => {
      setBurstItems([]);
    }, 5500);

    setTimeout(() => {
      setShowEndingBanner(false);
      setOrderPills([]);
      setStage('calm');
    }, 8500);
  }, [playKaChingSound, playBossDanceFanfare]);

  // Automated loop: triggers Business Boom every 14 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const loop = setInterval(() => {
      triggerBusinessBoom();
    }, 15000);

    const initialTimer = setTimeout(() => {
      triggerBusinessBoom();
    }, 2000);

    return () => {
      clearInterval(loop);
      clearTimeout(initialTimer);
    };
  }, [isPlaying, triggerBusinessBoom]);

  // Canvas Steam & Heat Shimmer Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const emitters = [
      { name: 'chef_tawa_flame', xRel: 0.31, yRel: 0.38, count: 24, color: 'rgba(255, 235, 200, ', baseRad: 16, driftX: -0.3, vy: -1.8 },
      { name: 'kitchen_oven', xRel: 0.44, yRel: 0.39, count: 16, color: 'rgba(255, 240, 210, ', baseRad: 12, driftX: 0.2, vy: -1.4 },
      { name: 'table1_dosa', xRel: 0.58, yRel: 0.58, count: 14, color: 'rgba(255, 245, 225, ', baseRad: 10, driftX: -0.2, vy: -1.2 },
      { name: 'table2_coffee', xRel: 0.88, yRel: 0.72, count: 12, color: 'rgba(255, 255, 240, ', baseRad: 8, driftX: 0.1, vy: -1.5 },
    ];

    const particles = [];
    emitters.forEach((em) => {
      for (let i = 0; i < em.count; i++) {
        particles.push({
          emitter: em,
          x: em.xRel * canvas.width + (Math.random() - 0.5) * 30,
          y: em.yRel * canvas.height + (Math.random() - 0.5) * 15,
          life: Math.random(),
          maxLife: 1.0,
          speed: 0.007 + Math.random() * 0.008,
          radius: em.baseRad + Math.random() * 6,
          swayOffset: Math.random() * Math.PI * 2,
          swaySpeed: 1.8 + Math.random() * 2,
        });
      }
    });

    const floaters = Array.from({ length: 20 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 2 + Math.random() * 3,
      vy: -0.3 - Math.random() * 0.4,
      alpha: 0.3 + Math.random() * 0.6,
      alphaSpeed: 0.02 + Math.random() * 0.02,
    }));

    let time = 0;

    const render = () => {
      time += 0.035;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Golden Sparkles
      floaters.forEach((f) => {
        f.y += f.vy;
        if (f.y < -10) {
          f.y = canvas.height + 10;
          f.x = Math.random() * canvas.width;
        }
        f.alpha += Math.sin(time + f.x) * f.alphaSpeed;
        const boundedAlpha = Math.max(0.1, Math.min(0.8, f.alpha));

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${boundedAlpha * 0.6})`;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // 2. Rising Steam
      particles.forEach((p) => {
        const em = p.emitter;
        p.life += p.speed;

        if (p.life >= p.maxLife) {
          p.life = 0;
          p.x = em.xRel * canvas.width + (Math.random() - 0.5) * 30;
          p.y = em.yRel * canvas.height + (Math.random() - 0.5) * 15;
          p.radius = em.baseRad + Math.random() * 6;
        }

        const sway = Math.sin(time * p.swaySpeed + p.swayOffset) * 2;
        p.x += em.driftX + sway * 0.35;
        p.y += em.vy;
        p.radius += 0.16;

        let alpha = 0;
        if (p.life < 0.25) {
          alpha = (p.life / 0.25) * 0.45;
        } else {
          alpha = (1 - (p.life - 0.25) / 0.75) * 0.45;
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `${em.color}${alpha})`);
        grad.addColorStop(0.6, `${em.color}${alpha * 0.5})`);
        grad.addColorStop(1, `${em.color}0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // 3. Kitchen Tawa Flame Glow
      const flameX = 0.31 * canvas.width;
      const flameY = 0.38 * canvas.height;
      const flamePulse = 0.22 + Math.sin(time * 9) * 0.08 + Math.cos(time * 16) * 0.05;
      const flameGrad = ctx.createRadialGradient(flameX, flameY, 8, flameX, flameY, 150);
      flameGrad.addColorStop(0, `rgba(249, 115, 22, ${flamePulse})`);
      flameGrad.addColorStop(0.4, `rgba(234, 88, 12, ${flamePulse * 0.6})`);
      flameGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');

      ctx.beginPath();
      ctx.arc(flameX, flameY, 150, 0, Math.PI * 2);
      ctx.fillStyle = flameGrad;
      ctx.fill();

      // 4. Laptop Screen Green Trendline Pulser
      const lapX = 0.40 * canvas.width;
      const lapY = 0.60 * canvas.height;
      const chartGlow = 0.2 + Math.sin(time * 4) * 0.1;
      const lapGrad = ctx.createRadialGradient(lapX, lapY, 2, lapX, lapY, 70);
      lapGrad.addColorStop(0, `rgba(16, 185, 129, ${chartGlow})`);
      lapGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');

      ctx.beginPath();
      ctx.arc(lapX, lapY, 70, 0, Math.PI * 2);
      ctx.fillStyle = lapGrad;
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className="animated-admin-bg-container"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
      }}
    >
      {/* ─── 1. FIXED FULL-SCREEN BACKGROUND SCENE ────────────────────────── */}
      <div
        className="admin-scene-wrapper"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Base Scene Image — fully visible, bright, warm */}
        <div
          className={`admin-image-layer ${stage === 'boss_dance' ? 'boss-dancing' : ''}`}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/images/admin_bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            transformOrigin: '25% 60%',
            transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            filter: stage === 'boss_dance' ? 'saturate(1.2) contrast(1.1) brightness(1.05)' : 'saturate(1.05) brightness(1.0)',
          }}
        />

        {/* Dynamic Canvas Layer for Steam, Kitchen Flames & Sparkles */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />

        {/* ─── 2. LIVE ORDER PILLS & REVENUE BADGES POPPING ──────────────── */}
        <div
          style={{
            position: 'absolute',
            left: '26%',
            top: '18%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          {orderPills.map((pill) => (
            <div
              key={pill.id}
              className="order-notification-pill slide-in-left"
              style={{
                background: 'rgba(15, 23, 42, 0.94)',
                border: '1px solid rgba(16, 185, 129, 0.6)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 16px rgba(16, 185, 129, 0.4)',
                padding: '8px 16px',
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                backdropFilter: 'blur(12px)',
                animation: 'slideInFade 0.4s ease-out forwards',
              }}
            >
              <span>{pill.text}</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  padding: '3px 10px',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontWeight: 900,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                }}
              >
                {pill.amount}
              </span>
            </div>
          ))}
        </div>

        {/* Floating Celebration Particles (₹, 📈, 💰, ⭐, 🕺) */}
        {burstItems.map((item) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: '32px',
              pointerEvents: 'none',
              transform: `translate(${item.vx}px, ${item.vy}px) rotate(${item.rot}deg)`,
              opacity: 1,
              animation: 'floatBurst 2.5s forwards',
              zIndex: 4,
            }}
          >
            {item.icon}
          </div>
        ))}

        {/* ─── 3. GRAND ENDING COMIC BANNER ──────────────────────────────── */}
        {showEndingBanner && (
          <div
            className="boss-dance-banner bounce-in"
            style={{
              position: 'absolute',
              left: '14%',
              top: '10%',
              zIndex: 5,
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%)',
              border: '3px solid #f59e0b',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8), 0 0 32px rgba(245, 158, 11, 0.7)',
              borderRadius: '24px',
              padding: '16px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              animation: 'bossBannerPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px', animation: 'wiggle 0.5s infinite' }}>📈</span>
              <span
                style={{
                  fontFamily: "'Outfit', 'Impact', sans-serif",
                  fontSize: '24px',
                  fontWeight: 900,
                  letterSpacing: '0.8px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                  textAlign: 'center',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                }}
              >
                Business Full Joragide… Boss Dance Start! 😎📈💃
              </span>
              <span style={{ fontSize: '28px', animation: 'wiggle 0.5s infinite 0.2s' }}>💃</span>
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#34d399',
                marginTop: '4px',
                letterSpacing: '0.5px',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}
            >
              ಬ್ಯುಸಿನೆಸ್ ಫುಲ್ ಜೋರಾಗಿದೆ! • Peak Sales Day 🔥
            </div>
          </div>
        )}

        {/* ─── 4. TRANSLUCENT CINEMATIC VIGNETTE (VIBRANT & VISIBLE) ──────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at center, rgba(10, 10, 18, ${bgDim * 0.3}) 0%, rgba(10, 10, 18, ${bgDim}) 100%),
              linear-gradient(180deg, rgba(10, 10, 18, ${bgDim * 0.5}) 0%, transparent 40%, rgba(10, 10, 18, ${bgDim * 0.7}) 100%)
            `,
            pointerEvents: 'none',
            transition: 'background 0.3s ease',
          }}
        />
      </div>

      {/* ─── 5. FLOATING HUD CONTROLS ─────────────────────────────────────── */}
      {showControls && (
        <div
          className="admin-hud-controls"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '40px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(16, 185, 129, 0.25)',
            fontSize: '12px',
            color: '#cbd5e1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isPlaying ? '#10b981' : '#f59e0b',
                boxShadow: isPlaying ? '0 0 8px #10b981' : 'none',
                display: 'inline-block',
                animation: isPlaying ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '11px' }}>
              Business Boom Live
            </span>
          </div>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)' }} />

          {/* Trigger "Boss Dance" Button */}
          <button
            onClick={triggerBusinessBoom}
            className="btn btn-sm"
            title="Make Boss Celebrate Sales Boom!"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #f59e0b 100%)',
              color: '#0f172a',
              border: 'none',
              borderRadius: '20px',
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 3px 12px rgba(16, 185, 129, 0.4)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.94)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span>🕺</span>
            <span>Boss Dance!</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Mute Ka-Ching sound' : 'Enable Ka-Ching sound'}
            style={{
              background: soundEnabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '13px',
              color: soundEnabled ? '#34d399' : '#94a3b8',
            }}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          {/* Loop Play/Pause */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            title={isPlaying ? 'Pause animations' : 'Resume animations'}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#e2e8f0',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Dimmer Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title="Adjust background visibility / dimness">
            <span style={{ fontSize: '12px' }}>👁️</span>
            <input
              type="range"
              min="0.0"
              max="0.80"
              step="0.05"
              value={bgDim}
              onChange={(e) => setBgDim(parseFloat(e.target.value))}
              style={{
                width: '54px',
                cursor: 'pointer',
                accentColor: '#10b981',
                height: '4px',
              }}
            />
          </div>
        </div>
      )}

      {/* ─── 6. FOREGROUND CONTENT (CHARTS, CARDS, TABLES) ────────────────── */}
      <div
        className="foreground-admin-wrapper"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
        }}
      >
        {children}
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes bossBannerPop {
          0% {
            opacity: 0;
            transform: scale(0.4) rotate(-6deg);
          }
          70% {
            transform: scale(1.08) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes slideInFade {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes floatBurst {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(0.5);
          }
          50% {
            opacity: 0.9;
            transform: translate(calc(var(--vx, 20px)), -50px) scale(1.3);
          }
          100% {
            opacity: 0;
            transform: translate(calc(var(--vx, 40px)), -110px) scale(0.9);
          }
        }

        .admin-image-layer {
          animation: adminAmbientBreathe 20s ease-in-out infinite alternate;
        }

        @keyframes adminAmbientBreathe {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.02) translate(0.4%, -0.3%); }
          100% { transform: scale(1.01) translate(-0.3%, 0.3%); }
        }

        .boss-dancing {
          animation: bossDanceShimmy 0.7s ease-in-out infinite alternate;
        }

        @keyframes bossDanceShimmy {
          0% { transform: scale(1.03) rotate(-0.5deg) translateY(-2px); }
          50% { transform: scale(1.04) rotate(0.6deg) translateY(2px); }
          100% { transform: scale(1.035) rotate(-0.4deg) translateY(-1px); }
        }
      `}</style>
    </div>
  );
}
