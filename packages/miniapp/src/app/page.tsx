"use client";
import { useEffect } from "react";
import { useQuickAuth, useMiniKit } from "@coinbase/onchainkit/minikit";
import { ConnectWalletButton } from "../components/ConnectWalletButton";
import { Footer } from "../components/Footer";
import Image from "next/image";

interface AuthResponse {
  success: boolean;
  user?: {
    fid: number; // FID is the unique identifier for the user
    issuedAt?: number;
    expiresAt?: number;
  };
  message?: string; // Error messages come as 'message' not 'error'
}

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();

  // Initialize the  miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // If you need to verify the user's identity, you can use the useQuickAuth hook.
  // This hook will verify the user's signature and return the user's FID. You can update
  // this to meet your needs. See the /app/api/auth/route.ts file for more details.
  // Note: If you don't need to verify the user's identity, you can get their FID and other user data
  // via `context.user.fid`.
  // const { data, isLoading, error } = useQuickAuth<{
  //   userFid: string;
  // }>("/api/auth");

  const {
    data: _authData,
    isLoading: _isAuthLoading,
    error: _authError,
  } = useQuickAuth<AuthResponse>("/api/auth", { method: "GET" });

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-fhenix-dark via-slate-950 to-fhenix-dark">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="space-y-8 text-center">
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col items-center justify-center gap-10">
                <Image
                  src="/fhenix_logo_dark.svg"
                  alt="Fhenix"
                  width={400}
                  height={100}
                  className="w-80 md:w-96"
                />
                <h1 className="text-2xl md:text-4xl font-semibold tracking-tight font-(family-name:--font-clash)">
                  <span style={{ color: "#0AD9DC" }}>MINIAPP</span>{" "}
                  <span className="text-white">DEMO</span>
                </h1>
              </div>

              <p className="text-lg md:text-xl text-white leading-relaxed max-w-xl mx-auto font-(family-name:--font-geist)">
                Hey {context?.user?.displayName || "there"}! Experience
                confidential computing powered by Fully Homomorphic Encryption.
              </p>

              <div className="pt-4 flex justify-center">
                <ConnectWalletButton />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
