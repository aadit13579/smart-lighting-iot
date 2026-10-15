"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  Lightbulb,
  Sun,
  Moon,
  AlertTriangle,
  Wifi,
  WifiOff,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { LOW_LIGHT_THRESHOLD } from "@/lib/mockSensorService";
import RoadSimulation from "./components/RoadSimulation";

interface SensorReading {
  deviceId: string;
  timestamp: string;
  motion: boolean;
  isDay: boolean;
  ldr: number;
  ledDuty: number;
  ledPercent: number;
  diff: number | null;
  ref: number | null;
}

interface HistoryData extends SensorReading {
  timeLabel: string;
  daylightValue: number;
  motionValue: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toSensorReading(value: unknown): SensorReading | null {
  if (!isRecord(value)) return null;

  const ldr = Number(value.ldr);
  const ledDuty = Number(value.ledDuty ?? value.pwm);
  const ledPercent = Number(value.ledPercent ?? (ledDuty / 255) * 100);
  const ref = value.ref == null ? null : Number(value.ref);
  const diff = value.diff == null ? (ref === null ? null : ldr - ref) : Number(value.diff);
  const motionValue = value.motion;
  const motion = motionValue === true || motionValue === 1 || motionValue === "1";
  const hasMotion = motionValue === false || motionValue === 0 || motionValue === "0" || motion;
  const isDayValue = value.isDay;
  const isDay = typeof isDayValue === "boolean"
    ? isDayValue
    : isDayValue === 1 || isDayValue === "1"
      ? true
      : isDayValue === 0 || isDayValue === "0"
        ? false
        : ldr >= LOW_LIGHT_THRESHOLD;

  if (
    !Number.isFinite(ldr) ||
    !Number.isFinite(ledDuty) ||
    !Number.isFinite(ledPercent) ||
    (ref !== null && !Number.isFinite(ref)) ||
    (diff !== null && !Number.isFinite(diff)) ||
    !hasMotion
  ) return null;

  const timestampValue = value.timestamp ?? value.ts;
  const parsedTimestamp = new Date(
    typeof timestampValue === "string" || typeof timestampValue === "number"
      ? timestampValue
      : Date.now(),
  );

  return {
    deviceId: typeof value.deviceId === "string" ? value.deviceId : "Streetlight",
    timestamp: Number.isNaN(parsedTimestamp.getTime())
      ? new Date().toISOString()
      : parsedTimestamp.toISOString(),
    motion,
    isDay,
    ldr,
    ledDuty,
    ledPercent,
    diff,
    ref,
  };
}

function toHistoryRecord(reading: SensorReading): HistoryData {
  return {
    ...reading,
    timeLabel: new Date(reading.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    daylightValue: reading.isDay ? 1 : 0,
    motionValue: reading.motion ? 1 : 0,
  };
}

export default function Dashboard() {
  const [data, setData] = useState<SensorReading | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSensorData = async () => {
      try {
        const response = await fetch("/api/sensors", { cache: "no-store" });
        if (!response.ok) throw new Error("Sensor API request failed");

        const result: unknown = await response.json();
        if (!isRecord(result) || result.success !== true) {
          throw new Error("Sensor API returned an unsuccessful response");
        }

        const rawData = result.data;
        let rawReadings: unknown[];
        let rawLatest: unknown = null;

        if (isRecord(rawData) && ("history" in rawData || "latest" in rawData)) {
          const rawHistory = rawData.history;
          rawReadings = Array.isArray(rawHistory)
            ? rawHistory
            : isRecord(rawHistory)
              ? Object.values(rawHistory)
              : [];
          rawLatest = rawData.latest;
        } else if (Array.isArray(rawData)) {
          rawReadings = rawData;
        } else if (isRecord(rawData) && toSensorReading(rawData)) {
          rawReadings = [rawData];
        } else {
          rawReadings = isRecord(rawData) ? Object.values(rawData) : [];
        }

        const latestReading = toSensorReading(rawLatest);
        const readingsByTimestamp = new Map(
          rawReadings
          .map(toSensorReading)
            .filter((reading): reading is SensorReading => reading !== null)
            .map((reading) => [reading.timestamp, reading]),
        );
        if (latestReading) readingsByTimestamp.set(latestReading.timestamp, latestReading);
        const readings = Array.from(readingsByTimestamp.values())
          .sort((first, second) => Date.parse(first.timestamp) - Date.parse(second.timestamp))
          .slice(-120);

        if (readings.length === 0) {
          throw new Error("No valid sensor readings found in Firebase");
        }

        if (cancelled) return;

        setData(latestReading ?? readings[readings.length - 1]);
        setLastUpdated(new Date().toISOString());
        setIsConnected(true);
        setConnectionError(null);

        setHistory((previous) => {
          const mergedByTimestamp = new Map<string, HistoryData>();
          previous.forEach((reading) => mergedByTimestamp.set(reading.timestamp, reading));
          readings.forEach((reading) =>
            mergedByTimestamp.set(reading.timestamp, toHistoryRecord(reading)),
          );
          return Array.from(mergedByTimestamp.values())
            .sort((first, second) => Date.parse(first.timestamp) - Date.parse(second.timestamp))
            .slice(-120);
        });
      } catch (error) {
        if (cancelled) return;
        setIsConnected(false);
        setConnectionError(
          error instanceof Error ? error.message : "Unable to load sensor data",
        );
      }
    };

    let pollTimeout: number | undefined;
    const poll = async () => {
      await loadSensorData();
      if (!cancelled) pollTimeout = window.setTimeout(() => void poll(), 1000);
    };
    void poll();

    return () => {
      cancelled = true;
      if (pollTimeout !== undefined) window.clearTimeout(pollTimeout);
    };
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-500">
        <span>{connectionError ?? "Connecting to sensor network..."}</span>
        {connectionError && <span className="text-xs">Retrying automatically.</span>}
      </div>
    );
  }

  const isDark = !data.isDay;
  const isSafetyActive = isDark && data.motion;
  const motionEvents = history.filter(
    (reading, index) => reading.motion && !history[index - 1]?.motion,
  ).length;
  const safetyEvents = history.filter(
    (reading, index) =>
      reading.motion &&
      !history[index - 1]?.motion &&
      !reading.isDay,
  ).length;
  const recentEvents = history
    .flatMap((reading, index) => {
      if (
        reading.motion &&
        !history[index - 1]?.motion &&
        !reading.isDay
      ) {
        return [{
          id: `${reading.timestamp}-${index}`,
          time: reading.timeLabel,
          description: "Motion detected in low light. Lighting increased.",
        }];
      }
      return [];
    })
    .reverse()
    .slice(0, 5);
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Smart Lighting Safety</h1>
            <p className="text-sm text-slate-500 mt-1">IoT Monitoring Dashboard — Live Telemetry</p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-emerald-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-rose-600" />
            )}
            <span className={`font-medium ${isConnected ? "text-emerald-700" : "text-rose-700"}`}>
              {data.deviceId} {isConnected ? "Online" : "Connection lost"}
            </span>
          </div>
        </header>

        {/* === Road Simulation === */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">Live Road View</h2>
            <span className="text-xs text-slate-400 font-mono">
              Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "--"}
            </span>
          </div>
          <RoadSimulation
            isDay={data.isDay}
            pwm={data.ledDuty}
            motion={data.motion}
          />
        </div>

        {connectionError && (
          <div role="status" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Live sensor update failed: {connectionError}. Retrying automatically.
          </div>
        )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="bg-white p-4 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between mb-2 text-slate-500">
              <span className="text-sm font-medium">Ambient Light</span>
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div className="text-2xl font-semibold">{data.ldr}</div>
            <div className="text-xs text-slate-500 mt-1">
              ADC Value (0-4095)
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
              <Lightbulb className={`w-4 h-4 ${data.ledDuty > 0 ? "text-amber-500" : ""}`} />
            </div>
            <div className="text-2xl font-semibold">{data.ledDuty}</div>
            <div className="text-xs text-slate-500 mt-1">
              LED duty · {data.ledPercent}%
            </div>
          </div>

          <div className="bg-white p-4 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between mb-2 text-slate-500">
              <span className="text-sm font-medium">Sensor Difference</span>
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-2xl font-semibold">{data.diff ?? "N/A"}</div>
            <div className="text-xs text-slate-500 mt-1">LDR difference from reference</div>
          </div>

          <div className="bg-white p-4 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between mb-2 text-slate-500">
              <span className="text-sm font-medium">Reference Level</span>
              <Sun className="w-4 h-4" />
            </div>
            <div className="text-2xl font-semibold">{data.ref ?? "N/A"}</div>
            <div className="text-xs text-slate-500 mt-1">ADC reference value</div>
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
                    domain={[0, 4095]} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    domain={[0, 255]} 
                  />
                  <YAxis yAxisId="difference" domain={[-4095, 4095]} hide />
                  <YAxis yAxisId="percent" domain={[0, 100]} hide />
                  <YAxis yAxisId="state" domain={[0, 1]} hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
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
                    yAxisId="left"
                    type="monotone"
                    dataKey="ref"
                    stroke="#0ea5e9"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={false}
                    name="Reference"
                  />
                  <Line
                    yAxisId="difference"
                    type="monotone"
                    dataKey="diff"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    dot={false}
                    name="Difference"
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="ledDuty" 
                    stroke="#eab308" 
                    strokeWidth={2} 
                    dot={false} 
                    name="LED Duty"
                  />
                  <Line
                    yAxisId="percent"
                    type="monotone"
                    dataKey="ledPercent"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    dot={false}
                    name="LED Percent"
                  />
                  <Line
                    yAxisId="state"
                    type="stepAfter"
                    dataKey="daylightValue"
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    dot={false}
                    name="Daylight (1=day)"
                  />
                  <Line
                    yAxisId="state"
                    type="stepAfter"
                    dataKey="motionValue"
                    stroke="#ec4899"
                    strokeWidth={1.5}
                    dot={false}
                    name="Motion (1=active)"
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
