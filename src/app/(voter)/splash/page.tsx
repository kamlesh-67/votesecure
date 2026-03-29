"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function SplashScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing Node 0x4F2...");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const statuses = [
    "Initializing Node 0x4F2...",
    "Loading Encryption Layer...",
    "Verifying Session Integrity...",
    "Establishing Secure Channel...",
    "Ready.",
  ];

  useEffect(() => {
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      setProgress(Math.min(step * 25, 100));
      setStatusText(statuses[Math.min(step, statuses.length - 1)]);
      if (step >= 4) {
        clearInterval(intervalRef.current!);
        setTimeout(() => router.push("/login"), 600);
      }
    }, 550);
    return () => clearInterval(intervalRef.current!);
  }, []);

  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <main
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-6"
      style={{
        backgroundColor: "#1b2f6e",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 20px)",
      }}
    >
      {/* Background watermark */}
      <div className="absolute top-[-10%] right-[-10%] opacity-10 pointer-events-none select-none">
        <span
          className="material-symbols-outlined text-[20rem] md:text-[40rem]"
          style={{
            color: "#dce1ff",
            fontVariationSettings: "'FILL' 1",
          }}
        >
          verified_user
        </span>
      </div>

      <div className="relative z-10 w-full max-w-[480px] flex flex-col items-center text-center space-y-12">
        {/* Branding */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="relative inline-flex items-center justify-center">
            <div
              className="absolute w-32 h-32 rounded-full border-4 opacity-20"
              style={{ borderColor: "#fdab12" }}
            />
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "#ffffff",
                boxShadow: "0 8px 32px rgba(0,24,87,0.4)",
              }}
            >
              <span
                className="material-symbols-outlined text-5xl"
                style={{
                  color: "#001857",
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                shield
              </span>
              <span
                className="material-symbols-outlined absolute text-4xl"
                style={{
                  color: "#fdab12",
                  fontVariationSettings: "'FILL' 1",
                  marginTop: "8px",
                  marginLeft: "4px",
                }}
              >
                check
              </span>
            </div>
          </div>

          {/* App name */}
          <div className="space-y-2">
            <h1
              className="font-extrabold text-[36px] tracking-tighter uppercase leading-none"
              style={{ color: "#ffffff", fontFamily: "Inter, sans-serif" }}
            >
              VoteSecure
            </h1>
            <p
              className="font-semibold tracking-wide text-lg"
              style={{ color: "#fdab12" }}
            >
              Your Vote. Your Voice. Secured.
            </p>
          </div>
        </div>

        {/* Progress ring */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="transparent"
                stroke="rgba(135,153,223,0.2)"
                strokeWidth="3"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="transparent"
                stroke="#fdab12"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
          </div>
          <span
            className="text-xs tracking-widest uppercase"
            style={{
              color: "rgba(135,153,223,0.9)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="absolute bottom-8 w-full left-0 px-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-px w-12" style={{ backgroundColor: "rgba(135,153,223,0.2)" }} />
          <p
            className="text-[10px] font-medium uppercase"
            style={{ color: "rgba(135,153,223,0.6)", letterSpacing: "0.2em" }}
          >
            Powered by Election Commission
          </p>
        </div>
      </div>

      {/* Decorative blurs */}
      <div
        className="absolute bottom-[-5%] left-[-5%] w-64 h-64 rounded-full pointer-events-none"
        style={{ backgroundColor: "rgba(253,171,18,0.05)", filter: "blur(100px)" }}
      />
    </main>
  );
}
