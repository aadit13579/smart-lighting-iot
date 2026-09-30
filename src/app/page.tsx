"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  Lightbulb,
  Sun,
  Moon,
  AlertTriangle,
  Wifi,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  sensorService,
  SensorDataExtended,
  LOW_LIGHT_THRESHOLD,
} from "@/lib/mockSensorService";
import RoadSimulation from "./components/RoadSimulation";

interface HistoryData extends SensorDataExtended {
  timeLabel: string;
}

export default function Dashboard() {
  const [data, setData] = useState<SensorDataExtended | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [motionEvents, setMotionEvents] = useState(0);
  const [safetyEvents, setSafetyEvents] = useState(0); // low-light + motion events
  const [recentEvents, setRecentEvents] = useState<
    { id: string; time: string; description: string }[]
  >([]);

  useEffect(() => {
    sensorService.start(1000);

    let lastMotionState = false;
    let localMotionEvents = 0;
    let localSafetyEvents = 0;

    const unsubscribe = sensorService.subscribe((newData) => {
      setData(newData);

      const timeLabel = new Date(newData.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setHistory((prev) => {
        const newHistory = [...prev, { ...newData, timeLabel }];
        if (newHistory.length > 30) newHistory.shift();
        return newHistory;
      });

      // Track events
      if (newData.motion && !lastMotionState) {
        localMotionEvents++;
        setMotionEvents(localMotionEvents);
        
        const isDark = newData.ldr < LOW_LIGHT_THRESHOLD;
        if (isDark) {
          localSafetyEvents++;
          setSafetyEvents(localSafetyEvents);
          setRecentEvents((prev) => {
            const newEvents = [
              {
                id: Date.now().toString(),
                time: timeLabel,
                description: "Motion detected in low light. Lighting increased.",
              },
              ...prev,
            ];
            return newEvents.slice(0, 5); // Keep last 5
          });
        }
      }
      lastMotionState = newData.motion;
    });

    return () => {
      unsubscribe();
      sensorService.stop();
    };
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Connecting to sensor network...
      </div>
    );
  }

  const isDark = data.ldr < LOW_LIGHT_THRESHOLD;
  const isSafetyActive = isDark && data.motion;
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Smart Lighting Safety</h1>
            <p className="text-sm text-slate-500 mt-1">IoT Monitoring Dashboard — Live Simulation</p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 font-medium">{data.deviceId} Online</span>
          </div>
        </header>

        {/* === Road Simulation === */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">Live Road Simulation</h2>
            <span className="text-xs text-slate-400 font-mono">
              Cycle: {data.tick + 1}/{data.totalTicks} · ~15s loop
            </span>
          </div>
          <RoadSimulation
            phase={data.phase}
            ldr={data.ldr}
            pwm={data.pwm}
            motion={data.motion}
            tick={data.tick}
            totalTicks={data.totalTicks}
          />
        </div>

        {/* Top Status Banner */}
        <div className={`p-4 border rounded-md flex items-center justify-between ${
          isSafetyActive 
            ? "bg-amber-50 border-amber-200 text-amber-900" 
            : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center space-x-3">
            {isSafetyActive ? (
              <ShieldAlert className="w-8 h-8 text-amber-600" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            )}
            <div>
              <h2 className="text-lg font-medium">
                {isSafetyActive ? "Safety Response Active" : "Area Secure"}
              </h2>
              <p className={`text-sm ${isSafetyActive ? "text-amber-700" : "text-slate-500"}`}>
                {isSafetyActive 
                  ? "Motion detected in low light. Illumination increased for visibility." 
                  : "Normal monitoring mode."}
              </p>
            </div>
          </div>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="bg-white p-4 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between mb-2 text-slate-500">
              <span className="text-sm font-medium">Ambient Light</span>
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div className="text-2xl font-semibold">{data.ldr}</div>
            <div className="text-xs text-slate-500 mt-1">
              ADC Value (Threshold: {LOW_LIGHT_THRESHOLD})
            </div>
          </div>

          <div className="bg-white p-4 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between mb-2 text-slate-500">
              <span className="text-sm font-medium">Motion Sensor</span>
              <Activity className={`w-4 h-4 ${data.motion ? "text-blue-600" : ""}`} />
            </div>
            <div className={`text-2xl font-semibold ${data.motion ? "text-blue-700" : ""}`}>
              {data.motion ? "Active" : "Clear"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              RCWL-0516 State
            </div>
          </div>

          <div className="bg-white p-4 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between mb-2 text-slate-500">
              <span className="text-sm font-medium">Lighting Output</span>
              <Lightbulb className={`w-4 h-4 ${data.pwm > 0 ? "text-amber-500" : ""}`} />
            </div>
            <div className="text-2xl font-semibold">{data.pwm}</div>
            <div className="text-xs text-slate-500 mt-1">
              PWM Value (0-255)
            </div>
          </div>

          <div className="bg-white p-4 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between mb-2 text-slate-500">
              <span className="text-sm font-medium">Safety Events</span>
              <AlertTriangle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-semibold">{safetyEvents}</div>
            <div className="text-xs text-slate-500 mt-1">
              {motionEvents} total motion events
            </div>
          </div>

        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart */}
          <div className="lg:col-span-2 bg-white p-4 border border-slate-200 rounded-md">
            <h3 className="text-sm font-medium text-slate-700 mb-4">Telemetry History</h3>
            <div className="h-72 w-full text-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="timeLabel" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    tickMargin={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    domain={[0, 1023]} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    domain={[0, 255]} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                  <Line 
                    yAxisId="left" 
                    type="stepAfter" 
                    dataKey="ldr" 
                    stroke="#64748b" 
                    strokeWidth={2} 
                    dot={false} 
                    name="Ambient Light (LDR)"
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="pwm" 
                    stroke="#eab308" 
                    strokeWidth={2} 
                    dot={false} 
                    name="Lighting Output (PWM)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Event Log */}
          <div className="bg-white p-4 border border-slate-200 rounded-md flex flex-col">
            <h3 className="text-sm font-medium text-slate-700 mb-4">Recent Safety Events</h3>
            <div className="flex-1 overflow-y-auto">
              {recentEvents.length === 0 ? (
                <div className="text-sm text-slate-400 h-full flex items-center justify-center">
                  No safety events recorded yet.
                </div>
              ) : (
                <ul className="space-y-3">
                  {recentEvents.map((event) => (
                    <li key={event.id} className="text-sm border-l-2 border-amber-400 pl-3 py-1">
                      <div className="text-slate-500 text-xs mb-0.5">{event.time}</div>
                      <div className="text-slate-700">{event.description}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
