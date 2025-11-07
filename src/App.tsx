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

  // live bed state from Pi
  const [bedState, setBedState] = useState({
    label: "Neutral",
    description: "Flat, centered position",
    x: 0,
    y: 0,
    z: 0,
    stable: true,
  })

  useEffect(() => {
    // create socket once when component mounts
    // const s = io("http://172.26.152.203:5000"); // Cleo pi
    //const s = io("http://192.168.137.30:5000"); // Chloe pi
    // const s = io("http://localhost:5000");    // forwarded port option
    const s = io("http://192.168.137.6:5000", {
    transports: ["polling"],
    withCredentials: true,
  });


    // save in state so children can use it
    setSocket(s);

    // handle successful connect
    s.on("connect", () => {
      console.log("✅ Connected to Raspberry Pi");
      s.emit("start_reading");
    });

    // sensor data from Pi (heart rate, temp, etc.)
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

    // bed position / angles from Pi
    s.on("bed_position", (msg) => {
      console.log("🛏 bed_position:", msg);
      setBedState({
        label: msg.label ?? "Neutral",
        description: msg.description ?? "Flat, centered position",
        x: msg.x ?? 0,
        y: msg.y ?? 0,
        z: msg.z ?? 0,
        stable: msg.stable ?? true,
      });
    });

    // just log disconnect
    s.on("disconnect", () => {
      console.warn("⚠️ Disconnected");
    });

    // CLEANUP: disconnect socket when App unmounts
    return () => {
      s.disconnect();
    };
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

  if (role === "hospital" && socket)
    return (
      <HospitalInterface
        sensorData={sensorData}
        bedState={bedState}
        socket={socket} // Pass the socket down
        onBackToSelection={() => setRole(null)}
      />
    );

  return <RoleSelector onRoleSelect={setRole} />;
}