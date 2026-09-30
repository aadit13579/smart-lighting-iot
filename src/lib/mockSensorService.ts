export interface SensorData {
  deviceId: string;
  timestamp: string;
  motion: boolean;
  ldr: number;
  pwm: number;
}

export const LOW_LIGHT_THRESHOLD = 300; // ADC value

export type Subscriber = (data: SensorData) => void;

/**
 * Each frame in the scripted day-cycle scenario.
 * The cycle takes ~15 seconds at 1 tick/sec.
 */
interface ScenarioFrame {
  ldr: number;      // 0-1023, ambient light
  motion: boolean;  // PIR / RCWL-0516
  pwm: number;      // 0-255, street-light output
  phase: string;    // human label for the UI
}

/**
 * A scripted 15-tick scenario that loops:
 *  0-3  : Bright daytime (LDR ~800, no motion, light OFF)
 *  4-5  : Evening / dusk transition (LDR drops 600→400)
 *  6-7  : Night, quiet (LDR ~150, no motion, dim safety light PWM 30)
 *  8-10 : Night, vehicle detected (motion ON, light ramps to 255)
 *  11-12: Night, vehicle gone (motion OFF, light dims back to 30)
 *  13-14: Dawn transition (LDR rises 300→600, light turns off)
 *  → loops back to tick 0
 */
const SCENARIO: ScenarioFrame[] = [
  // 0-3: Bright daytime
  { ldr: 820, motion: false, pwm: 0,   phase: "day" },
  { ldr: 830, motion: false, pwm: 0,   phase: "day" },
  { ldr: 810, motion: false, pwm: 0,   phase: "day" },
  { ldr: 800, motion: false, pwm: 0,   phase: "day" },

  // 4-5: Evening / dusk
  { ldr: 600, motion: false, pwm: 0,   phase: "evening" },
  { ldr: 400, motion: false, pwm: 0,   phase: "evening" },

  // 6-7: Night, quiet — dim safety light
  { ldr: 180, motion: false, pwm: 30,  phase: "night" },
  { ldr: 150, motion: false, pwm: 30,  phase: "night" },

  // 8-10: Night, vehicle/person detected — light ramps up
  { ldr: 140, motion: true,  pwm: 150, phase: "night-motion" },
  { ldr: 135, motion: true,  pwm: 230, phase: "night-motion" },
  { ldr: 140, motion: true,  pwm: 255, phase: "night-motion" },

  // 11-12: Night, vehicle gone — light dims back
  { ldr: 155, motion: false, pwm: 120, phase: "night" },
  { ldr: 160, motion: false, pwm: 30,  phase: "night" },

  // 13-14: Dawn
  { ldr: 350, motion: false, pwm: 10,  phase: "dawn" },
  { ldr: 600, motion: false, pwm: 0,   phase: "dawn" },
];

export type PhaseLabel = "day" | "evening" | "night" | "night-motion" | "dawn";

export interface SensorDataExtended extends SensorData {
  phase: PhaseLabel;
  tick: number;         // current position in the scenario (0 .. length-1)
  totalTicks: number;   // total scenario length
}

export type SubscriberExtended = (data: SensorDataExtended) => void;

class MockSensorService {
  private subscribers: SubscriberExtended[] = [];
  private interval: NodeJS.Timeout | null = null;
  private tickIndex = 0;

  subscribe(callback: SubscriberExtended) {
    this.subscribers.push(callback);
    // Send initial state immediately
    callback(this.generateReading());
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  start(intervalMs = 1000) {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.tickIndex = (this.tickIndex + 1) % SCENARIO.length;
      const data = this.generateReading();
      this.subscribers.forEach((s) => s(data));
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private generateReading(): SensorDataExtended {
    const frame = SCENARIO[this.tickIndex];
    return {
      deviceId: "ESP32-01",
      timestamp: new Date().toISOString(),
      motion: frame.motion,
      ldr: frame.ldr,
      pwm: frame.pwm,
      phase: frame.phase as PhaseLabel,
      tick: this.tickIndex,
      totalTicks: SCENARIO.length,
    };
  }
}

export const sensorService = new MockSensorService();
