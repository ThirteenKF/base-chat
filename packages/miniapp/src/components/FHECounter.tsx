"use client";

import { useCallback, useState, useEffect } from "react";
import { cofhejs, Encryptable, FheTypes } from "cofhejs/web";
import { useReadContract, useWriteContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contracts/deployedContracts";

// Simple SVG Icons
const LockClosedIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const LockOpenIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
    />
  </svg>
);

/**
 * useDecryptValue Hook
 *
 * A hook to manage the decryption of encrypted values from the blockchain.
 */
function useDecryptValue<T extends FheTypes>(
  fheType: T,
  ctHash: bigint | null | undefined
) {
  const [result, setResult] = useState<{
    state: "no-data" | "encrypted" | "pending" | "success" | "error";
    value?: string;
    error?: string;
  }>({ state: ctHash ? "encrypted" : "no-data" });

  useEffect(() => {
    if (ctHash) {
      setResult({ state: "encrypted" });
    } else {
      setResult({ state: "no-data" });
    }
  }, [ctHash]);

  const onDecrypt = useCallback(async () => {
    if (!ctHash) return;

    setResult({ state: "pending" });
    try {
      const decryptedValue = await cofhejs.unseal(ctHash, fheType);
      console.log({ decryptedValue });
      setResult({ state: "success", value: decryptedValue.data!.toString() });
    } catch (error) {
      console.error("Decryption error:", error);
      setResult({
        state: "error",
        error: error instanceof Error ? error.message : "Failed to decrypt",
      });
    }
  }, [ctHash, fheType]);
  console.log(result);

  return { onDecrypt, result };
}

/**
 * EncryptedValue Component
 *
 * Displays an encrypted value with decrypt functionality.
 * Note: Permit handling is done by parent component.
 */
interface EncryptedValueProps<T extends FheTypes> {
  fheType: T;
  ctHash: bigint | null | undefined;
  label: string;
}

const EncryptedValue = <T extends FheTypes>({
  label,
  fheType,
  ctHash,
}: EncryptedValueProps<T>) => {
  const { onDecrypt, result } = useDecryptValue(fheType, ctHash);

  return (
    <div
      className="flex flex-row items-center justify-start p-1 pl-4 gap-2 flex-1 bg-gray-800/50 min-h-12"
      style={{ borderRadius: "0" }}
    >
      <span className="text-xs font-semibold text-white font-(family-name:--font-clash)">
        {label}
      </span>
      {result.state === "no-data" && (
        <span className="text-xs font-semibold flex-1 italic text-gray-400 font-(family-name:--font-clash)">
          No data
        </span>
      )}
      {result.state === "encrypted" && (
        <button
          className="btn btn-sm flex-1 px-4 py-2 font-semibold uppercase tracking-widest transition-all font-(family-name:--font-clash) hover:opacity-80"
          style={{
            backgroundColor: "#FFFFFF",
            color: "#011623",
            border: "none",
            borderRadius: "0",
          }}
          onClick={onDecrypt}
        >
          <LockClosedIcon className="w-5 h-5" aria-hidden="true" />
          <span className="flex flex-1 items-center justify-center">
            <span>Encrypted</span>
          </span>
        </button>
      )}
      {result.state === "pending" && (
        <button
          className="btn btn-sm flex-1 px-4 py-2 font-semibold uppercase tracking-widest cursor-not-allowed font-(family-name:--font-clash) opacity-50"
          style={{
            backgroundColor: "#FFFFFF",
            color: "#011623",
            border: "none",
            borderRadius: "0",
          }}
          disabled
        >
          <span className="inline-block w-4 h-4 border-2 border-fhenix-dark border-t-transparent rounded-full animate-spin"></span>
          Decrypting
        </button>
      )}

      {result.state === "success" && (
        <div
          className="flex flex-1 px-4 items-center justify-center gap-2 h-10 bg-green-500/10 border-green-500 border-2 border-solid"
          style={{ borderRadius: "0" }}
        >
          <LockOpenIcon className="w-5 h-5 text-green-500" aria-hidden="true" />
          <div className="flex flex-1 items-center justify-center">
            <span className="text-white font-(family-name:--font-clash)">
              {result.value}
            </span>
          </div>
        </div>
      )}
      {result.state === "error" && (
        <span className="text-xs text-yellow-500 font-semibold flex-1 italic font-(family-name:--font-clash)">
          {result.error}
        </span>
      )}
    </div>
  );
};

/**
 * FHECounterComponent - A demonstration of Fully Homomorphic Encryption (FHE) in a web application
 *
 * This component showcases how to:
 * 1. Read encrypted values from a smart contract
 * 2. Display encrypted values using a specialized component
 * 3. Encrypt user input before sending to the blockchain
 * 4. Interact with FHE-enabled smart contracts
 *
 * The counter value is stored as an encrypted uint32 on the blockchain,
 * meaning the actual value is never revealed on-chain.
 */

export const FHECounter = () => {
  return (
    <div
      className="flex flex-col px-8 py-8 items-center gap-4"
      style={{ backgroundColor: "#122531" }}
    >
      <h2 className="text-xl font-semibold text-white font-(family-name:--font-clash) text-center">
        FHE Counter
      </h2>

      <SetCounterRow />
      <div className="flex flex-row w-full gap-3">
        <IncrementButton />
        <DecrementButton />
      </div>
      <EncryptedCounterDisplay />
    </div>
  );
};

/**
 * SetCounterRow Component
 *
 * Demonstrates the process of encrypting user input before sending it to the blockchain:
 * 1. User enters a number in the input field
 * 2. When "Set" is clicked, the number is encrypted using cofhejs
 * 3. The encrypted value is then sent to the smart contract
 *
 * This ensures the actual value is never exposed on the blockchain,
 * maintaining privacy while still allowing computations.
 */
const SetCounterRow = () => {
  const [input, setInput] = useState<string>("");
  const [isEncryptingInput, setIsEncryptingInput] = useState<boolean>(false);
  const { writeContract, isPending } = useWriteContract();

  const handleReset = useCallback(async () => {
    if (input === "") return;

    setIsEncryptingInput(true);
    try {
      const encryptedInput = await cofhejs.encrypt([
        Encryptable.uint32(input),
      ] as const);

      console.log(encryptedInput);

      // Submit to contract
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "reset",
        args: [encryptedInput.data?.[0]],
      });
    } catch (error) {
      console.error("Error writing to contract:", error);
    } finally {
      setIsEncryptingInput(false);
    }
  }, [input, writeContract]);

  const pending = isPending || isEncryptingInput;

  return (
    <div className="flex flex-row w-full gap-3">
      <div className="flex-1">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a number"
          className="w-full px-4 py-3 bg-gray-800 text-white border-0 focus:outline-none font-(family-name:--font-clash)"
          style={{ borderRadius: "0" }}
        />
      </div>
      <button
        className={`px-6 py-3 font-semibold uppercase tracking-widest transition-all font-(family-name:--font-clash) ${
          pending || input === ""
            ? "opacity-50 cursor-not-allowed"
            : "hover:opacity-80"
        }`}
        style={{
          backgroundColor: "#FFFFFF",
          color: "#011623",
          border: "none",
          borderRadius: "0",
        }}
        onClick={handleReset}
        disabled={pending || input === ""}
      >
        {pending && (
          <span className="inline-block w-4 h-4 border-2 border-fhenix-dark border-t-transparent rounded-full animate-spin mr-2"></span>
        )}
        Reset
      </button>
    </div>
  );
};

/**
 * IncrementButton Component
 *
 * Demonstrates a simple operation on encrypted data.
 * The smart contract handles the increment operation on the encrypted value
 * without ever decrypting it, showcasing the power of FHE.
 */
const IncrementButton = () => {
  const { writeContract, isPending } = useWriteContract();

  const handleIncrement = useCallback(() => {
    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "increment",
    });
  }, [writeContract]);

  return (
    <button
      className={`px-6 py-3 font-semibold uppercase tracking-widest transition-all flex-1 font-(family-name:--font-clash) ${
        isPending ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
      }`}
      style={{
        backgroundColor: "#FFFFFF",
        color: "#011623",
        border: "none",
        borderRadius: "0",
      }}
      onClick={handleIncrement}
      disabled={isPending}
    >
      {isPending && (
        <span className="inline-block w-4 h-4 border-2 border-fhenix-dark border-t-transparent rounded-full animate-spin mr-2"></span>
      )}
      Increment
    </button>
  );
};

/**
 * DecrementButton Component
 *
 * Similar to IncrementButton, this demonstrates another operation
 * that can be performed on encrypted data without decryption.
 * The smart contract handles the decrement operation while maintaining
 * the privacy of the actual value.
 */
const DecrementButton = () => {
  const { writeContract, isPending } = useWriteContract();

  const handleDecrement = useCallback(() => {
    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "decrement",
    });
  }, [writeContract]);

  return (
    <button
      className={`px-6 py-3 font-semibold uppercase tracking-widest transition-all flex-1 font-(family-name:--font-clash) ${
        isPending ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
      }`}
      style={{
        backgroundColor: "#FFFFFF",
        color: "#011623",
        border: "none",
        borderRadius: "0",
      }}
      onClick={handleDecrement}
      disabled={isPending}
    >
      {isPending && (
        <span className="inline-block w-4 h-4 border-2 border-fhenix-dark border-t-transparent rounded-full animate-spin mr-2"></span>
      )}
      Decrement
    </button>
  );
};

/**
 * EncryptedCounterDisplay Component
 *
 * A reusable component that handles reading and displaying encrypted counter values.
 * This component demonstrates:
 * 1. How to read encrypted data from a smart contract
 * 2. How to display encrypted values using the EncryptedValue component
 * 3. The pattern for handling encrypted data in the UI
 *
 * @returns A component that displays the current encrypted counter value
 */
const EncryptedCounterDisplay = () => {
  // Reading encrypted data from the smart contract
  // The 'count' value is returned as an encrypted euint32
  // We use EncryptedValue component to display it, which handles decryption
  const { data: count } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "count",
  });

  return (
    <div className="w-full">
      <p className="text-sm text-white font-(family-name:--font-clash) mb-2">
        Counter Value:
      </p>
      <div className="flex flex-row w-full gap-3">
        <EncryptedValue
          fheType={FheTypes.Uint32}
          ctHash={count as bigint | undefined}
          label="Count"
        />
      </div>
    </div>
  );
};
