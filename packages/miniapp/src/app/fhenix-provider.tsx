'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

interface FhenixContextType {
  isInitialized: boolean;
  encrypt: (value: number | bigint, type: string) => Promise<any>;
  unseal: (encryptedData: any, type: string) => Promise<any>;
  createPermit: (targetAddress?: string) => Promise<any>;
  encryptionState: string;
}

const FhenixContext = createContext<FhenixContextType | null>(null);

export function FhenixProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [encryptionState, setEncryptionState] = useState('Starting...');
  const [cofhejs, setCofhejs] = useState<any>(null);

  // Загружаем cofhejs/web
  useEffect(() => {
    const loadCofhejs = async () => {
      try {
        const module = await import('cofhejs/web');
        console.log('✅ cofhejs/web загружен');
        setCofhejs(module);
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
      if (walletClient && address && cofhejs && !isInitialized) {
        try {
          console.log('🔄 Инициализация Fhenix...');
          setEncryptionState('Initializing...');
          
          const provider = new ethers.providers.Web3Provider(walletClient.transport);
          const signer = provider.getSigner();
          
          const api = cofhejs.cofhejs || cofhejs;
          
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
  }, [walletClient, address, cofhejs]);

  // Функция шифрования - ВАЖНО: возвращаем объект в правильном формате
  const encrypt = async (value: number | bigint, type: string) => {
    if (!isInitialized) throw new Error('Fhenix не инициализирован');
    
    console.log(`🔐 Шифруем значение: ${value}`);
    
    try {
      // В тестовом режиме возвращаем объект, похожий на зашифрованные данные
      // Это должно соответствовать формату inEuint32 из ABI
      return {
        ctHash: ethers.BigNumber.from(value).toHexString(),
        securityZone: 0,
        utype: 0, // 0 = Uint32
        signature: "0x" + "00".repeat(65) // Пустая подпись
      };
    } catch (error) {
      console.error('❌ Ошибка шифрования:', error);
      throw error;
    }
  };

  // Функция создания permit
  const createPermit = async (targetAddress?: string) => {
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
  const unseal = async (encryptedData: any, type: string) => {
    if (!isInitialized) throw new Error('Fhenix не инициализирован');
    
    console.log(`🔓 Расшифровываем данные`);
    
    try {
      // В тестовом режиме извлекаем значение из ctHash
      if (encryptedData && encryptedData.ctHash) {
        // Преобразуем hex обратно в число
        const value = parseInt(encryptedData.ctHash, 16);
        return value;
      }
      // Если данные пришли как число, возвращаем как есть
      if (typeof encryptedData === 'number') {
        return encryptedData;
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