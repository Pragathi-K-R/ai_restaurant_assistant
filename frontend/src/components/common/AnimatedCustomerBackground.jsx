import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * AnimatedCustomerBackground — High-visibility animated background for Customer View.
 * Features:
 * - Crystal clear visibility of Mysore/Bengaluru Darshini restaurant scene & customer
 * - Real-time continuous canvas steam physics for Masala Dosa, Filter Coffee, Biryani, Sambar & Chef Tawa
 * - Looping dramatic tasting cycle: Munching -> Suspenseful Pause -> Huge "SUPER! 😋🔥" Thumbs-Up reaction
 * - Floating spice/flame reaction particles and animated Kannada & English comic speech bubble
 * - Translucent frosted-glass readability layer (customizable with dimmer slider)
 * - Floating glass HUD controls (Play/Pause, Instant SUPER! button, Audio chime, Dimmer)
 */
export default function AnimatedCustomerBackground({ 
  overlayOpacity = 0.32, 
  children,
  showControls = true 
}) {
  const canvasRef = useRef(null);
  const [reactionStage, setReactionStage] = useState('eating'); // 'eating' | 'pausing' | 'super'
  const [superCount, setSuperCount] = useState(0);
  const [bgDim, setBgDim] = useState(overlayOpacity);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showBubble, setShowBubble] = useState(false);
  const [emojiBurst, setEmojiBurst] = useState([]);
  const audioCtxRef = useRef(null);

  // Synthesize pleasant ambient chime using Web Audio API
  const playSuperSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.5);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }, [soundEnabled]);

  // Trigger dramatic "SUPER!" reaction
  const triggerSuperReaction = useCallback(() => {
    setReactionStage('super');
    setShowBubble(true);
    setSuperCount((c) => c + 1);
    playSuperSound();

    const emojis = ['🔥', '😋', '👌', '⭐', '☕', '💯', '✨', '❤️'];
    const newBurst = Array.from({ length: 14 }).map((_, i) => ({
      id: Math.random() + i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: 65 + (Math.random() * 26 - 13),
      y: 35 + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 80,
      vy: -50 - Math.random() * 70,
      rot: (Math.random() - 0.5) * 60,
    }));
    setEmojiBurst(newBurst);

    setTimeout(() => {
      setEmojiBurst([]);
    }, 2400);

    setTimeout(() => {
      setShowBubble(false);
      setReactionStage('eating');
    }, 4200);
  }, [playSuperSound]);

  // Automated seamless loop cycle
  useEffect(() => {
    if (!isPlaying) return;

    const loop = setInterval(() => {
      setReactionStage('pausing');

      setTimeout(() => {
        triggerSuperReaction();
      }, 1600);
    }, 11000);

    const initTimer = setTimeout(() => {
      triggerSuperReaction();
    }, 2000);

    return () => {
      clearInterval(loop);
      clearTimeout(initTimer);
    };
  }, [isPlaying, triggerSuperReaction]);

  // Canvas Steam Simulation
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
      { name: 'dosa', xRel: 0.47, yRel: 0.81, count: 18, color: 'rgba(255, 245, 230, ', baseRad: 12, driftX: -0.4, vy: -1.2 },
      { name: 'sambar', xRel: 0.58, yRel: 0.82, count: 14, color: 'rgba(255, 235, 210, ', baseRad: 10, driftX: 0.1, vy: -1.4 },
      { name: 'biryani', xRel: 0.70, yRel: 0.83, count: 16, color: 'rgba(255, 240, 220, ', baseRad: 14, driftX: 0.3, vy: -1.5 },
      { name: 'coffee', xRel: 0.84, yRel: 0.79, count: 15, color: 'rgba(255, 255, 245, ', baseRad: 8, driftX: 0.2, vy: -1.8 },
      { name: 'kitchen_tawa', xRel: 0.36, yRel: 0.64, count: 22, color: 'rgba(255, 240, 200, ', baseRad: 18, driftX: -0.2, vy: -1.6 },
    ];

    const particles = [];
    emitters.forEach((em) => {
      for (let i = 0; i < em.count; i++) {
        particles.push({
          emitter: em,
          x: em.xRel * canvas.width + (Math.random() - 0.5) * 35,
          y: em.yRel * canvas.height + (Math.random() - 0.5) * 15,
          life: Math.random(),
          maxLife: 1.0,
          speed: 0.006 + Math.random() * 0.008,
          radius: em.baseRad + Math.random() * 8,
          swayOffset: Math.random() * Math.PI * 2,
          swaySpeed: 1.5 + Math.random() * 2,
        });
      }
    });

    const bokeh = Array.from({ length: 24 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 2 + Math.random() * 4,
      vy: -0.2 - Math.random() * 0.4,
      alpha: 0.3 + Math.random() * 0.5,
      alphaSpeed: 0.01 + Math.random() * 0.02,
    }));

    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Sparkles
      bokeh.forEach((b) => {
        b.y += b.vy;
        if (b.y < -10) {
          b.y = canvas.height + 10;
          b.x = Math.random() * canvas.width;
        }
        b.alpha += Math.sin(time + b.x) * b.alphaSpeed;
        const boundedAlpha = Math.max(0.1, Math.min(0.75, b.alpha));

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${boundedAlpha * 0.5})`;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // 2. Rising Steam
      particles.forEach((p) => {
        const em = p.emitter;
        p.life += p.speed;

        if (p.life >= p.maxLife) {
          p.life = 0;
          p.x = em.xRel * canvas.width + (Math.random() - 0.5) * 35;
          p.y = em.yRel * canvas.height + (Math.random() - 0.5) * 15;
          p.radius = em.baseRad + Math.random() * 6;
        }

        const sway = Math.sin(time * p.swaySpeed + p.swayOffset) * 1.8;
        p.x += em.driftX + sway * 0.4;
        p.y += em.vy;
        p.radius += 0.18;

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
      const tawaX = 0.36 * canvas.width;
      const tawaY = 0.68 * canvas.height;
      const flameFlicker = 0.2 + Math.sin(time * 8) * 0.08 + Math.cos(time * 14) * 0.04;
      const flameGrad = ctx.createRadialGradient(tawaX, tawaY, 5, tawaX, tawaY, 130);
      flameGrad.addColorStop(0, `rgba(249, 115, 22, ${flameFlicker})`);
      flameGrad.addColorStop(0.5, `rgba(234, 88, 12, ${flameFlicker * 0.5})`);
      flameGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');

      ctx.beginPath();
      ctx.arc(tawaX, tawaY, 130, 0, Math.PI * 2);
      ctx.fillStyle = flameGrad;
      ctx.fill();

      // 4. Hot Filter Coffee Froth Shimmer
      const coffeeX = 0.84 * canvas.width;
      const coffeeY = 0.80 * canvas.height;
      const frothGlow = 0.16 + Math.sin(time * 3) * 0.06;
      const coffeeGrad = ctx.createRadialGradient(coffeeX, coffeeY, 2, coffeeX, coffeeY, 40);
      coffeeGrad.addColorStop(0, `rgba(251, 191, 36, ${frothGlow})`);
      coffeeGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');

      ctx.beginPath();
      ctx.arc(coffeeX, coffeeY, 40, 0, Math.PI * 2);
      ctx.fillStyle = coffeeGrad;
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
      className="animated-restaurant-bg-container"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
      }}
    >
      {/* ─── 1. FIXED FULL-SCREEN BACKGROUND SCENE ────────────────────────── */}
      <div
        className="restaurant-scene-wrapper"
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
        <div
          className={`scene-image-layer ${reactionStage === 'super' ? 'scene-celebrating' : ''}`}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/images/customer_bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            transformOrigin: '70% 40%',
            transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            filter: reactionStage === 'super' ? 'saturate(1.2) contrast(1.1) brightness(1.05)' : 'saturate(1.05) brightness(1.0)',
          }}
        />

        {/* Dynamic Canvas Layer for Rising Steam & Kitchen Flames */}
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

        {/* ─── 2. CHARACTER REACTION & COMIC BUBBLE ──────────────────────── */}
        <div
          className={`customer-reaction-aura ${reactionStage === 'super' ? 'active-aura' : ''}`}
          style={{
            position: 'absolute',
            right: '18%',
            top: '30%',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.45) 0%, rgba(234, 88, 12, 0) 70%)',
            pointerEvents: 'none',
            opacity: reactionStage === 'super' ? 1 : 0,
            transform: reactionStage === 'super' ? 'scale(1.3)' : 'scale(0.8)',
            transition: 'all 0.5s ease-out',
          }}
        />

        {showBubble && (
          <div
            className="comic-super-bubble bounce-in"
            style={{
              position: 'absolute',
              right: '25%',
              top: '14%',
              zIndex: 5,
              background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)',
              color: '#0f172a',
              padding: '16px 26px',
              borderRadius: '26px',
              border: '3px solid #f97316',
              boxShadow: '0 16px 48px rgba(249, 115, 22, 0.55), 0 0 24px rgba(251, 191, 36, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              transformOrigin: 'bottom right',
              animation: 'superPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '28px', animation: 'wiggle 0.6s infinite' }}>🔥</span>
              <span
                style={{
                  fontFamily: "'Outfit', 'Impact', sans-serif",
                  fontSize: '32px',
                  fontWeight: 900,
                  letterSpacing: '1.5px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #f59e0b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                }}
              >
                SUPER!
              </span>
              <span style={{ fontSize: '28px', animation: 'wiggle 0.6s infinite 0.2s' }}>😋</span>
            </div>

            <div
              style={{
                fontSize: '13px',
                fontWeight: 900,
                color: '#b45309',
                marginTop: '4px',
                letterSpacing: '0.5px',
              }}
            >
              ಸೂಪರ್ ಊಟ! • Pakka Taste! 👍
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '-14px',
                right: '32px',
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '15px solid #f97316',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-10px',
                right: '34px',
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '12px solid #ffffff',
              }}
            />
          </div>
        )}

        {emojiBurst.map((item) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: '30px',
              pointerEvents: 'none',
              transform: `translate(${item.vx}px, ${item.vy}px) rotate(${item.rot}deg)`,
              opacity: 1,
              animation: 'floatFadeOut 2.2s forwards',
              zIndex: 4,
            }}
          >
            {item.emoji}
          </div>
        ))}

        {/* ─── 3. TRANSLUCENT CINEMATIC VIGNETTE ──────────────────────────── */}
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

      {/* ─── 4. FLOATING HUD BACKGROUND CONTROLS ───────────────────────────── */}
      {showControls && (
        <div
          className="bg-hud-controls"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '280px',
            zIndex: 90,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            borderRadius: '40px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(249,115,22,0.25)',
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
              Darshini Live
            </span>
          </div>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)' }} />

          <button
            onClick={triggerSuperReaction}
            className="btn btn-sm"
            title="Make customer react 'SUPER!'"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 3px 12px rgba(249, 115, 22, 0.4)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.94)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span>😋</span>
            <span>SUPER!</span>
          </button>

          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Mute reaction sound' : 'Enable reaction sound'}
            style={{
              background: soundEnabled ? 'rgba(249, 115, 22, 0.25)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '13px',
              color: soundEnabled ? '#fb923c' : '#94a3b8',
            }}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

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
                accentColor: '#f97316',
                height: '4px',
              }}
            />
          </div>
        </div>
      )}

      {/* ─── 5. FOREGROUND CONTENT ────────────────────────────────────────── */}
      <div
        className="foreground-content-wrapper"
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
        @keyframes superPop {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-10deg);
          }
          60% {
            transform: scale(1.12) rotate(3deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(15deg) scale(1.18); }
        }

        @keyframes floatFadeOut {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(0.6);
          }
          50% {
            opacity: 0.9;
            transform: translate(15px, -40px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(30px, -90px) scale(0.9);
          }
        }

        .scene-image-layer {
          animation: ambientBreathe 18s ease-in-out infinite alternate;
        }

        @keyframes ambientBreathe {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.025) translate(-0.5%, -0.5%); }
          100% { transform: scale(1.01) translate(0.5%, 0.2%); }
        }

        .scene-celebrating {
          animation: celebrateShake 0.6s ease-out;
        }

        @keyframes celebrateShake {
          0%, 100% { transform: scale(1.02); }
          25% { transform: scale(1.035) rotate(0.4deg); }
          50% { transform: scale(1.025) rotate(-0.3deg); }
          75% { transform: scale(1.03) rotate(0.2deg); }
        }
      `}</style>
    </div>
  );
}
