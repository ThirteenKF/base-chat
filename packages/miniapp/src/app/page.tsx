"use client";
import { useEffect } from "react";
import { useQuickAuth, useMiniKit } from "@coinbase/onchainkit/minikit";
import { ConnectWalletButton } from "../components/ConnectWalletButton";

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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-fhenix-dark via-slate-950 to-fhenix-dark p-6">
      <div className="w-full max-w-2xl">
        <div className="space-y-8 text-center">
          {/* Decorative glow effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-96 bg-fhenix-cyan/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-(family-name:--font-clash)">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-fhenix-cyan to-white">
                FHENIX MINIAPP DEMO
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl mx-auto">
              Hey {context?.user?.displayName || "there"}! Experience
              confidential computing powered by{" "}
              <span className="text-fhenix-cyan font-semibold">
                Fully Homomorphic Encryption
              </span>
              .
            </p>

            <div className="pt-4 flex justify-center">
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
