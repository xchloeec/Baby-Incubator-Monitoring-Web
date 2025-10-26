// App.tsx
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { RoleSelector } from "./components/RoleSelector";
import { ParentInterface } from "./components/ParentInterface";
import { HospitalInterface } from "./components/HospitalInterface";

export default function App() {
  const [role, setRole] = useState<"parent" | "hospital" | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // 🔹 Central live sensor data
  const [sensorData, setSensorData] = useState({
    heartRate: 0,
    oxygenLevel: 0,
    temperature: 0,
    humidity: 0,
    gyroscope: { x: 0, y: 0, z: 0 },
  });

  useEffect(() => {
    const s = io("http://172.26.152.203:5000");
    setSocket(s);

    s.on("connect", () => {
      console.log("✅ Connected to Raspberry Pi");
      s.emit("start_reading");
    });

    s.on("sensor_data", (msg) => {
      console.log("📡 Received data:", msg);
      setSensorData({
        heartRate: msg.bpm ?? 0,
        oxygenLevel: msg.spo2 ?? 0,
        temperature: msg.temperature ?? 0,
        humidity: msg.humidity ?? 0,
        gyroscope: { x: msg.x ?? 0, y: msg.y ?? 0, z: msg.z ?? 0 },
      });
    });

    s.on("disconnect", () => console.warn("⚠️ Disconnected"));
    return () => s.disconnect();
  }, []);

  // 🔹 Route to different interfaces
  if (role === "parent" && socket)
    return (
      <ParentInterface
        sensorData={sensorData}
        socket={socket} // Pass the socket down
        onBackToSelection={() => setRole(null)}
      />
    );

  if (role === "hospital")
    return (
      <HospitalInterface
        sensorData={sensorData}
        onBackToSelection={() => setRole(null)}
      />
    );

  return <RoleSelector onRoleSelect={setRole} />;
}