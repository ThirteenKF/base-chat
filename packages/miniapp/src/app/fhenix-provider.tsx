'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';

interface FhenixContextType {
  isInitialized: boolean;
  encrypt: (value: number, type: string) => Promise<any>;
  unseal: (sealedData: any) => Promise<any>;
}

const FhenixContext = createContext<FhenixContextType | null>(null);

export function FhenixProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initFhenix = async () => {
      if (walletClient && address && !isInitialized) {
        try {
          // Пока просто эмулируем инициализацию
          console.log('Fhenix инициализация...');
          setTimeout(() => {
            setIsInitialized(true);
            console.log('Fhenix инициализирован (тестовая версия)');
          }, 1000);
        } catch (error) {
          console.error('Ошибка инициализации Fhenix:', error);
        }
      }
    };

    initFhenix();
  }, [walletClient, address]);

  const encrypt = async (value: number, type: string) => {
    if (!isInitialized) throw new Error('Fhenix не инициализирован');
    // Тестовая версия - просто возвращаем значение
    return { encrypted: value, type };
  };

  const unseal = async (sealedData: any) => {
    if (!isInitialized) throw new Error('Fhenix не инициализирован');
    // Тестовая версия - возвращаем как есть
    return sealedData.encrypted;
  };

  return (
    <FhenixContext.Provider value={{ isInitialized, encrypt, unseal }}>
      {children}
    </FhenixContext.Provider>
  );
}

export const useFhenix = () => {
  const context = useContext(FhenixContext);
  if (!context) {
    throw new Error('useFhenix must be used within FhenixProvider');
  }
  return context;
};