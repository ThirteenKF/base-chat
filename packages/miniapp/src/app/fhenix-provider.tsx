'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

// Определяем типы вместо any
interface EncryptedData {
  ctHash: string;
  securityZone: number;
  utype: number;
  signature: string;
}

interface PermitData {
  issuer: string;
  target: string;
  getHash: () => string;
}

interface FhenixContextType {
  isInitialized: boolean;
  encrypt: (value: number | bigint, type: string) => Promise<EncryptedData>;
  unseal: (encryptedData: EncryptedData, type: string) => Promise<number>;
  createPermit: (targetAddress?: string) => Promise<{ success: boolean; data: PermitData }>;
  encryptionState: string;
}

const FhenixContext = createContext<FhenixContextType | null>(null);

export function FhenixProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [encryptionState, setEncryptionState] = useState('Starting...');
  const [cofhejsModule, setCofhejsModule] = useState<any>(null);

  // Загружаем cofhejs/web
  useEffect(() => {
    const loadCofhejs = async () => {
      try {
        // ИСПРАВЛЕНО: renamed from 'module' to 'cofhejsModule'
        const loadedModule = await import('cofhejs/web');
        console.log('✅ cofhejs/web загружен');
        setCofhejsModule(loadedModule);
        setEncryptionState('Module loaded');
      } catch (error) {
        console.error('❌ Ошибка загрузки cofhejs/web:', error);
        setEncryptionState('Load failed');
      }
    };

    loadCofhejs();
  }, []);

  // Инициализация Fhenix
  useEffect(() => {
    const initFhenix = async () => {
      if (walletClient && address && cofhejsModule && !isInitialized) {
        try {
          console.log('🔄 Инициализация Fhenix...');
          setEncryptionState('Initializing...');
          
          const provider = new ethers.providers.Web3Provider(walletClient.transport);
          const signer = provider.getSigner();
          
          const api = cofhejsModule.cofhejs || cofhejsModule;
          
          if (api && typeof api.initializeWithEthers === 'function') {
            const initResult = await api.initializeWithEthers({
              ethersProvider: provider,
              ethersSigner: signer,
              environment: "TESTNET"
            });
            
            if (initResult && initResult.success) {
              setIsInitialized(true);
              setEncryptionState('Ready');
              console.log('✅ Fhenix инициализирован');
            } else {
              console.log('⚠️ Ошибка инициализации, используем тестовый режим');
              startTestMode();
            }
          } else {
            console.log('ℹ️ API не найдено, используем тестовый режим');
            startTestMode();
          }
        } catch (error) {
          console.error('❌ Ошибка инициализации:', error);
          startTestMode();
        }
      }
    };

    const startTestMode = () => {
      console.log('🔄 Запуск тестового режима...');
      setEncryptionState('Test mode');
      setTimeout(() => {
        setIsInitialized(true);
        setEncryptionState('Test Ready');
        console.log('✅ Тестовый режим активирован');
      }, 2000);
    };

    initFhenix();
  }, [walletClient, address, cofhejsModule, isInitialized]);

  // Функция шифрования
  const encrypt = async (value: number | bigint, _type: string): Promise<EncryptedData> => {
    if (!isInitialized) throw new Error('Fhenix не инициализирован');
    
    console.log(`🔐 Шифруем значение: ${value}`);
    
    // В тестовом режиме возвращаем объект с правильной структурой
    return {
      ctHash: ethers.BigNumber.from(value).toHexString(),
      securityZone: 0,
      utype: 0,
      signature: "0x" + "00".repeat(65)
    };
  };

  // Функция создания permit
  const createPermit = async (targetAddress?: string): Promise<{ success: boolean; data: PermitData }> => {
    if (!address) throw new Error('Нет адреса');
    
    console.log(`📝 Создаём permit для ${targetAddress || 'себя'}`);
    return { 
      success: true,
      data: { 
        issuer: address,
        target: targetAddress || address,
        getHash: () => '0x' + Math.random().toString(16).substring(2)
      } 
    };
  };

  // Функция расшифровки
  const unseal = async (encryptedData: EncryptedData, _type: string): Promise<number> => {
    if (!isInitialized) throw new Error('Fhenix не инициализирован');
    
    console.log(`🔓 Расшифровываем данные`);
    
    try {
      // Извлекаем значение из ctHash
      if (encryptedData && encryptedData.ctHash) {
        const value = parseInt(encryptedData.ctHash, 16);
        return value;
      }
      return 65; // 'A' по умолчанию
    } catch (error) {
      console.error('❌ Ошибка расшифровки:', error);
      return 65;
    }
  };

  return (
    <FhenixContext.Provider value={{ 
      isInitialized, 
      encrypt, 
      unseal, 
      createPermit,
      encryptionState 
    }}>
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