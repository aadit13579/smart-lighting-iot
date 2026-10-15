"use client";

import { PhaseLabel } from "@/lib/mockSensorService";

interface RoadSimulationProps {
  isDay: boolean;
  pwm: number;
  motion: boolean;
}

function getPhase(isDay: boolean, motion: boolean): PhaseLabel {
  if (!isDay) return motion ? "night-motion" : "night";
  return "day";
}

/**
 * Full visual road-scene simulation.
 * - Sky changes colour per phase (blue → orange → deep navy → navy → pink-orange)
 * - A street-light with glowing lamp whose brightness follows PWM
 * - A road with lane markings
 * - A vehicle (car silhouette) and/or person that appear during "night-motion" ticks
 */
export default function RoadSimulation({
  pwm,
  isDay,
  motion,
}: RoadSimulationProps) {
  // --- derive visual parameters ---
  const lightBrightness = pwm / 255; // 0..1
  const lightOn = pwm > 5;
  const phase = getPhase(isDay, motion);

  // Sky gradient per phase
  const skyGradient: Record<PhaseLabel, string> = {
    day:          "linear-gradient(180deg, #56a0ee 0%, #87CEEB 40%, #d4eaf7 100%)",
    evening:      "linear-gradient(180deg, #1a1a40 0%, #c84b31 35%, #f5a623 70%, #fce38a 100%)",
    night:        "linear-gradient(180deg, #0a0e27 0%, #111633 50%, #1a1f4e 100%)",
    "night-motion": "linear-gradient(180deg, #0a0e27 0%, #111633 50%, #1a1f4e 100%)",
    dawn:         "linear-gradient(180deg, #1a1a40 0%, #e8739e 30%, #f5a623 65%, #fce38a 100%)",
  };

  // Stars only at night
  const showStars = phase === "night" || phase === "night-motion";

  // Sun/Moon positioning
  const showSun = phase === "day";
  const showMoon = phase === "night" || phase === "night-motion";

  // Vehicle animation
  const showVehicle = phase === "night-motion";

  // Phase label for UI
  const phaseLabels: Record<PhaseLabel, string> = {
    day:            "☀️  Daytime — Bright",
    evening:        "🌇  Evening — Getting Dark",
    night:          "🌙  Night — Street Light Dim",
    "night-motion": "🚗  Night — Vehicle Detected!",
    dawn:           "🌅  Dawn — Getting Bright",
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        borderRadius: "12px",
        overflow: "hidden",
        background: skyGradient[phase],
        transition: "background 1.2s ease",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      {/* === Stars === */}
      {showStars && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: i % 3 === 0 ? "3px" : "2px",
                height: i % 3 === 0 ? "3px" : "2px",
                borderRadius: "50%",
                background: "white",
                opacity: 0.4 + (i % 4) * 0.15,
                left: `${(i * 37 + 11) % 100}%`,
                top: `${(i * 23 + 7) % 50}%`,
                animation: `twinkle ${1.5 + (i % 3) * 0.5}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* === Sun === */}
      {showSun && (
        <div
          style={{
            position: "absolute",
            top: "12%",
            right: "18%",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #fff5a0, #f5a623)",
            boxShadow: "0 0 40px 15px rgba(245,166,35,0.4), 0 0 80px 30px rgba(245,166,35,0.15)",
            transition: "opacity 1s ease",
          }}
        />
      )}

      {/* === Moon === */}
      {showMoon && (
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "22%",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #f0f0f0, #d4d4d4)",
            boxShadow: "0 0 20px 5px rgba(200,200,230,0.3)",
            transition: "opacity 1s ease",
          }}
        />
      )}

      {/* === Ground / road === */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "35%",
          background: "linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%)",
        }}
      >
        {/* Sidewalk / curb */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "#555",
          }}
        />

        {/* Center lane marking (dashed) */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: "3px",
            background:
              "repeating-linear-gradient(90deg, #f5f5a0 0px, #f5f5a0 30px, transparent 30px, transparent 60px)",
            opacity: 0.7,
          }}
        />

        {/* Edge line bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            left: 0,
            right: 0,
            height: "2px",
            background: "rgba(255,255,255,0.2)",
          }}
        />
      </div>

      {/* === Grass strips === */}
      <div
        style={{
          position: "absolute",
          bottom: "35%",
          left: 0,
          right: 0,
          height: "8px",
          background:
            phase === "night" || phase === "night-motion"
              ? "#1a3318"
              : phase === "evening" || phase === "dawn"
              ? "#2a5224"
              : "#3a7d34",
          transition: "background 1s ease",
        }}
      />

      {/* === Street light pole === */}
      <div
        style={{
          position: "absolute",
          bottom: "35%",
          left: "30%",
          transformOrigin: "bottom center",
        }}
      >
        {/* Pole */}
        <div
          style={{
            width: "6px",
            height: "120px",
            background: "linear-gradient(180deg, #666, #444)",
            borderRadius: "3px 3px 0 0",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />
        {/* Arm */}
        <div
          style={{
            position: "absolute",
            top: "0px",
            left: "6px",
            width: "40px",
            height: "4px",
            background: "#555",
            borderRadius: "0 2px 2px 0",
          }}
        />
        {/* Lamp housing */}
        <div
          style={{
            position: "absolute",
            top: "-6px",
            left: "38px",
            width: "18px",
            height: "14px",
            background: lightOn ? "#ffeaa7" : "#444",
            borderRadius: "2px 2px 6px 6px",
            boxShadow: lightOn
              ? `0 0 ${20 + lightBrightness * 40}px ${10 + lightBrightness * 20}px rgba(255,234,167,${0.3 + lightBrightness * 0.5}),
                 0 0 ${40 + lightBrightness * 80}px ${20 + lightBrightness * 40}px rgba(255,200,50,${0.1 + lightBrightness * 0.2})`
              : "none",
            transition: "background 0.5s ease, box-shadow 0.5s ease",
          }}
        />

        {/* Light cone (triangle of light hitting the road) */}
        {lightOn && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "22px",
              width: 0,
              height: 0,
              borderLeft: "50px solid transparent",
              borderRight: "50px solid transparent",
              borderTop: `130px solid rgba(255,234,167,${0.05 + lightBrightness * 0.12})`,
              transform: "translateX(-26px)",
              pointerEvents: "none",
              transition: "border-top-color 0.5s ease",
            }}
          />
        )}
      </div>

      {/* === Vehicle (car) === */}
      {showVehicle && (
        <div
          style={{
            position: "absolute",
            bottom: "18%",
            animation: "driveAcross 3s ease-in-out infinite",
            zIndex: 10,
          }}
        >
          {/* Car body */}
          <div style={{ position: "relative" }}>
            {/* Cabin */}
            <div
              style={{
                width: "40px",
                height: "18px",
                background: "linear-gradient(180deg, #4a90d9, #2c5f9e)",
                borderRadius: "8px 8px 2px 2px",
                position: "absolute",
                bottom: "14px",
                left: "10px",
              }}
            />
            {/* Body */}
            <div
              style={{
                width: "65px",
                height: "18px",
                background: "linear-gradient(180deg, #3a7bd5, #2c5f9e)",
                borderRadius: "4px",
              }}
            />
            {/* Headlights */}
            <div
              style={{
                position: "absolute",
                right: "-4px",
                top: "4px",
                width: "6px",
                height: "5px",
                borderRadius: "50%",
                background: "#fff5a0",
                boxShadow: "0 0 8px 3px rgba(255,245,160,0.7), 15px 0 30px 10px rgba(255,245,160,0.15)",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: "-4px",
                top: "11px",
                width: "6px",
                height: "5px",
                borderRadius: "50%",
                background: "#fff5a0",
                boxShadow: "0 0 8px 3px rgba(255,245,160,0.7)",
              }}
            />
            {/* Taillights */}
            <div
              style={{
                position: "absolute",
                left: "-2px",
                top: "4px",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: "#ff4444",
                boxShadow: "0 0 6px 2px rgba(255,50,50,0.6)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "-2px",
                top: "12px",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: "#ff4444",
                boxShadow: "0 0 6px 2px rgba(255,50,50,0.6)",
              }}
            />
            {/* Wheels */}
            <div
              style={{
                position: "absolute",
                bottom: "-5px",
                left: "8px",
                width: "12px",
                height: "10px",
                borderRadius: "50%",
                background: "#111",
                border: "2px solid #333",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-5px",
                right: "8px",
                width: "12px",
                height: "10px",
                borderRadius: "50%",
                background: "#111",
                border: "2px solid #333",
              }}
            />
          </div>
        </div>
      )}

      {/* === Person walking (night-motion) === */}
      {showVehicle && (
        <div
          style={{
            position: "absolute",
            bottom: "35%",
            animation: "walkAcross 4s ease-in-out infinite",
            zIndex: 9,
          }}
        >
          {/* Simple stick-figure person */}
          <div style={{ position: "relative", width: "16px", height: "36px" }}>
            {/* Head */}
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#e0c9a8",
                margin: "0 auto",
              }}
            />
            {/* Body */}
            <div
              style={{
                width: "3px",
                height: "14px",
                background: "#555",
                margin: "0 auto",
              }}
            />
            {/* Legs */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  width: "3px",
                  height: "12px",
                  background: "#333",
                  transform: "rotate(-10deg)",
                  animation: "legWalk 0.5s ease-in-out infinite alternate",
                }}
              />
              <div
                style={{
                  width: "3px",
                  height: "12px",
                  background: "#333",
                  transform: "rotate(10deg)",
                  animation: "legWalk 0.5s ease-in-out infinite alternate-reverse",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* === Road surface glow when light is on === */}
      {lightOn && (
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            left: "22%",
            width: "22%",
            height: "20%",
            background: `radial-gradient(ellipse at center, rgba(255,234,167,${0.08 + lightBrightness * 0.18}) 0%, transparent 70%)`,
            pointerEvents: "none",
            transition: "opacity 0.5s ease",
          }}
        />
      )}

      {/* === Clouds (daytime) === */}
      {(phase === "day" || phase === "dawn") && (
        <>
          <div
            style={{
              position: "absolute",
              top: "18%",
              left: "8%",
              width: "80px",
              height: "28px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.7)",
              boxShadow: "20px -8px 0 5px rgba(255,255,255,0.6), 40px -3px 0 2px rgba(255,255,255,0.5)",
              animation: "cloudDrift 12s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "28%",
              left: "55%",
              width: "60px",
              height: "22px",
              borderRadius: "11px",
              background: "rgba(255,255,255,0.5)",
              boxShadow: "15px -5px 0 4px rgba(255,255,255,0.4)",
              animation: "cloudDrift 18s linear infinite",
            }}
          />
        </>
      )}

      {/* === HUD Overlay === */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          right: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        {/* Phase label */}
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            padding: "6px 14px",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          {phaseLabels[phase]}
        </div>

        {/* Light status */}
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            padding: "6px 14px",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: lightOn ? `rgb(${Math.round(200 + lightBrightness * 55)}, ${Math.round(180 + lightBrightness * 55)}, 50)` : "#555",
              boxShadow: lightOn ? `0 0 6px rgba(255,200,50,${lightBrightness})` : "none",
              transition: "all 0.3s ease",
            }}
          />
          <span>
            Light: {lightOn ? `ON (${Math.round(lightBrightness * 100)}%)` : "OFF"}
          </span>
        </div>
      </div>

      {/* === Motion badge === */}
      {motion && (
        <div
          style={{
            position: "absolute",
            bottom: "40%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(239,68,68,0.85)",
            backdropFilter: "blur(4px)",
            padding: "4px 12px",
            borderRadius: "12px",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            animation: "pulse 1s ease-in-out infinite",
            zIndex: 20,
          }}
        >
          ⚠ Motion Detected
        </div>
      )}

      {/* === Keyframe animations === */}
      <style>{`
        @keyframes twinkle {
          0% { opacity: 0.3; }
          100% { opacity: 0.9; }
        }
        @keyframes driveAcross {
          0%   { left: -80px; }
          100% { left: 110%; }
        }
        @keyframes walkAcross {
          0%   { left: 75%; }
          50%  { left: 35%; }
          100% { left: 75%; }
        }
        @keyframes legWalk {
          0%   { transform: rotate(-15deg); }
          100% { transform: rotate(15deg); }
        }
        @keyframes cloudDrift {
          0%   { transform: translateX(0); }
          100% { transform: translateX(60px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50%      { opacity: 0.7; transform: translateX(-50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
