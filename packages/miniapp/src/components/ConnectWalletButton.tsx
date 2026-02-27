'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { ethers } from 'ethers';
import { EncryptedBaseChatABI } from './contract/EncryptedBaseChatABI';
import { useFhenix } from './fhenix-provider';

// Адрес контракта из Remix
const CONTRACT_ADDRESS = '0x735fa4a10108fac3a89BD95B7d3Fe24232DA3f1';

// Типы для языков
type Language = 'en' | 'ru' | 'zh';

// Переводы интерфейса
const translations = {
  en: {
    appName: 'Base Chat',
    connectWallet: '🔌 Connect Wallet',
    disconnect: 'Disconnect',
    connected: '✅ Connected',
    walletAddress: 'Wallet address',
    recipientPlaceholder: 'Enter recipient address (0x...)',
    addContact: '➕ Add contact',
    contactName: 'Contact name',
    contactAddress: 'Wallet address (0x...)',
    save: 'Save',
    cancel: 'Cancel',
    contacts: 'CONTACTS',
    noContacts: 'No contacts\nClick "➕ Add contact"',
    sendTo: 'Send to:',
    validAddress: '✅ address',
    noMessages: '💬 No messages. Write something!',
    enterRecipient: '👈 Enter recipient address',
    messagePlaceholder: {
      notConnected: 'Connect wallet first',
      noRecipient: 'Enter recipient address',
      sending: 'Sending...',
      default: 'Write a message...'
    },
    send: 'Send',
    gasInfo: '⚡ Base Sepolia • Each message requires gas',
    sending: '⏳',
    sent: '🕒',
    confirmed: '✅',
    language: 'Language',
    english: 'English',
    russian: 'Russian',
    chinese: 'Chinese',
    fheReady: '🔐 FHE Ready',
    fheInit: '⏳ FHE Initializing...',
    fheState: 'State:',
    searchPlaceholder: 'Search contacts...',
    clearSearch: 'Clear',
    newChat: 'New Chat',
    online: 'online',
    lastSeen: 'last seen',
    encrypting: 'Encrypting...',
    sent: 'Sent',
    delivered: 'Delivered',
    read: 'Read',
    newMessage: 'New message!'
  },
  ru: {
    appName: 'Base Chat',
    connectWallet: '🔌 Подключить кошелек',
    disconnect: 'Отключить',
    connected: '✅ Подключено',
    walletAddress: 'Адрес кошелька',
    recipientPlaceholder: 'Введите адрес получателя (0x...)',
    addContact: '➕ Добавить контакт',
    contactName: 'Имя контакта',
    contactAddress: 'Адрес кошелька (0x...)',
    save: 'Сохранить',
    cancel: 'Отмена',
    contacts: 'КОНТАКТЫ',
    noContacts: 'Нет контактов\nНажмите "➕ Добавить контакт"',
    sendTo: 'Кому отправить:',
    validAddress: '✅ адрес',
    noMessages: '💬 Нет сообщений. Напишите что-нибудь!',
    enterRecipient: '👈 Введите адрес получателя',
    messagePlaceholder: {
      notConnected: 'Сначала подключите кошелек',
      noRecipient: 'Введите адрес получателя',
      sending: 'Отправка...',
      default: 'Напишите сообщение...'
    },
    send: 'Отправить',
    gasInfo: '⚡ Base Sepolia • Каждое сообщение требует газ',
    sending: '⏳',
    sent: '🕒',
    confirmed: '✅',
    language: 'Язык',
    english: 'Английский',
    russian: 'Русский',
    chinese: 'Китайский',
    fheReady: '🔐 FHE Ready',
    fheInit: '⏳ FHE инициализация...',
    fheState: 'Состояние:',
    searchPlaceholder: 'Поиск контактов...',
    clearSearch: 'Сбросить',
    newChat: 'Новый чат',
    online: 'в сети',
    lastSeen: 'был(а)',
    encrypting: 'Шифрование...',
    sent: 'Отправлено',
    delivered: 'Доставлено',
    read: 'Прочитано',
    newMessage: 'Новое сообщение!'
  },
  zh: {
    appName: 'Base Chat',
    connectWallet: '🔌 连接钱包',
    disconnect: '断开连接',
    connected: '✅ 已连接',
    walletAddress: '钱包地址',
    recipientPlaceholder: '输入接收地址 (0x...)',
    addContact: '➕ 添加联系人',
    contactName: '联系人姓名',
    contactAddress: '钱包地址 (0x...)',
    save: '保存',
    cancel: '取消',
    contacts: '联系人',
    noContacts: '没有联系人\n点击"➕ 添加联系人"',
    sendTo: '发送给:',
    validAddress: '✅ 地址',
    noMessages: '💬 没有消息。写点什么吧！',
    enterRecipient: '👈 输入接收地址',
    messagePlaceholder: {
      notConnected: '请先连接钱包',
      noRecipient: '输入接收地址',
      sending: '发送中...',
      default: '写消息...'
    },
    send: '发送',
    gasInfo: '⚡ Base Sepolia • 每条消息都需要燃料费',
    sending: '⏳',
    sent: '🕒',
    confirmed: '✅',
    language: '语言',
    english: '英语',
    russian: '俄语',
    chinese: '中文',
    fheReady: '🔐 FHE Ready',
    fheInit: '⏳ FHE初始化...',
    fheState: '状态:',
    searchPlaceholder: '搜索联系人...',
    clearSearch: '清除',
    newChat: '新聊天',
    online: '在线',
    lastSeen: '最后在线',
    encrypting: '加密中...',
    sent: '已发送',
    delivered: '已送达',
    read: '已读',
    newMessage: '新消息！'
  }
};

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: Date;
  txHash?: string;
  status?: 'sending' | 'sent' | 'confirmed' | 'delivered' | 'read';
}

interface Contact {
  id: string;
  address: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unread?: number;
  isOnline?: boolean;
  avatar?: string;
}

export default function ChatComponent() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const { isInitialized, encrypt, unseal, createPermit, encryptionState } = useFhenix();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [language, setLanguage] = useState<Language>('ru');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Функция для сокращения адреса
  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    if (addr.length <= 20) return addr;
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  // Получение перевода
  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    if (typeof value === 'string' && params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, param) => 
        params[param]?.toString() || ''
      );
    }
    
    return typeof value === 'string' ? value : key;
  };

  // Переключение языка
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    setShowLanguageMenu(false);
  };

  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsClient(true);
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
      document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    }

    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'ru', 'zh'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }

    loadContacts();
  }, []);

  const saveContacts = (updatedContacts: Contact[]) => {
    setContacts(updatedContacts);
    localStorage.setItem('contacts', JSON.stringify(updatedContacts));
  };

  const loadContacts = () => {
    const saved = localStorage.getItem('contacts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const contactsWithDates = parsed.map((c: any) => ({
          ...c,
          lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime) : undefined
        }));
        setContacts(contactsWithDates);
      } catch (e) {
        setContacts([]);
      }
    } else {
      setContacts([]);
    }
  };

  useEffect(() => {
    if (walletClient && CONTRACT_ADDRESS && CONTRACT_ADDRESS.startsWith('0x')) {
      try {
        const provider = new ethers.providers.Web3Provider(walletClient.transport);
        const signer = provider.getSigner();
        
        const chatContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          EncryptedBaseChatABI,
          signer
        );
        
        setContract(chatContract);
        console.log('✅ Контракт инициализирован');
      } catch (error) {
        console.error('❌ Ошибка инициализации контракта:', error);
      }
    }
  }, [walletClient]);

  const connectWallet = async (walletType: 'rabby' | 'metamask') => {
    setIsLoading(true);
    try {
      if (walletType === 'rabby') {
        await connect({ connector: injected({ target: 'rabby' }) });
      } else {
        await connect({ connector: injected({ target: 'metaMask' }) });
      }
    } catch (error) {
      console.error('Ошибка подключения:', error);
    } finally {
      setIsLoading(false);
      setShowWalletMenu(false);
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setContract(null);
    setMessages([]);
  };

  const loadMessages = async () => {
    if (!contract || !address || !recipient) return;
    
    setIsLoading(true);
    try {
      const conversation = await contract.getConversation(address, recipient);
      
      const loadedMessages: Message[] = [];
      let currentMessage = '';
      let messageId = 0;
      let lastTimestamp = new Date();
      
      for (let i = 0; i < conversation.length; i++) {
        const msg = conversation[i];
        
        if (isInitialized && (msg.sender.toLowerCase() === address?.toLowerCase() || 
            msg.recipient.toLowerCase() === address?.toLowerCase())) {
          try {
            const permit = await createPermit();
            const encryptedData = msg.encryptedContent || msg.content;
            const decryptedValue = await unseal(encryptedData, 'uint32');
            
            if (typeof decryptedValue === 'number' && decryptedValue > 0) {
              currentMessage += String.fromCharCode(decryptedValue);
              lastTimestamp = new Date(Number(msg.timestamp) * 1000);
              
              if (currentMessage.length >= 20 || i === conversation.length - 1) {
                if (currentMessage.length > 0) {
                  loadedMessages.push({
                    id: messageId++,
                    sender: msg.sender,
                    content: currentMessage,
                    timestamp: lastTimestamp,
                    status: 'confirmed'
                  });
                  currentMessage = '';
                }
              }
            }
          } catch (e) {
            console.log('⚠️ Не удалось расшифровать символ:', e);
          }
        }
      }
      
      // Проверяем, есть ли новые сообщения
      if (loadedMessages.length > messages.length) {
        console.log('📨 Обнаружены новые сообщения!');
        
        // Если это не текущий чат, увеличиваем счетчик непрочитанных
        if (recipient && selectedContact) {
          const lastMessage = loadedMessages[loadedMessages.length - 1];
          if (lastMessage.sender.toLowerCase() !== address?.toLowerCase()) {
            updateUnreadCount(recipient);
          }
        }
      }
      
      setMessages(loadedMessages);
      setLastMessageCount(loadedMessages.length);
      
      if (loadedMessages.length > 0 && selectedContact) {
        updateContactLastMessage(selectedContact, loadedMessages[loadedMessages.length - 1].content);
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки сообщений:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUnreadCount = (contactAddress: string) => {
    if (contactAddress !== recipient) { // Если не текущий чат
      setContacts(prev => prev.map(c => 
        c.address.toLowerCase() === contactAddress.toLowerCase()
          ? { ...c, unread: (c.unread || 0) + 1 }
          : c
      ));
    }
  };

  const updateContactLastMessage = (contactId: string, message: string) => {
    const updatedContacts = contacts.map(c => 
      c.id === contactId 
        ? { ...c, lastMessage: message, lastMessageTime: new Date() }
        : c
    );
    saveContacts(updatedContacts);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !recipient.trim() || !contract) {
      alert('Введите адрес получателя и сообщение');
      return;
    }

    if (!ethers.utils.isAddress(recipient)) {
      alert('Введите корректный адрес кошелька');
      return;
    }

    if (!isInitialized) {
      alert('Fhenix инициализируется, подождите...');
      return;
    }

    setIsSending(true);

    const tempId = Date.now();
    const tempMessage: Message = {
      id: tempId,
      sender: address || 'unknown',
      content: newMessage,
      timestamp: new Date(),
      status: 'sending'
    };
    
    setMessages([...messages, tempMessage]);
    const originalMessage = newMessage;
    setNewMessage('');

    try {
      const chars = originalMessage.split('').map(c => c.charCodeAt(0));
      
      const encryptedValues = [];
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const encryptedValue = await encrypt(char, 'uint32');
        encryptedValues.push(encryptedValue);
      }
      
      const permit = await createPermit(recipient);
      
      const tx = await contract.sendBatchMessages(recipient, encryptedValues);
      const receipt = await tx.wait();
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'confirmed', txHash: receipt.transactionHash } : msg
      ));
      
      if (selectedContact) {
        updateContactLastMessage(selectedContact, originalMessage);
      }
      
      // Сбрасываем счетчик непрочитанных для этого контакта
      setContacts(prev => prev.map(c => 
        c.address.toLowerCase() === recipient.toLowerCase()
          ? { ...c, unread: 0 }
          : c
      ));
      
    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert('Ошибка при отправке: ' + (error as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  const selectContact = (contact: Contact) => {
    setRecipient(contact.address);
    setRecipientInput(contact.address);
    setSelectedContact(contact.id);
    
    // Сбрасываем счетчик непрочитанных при выборе контакта
    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, unread: 0 } : c
    ));
    
    loadMessages();
  };

  const addContact = () => {
    if (!newContactName.trim() || !newContactAddress.trim()) {
      alert('Заполните имя и адрес контакта');
      return;
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      address: newContactAddress,
      name: newContactName,
      lastMessageTime: new Date(),
      unread: 0,
      isOnline: false
    };

    const updatedContacts = [newContact, ...contacts];
    saveContacts(updatedContacts);
    
    setNewContactName('');
    setNewContactAddress('');
    setShowContactModal(false);
    
    selectContact(newContact);
  };

  const deleteContact = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Удалить контакт?')) {
      const updatedContacts = contacts.filter(c => c.id !== contactId);
      saveContacts(updatedContacts);
      
      if (selectedContact === contactId) {
        setSelectedContact(null);
        setRecipient('');
        setRecipientInput('');
        setMessages([]);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    document.body.classList.toggle('dark-theme', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🔄 АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ СООБЩЕНИЙ
  useEffect(() => {
    if (!contract || !address || !recipient) return;
    
    console.log('🔄 Запуск автообновления для чата с', recipient);
    
    // 1. Слушаем события контракта (реальное время)
    const filter = contract.filters.MessageSent(null, address, null);
    
    const handleNewMessage = async (sender: string, _recipient: string, messageId: any) => {
      console.log('📨 Событие: новое сообщение от', sender);
      
      // Если сообщение от текущего собеседника
      if (sender.toLowerCase() === recipient?.toLowerCase()) {
        console.log('📨 Сообщение от текущего собеседника, обновляем чат');
        await loadMessages();
      } else {
        // Сообщение от другого контакта - увеличиваем счетчик
        console.log('📨 Сообщение от другого контакта:', sender);
        updateUnreadCount(sender);
      }
    };
    
    contract.on(filter, handleNewMessage);
    
    // 2. Периодическая проверка (как запасной вариант)
    const interval = setInterval(() => {
      if (recipient) {
        console.log('🔄 Фоновая проверка сообщений...');
        loadMessages();
      }
    }, 5000); // Каждые 5 секунд
    
    return () => {
      contract.off(filter, handleNewMessage);
      clearInterval(interval);
    };
  }, [contract, address, recipient]);

  // Уведомление о новых сообщениях
  useEffect(() => {
    if (messages.length > lastMessageCount && lastMessageCount > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Если сообщение не от текущего пользователя
      if (lastMessage.sender.toLowerCase() !== address?.toLowerCase()) {
        // Показываем уведомление в браузере
        if (Notification.permission === 'granted') {
          new Notification(t('newMessage'), {
            body: `${contacts.find(c => c.address === lastMessage.sender)?.name || shortenAddress(lastMessage.sender)}: ${lastMessage.content.substring(0, 30)}...`,
            icon: '/icon.png'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
        
        // Вибрируем на мобильных устройствах
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
      }
    }
  }, [messages.length]);

  if (!isClient) return null;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: isDarkTheme ? '#0A0B0D' : '#F5F7FA',
      color: isDarkTheme ? '#FFFFFF' : '#0A0B0D',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Левая панель с контактами */}
      <div style={{
        width: '320px',
        borderRight: `1px solid ${isDarkTheme ? '#2C2E35' : '#E5E7EB'}`,
        background: isDarkTheme ? '#1A1B1F' : '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Шапка левой панели */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${isDarkTheme ? '#2C2E35' : '#E5E7EB'}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#0052FF',
              margin: 0
            }}>
              {t('appName')}
            </h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Кнопка языка */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  style={{
                    background: isDarkTheme ? '#2C2E35' : '#F5F7FA',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDarkTheme ? '#FFFFFF' : '#0A0B0D'
                  }}
                >
                  {language === 'en' && '🇬🇧'}
                  {language === 'ru' && '🇷🇺'}
                  {language === 'zh' && '🇨🇳'}
                </button>
                
                {showLanguageMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: isDarkTheme ? '#1A1B1F' : '#FFFFFF',
                    border: `1px solid ${isDarkTheme ? '#2C2E35' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    marginTop: '5px',
                    overflow: 'hidden',
                    zIndex: 1000,
                    minWidth: '140px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {[
                      { code: 'en', flag: '🇬🇧', label: t('english') },
                      { code: 'ru', flag: '🇷🇺', label: t('russian') },
                      { code: 'zh', flag: '🇨🇳', label: t('chinese') }
                    ].map(item => (
                      <button
                        key={item.code}
                        onClick={() => changeLanguage(item.code as Language)}
                        style={{
                          width: '100%',
                          padding: '10px 15px',
                          background: language === item.code ? '#0052FF' : 'transparent',
                          border: 'none',
                          borderBottom: `1px solid ${isDarkTheme ? '#2C2E35' : '#E5E7EB'}`,
                          cursor: 'pointer',
                          color: language === item.code ? '#FFFFFF' : (isDarkTheme ? '#FFFFFF' : '#0A0B0D'),
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px'
                        }}
                      >
                        <span>{item.flag}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Кнопка темы */}
              <button
                onClick={toggleTheme}
                style={{
                  background: isDarkTheme ? '#2C2E35' : '#F5F7FA',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDarkTheme ? '#FFFFFF' : '#0A0B0D'
                }}
              >
                {isDarkTheme ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          {/* Кнопка подключения кошелька */}
          {!isConnected ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0052FF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                {isLoading ? '...' : t('connectWallet')}
              </button>
              
              {showWalletMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: isDarkTheme ? '#1A1B1F' : '#FFFFFF',
                  border: `1px solid ${isDarkTheme ? '#2C2E35' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  marginTop: '5px',
                  overflow: 'hidden',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <button
                    onClick={() => connectWallet('metamask')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${isDarkTheme ? '#2C2E35' : '#E5E7EB'}`,
                      cursor: 'pointer',
                      color: isDarkTheme ? '#FFFFFF' : '#0A0B0D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🦊</span>
                    MetaMask
                  </button>
                  <button
                    onClick={() => connectWallet('rabby')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: isDarkTheme ? '#FFFFFF' : '#0A0B0D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🦉</span>
                    Rabby Wallet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '15px',
              background: isDarkTheme ? '#2C2E35' : '#F5F7FA',
              borderRadius: '8px',
              border: `1px solid ${isDarkTheme ? '#3A3C45' : '#E5E7EB'}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '12px', opacity: 0.7 }}>{t('walletAddress')}</span>
                <button
                  onClick={disconnectWallet}
                  style={{
                    padding: '4px 8px',
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  {t('disconnect')}
                </button>
              </div>
              <div style={{
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: '#0052FF',
                fontSize: '12px'
              }}>
                {shortenAddress(address || '')}
              </div>
            </div>
          )}

          {/* Индикатор FHE */}
          {isConnected && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: isInitialized ? '#00aa00' : '#ffaa00',
              color: 'white',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>
                {isInitialized ? t('fheReady') : t('fheInit')}
              </span>
              {encryptionState && (
                <span style={{
                  fontSize: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '2px 6px',
                  borderRadius: '12px'
                }}>
                  {encryptionState}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Поиск и кнопка добавления */}
        <div style={{ padding: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 35px 10px 12px',
                background: isDarkTheme ? '#2C2E35' : '#F5F7FA',
                border: `1px solid ${isDarkTheme ? '#3A3C45' : '#E5E7EB'}`,
                color: isDarkTheme ? '#FFFFFF' : '#0A0B0D',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: isDarkTheme ? '#FFFFFF' : '#0A0B0D',
                  cursor: 'pointer',
                  fontSize: '14px',
                  opacity: 0.7
                }}
              >
                ✕
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowContactModal(true)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: `1px dashed ${isDarkTheme ? '#3A3C45' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: '#0052FF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <span>➕</span> {t('addContact')}
          </button>
        </div>

        {/* Список контактов */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 15px 15px 15px'
        }}>
          {filteredContacts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: isDarkTheme ? '#6B7280' : '#9CA3AF',
              padding: '40px 20px',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              {searchQuery ? t('noContacts') : t('noContacts')}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => selectContact(contact)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: selectedContact === contact.id ? '#0052FF' : (isDarkTheme ? '#2C2E35' : '#F5F7FA'),
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: `1px solid ${isDarkTheme ? '#3A3C45' : '#E5E7EB'}`,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: contact.avatar ? `url(${contact.avatar})` : '#0052FF',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {!contact.avatar && contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: 'bold',
                        color: selectedContact === contact.id ? 'white' : (isDarkTheme ? '#FFFFFF' : '#0A0B0D'),
                        marginBottom: '2px'
                      }}>
                        {contact.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: selectedContact === contact.id ? 'rgba(255,255,255,0.8)' : (isDarkTheme ? '#9CA3AF' : '#6B7280')
                      }}>
                        {shortenAddress(contact.address)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteContact(contact.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: selectedContact === contact.id ? 'white' : (isDarkTheme ? '#9CA3AF' : '#6B7280'),
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px'
                    }}
                  >
                    ×
                  </button>
                </div>
                
                {contact.lastMessage && (
                  <div style={{
                    fontSize: '13px',
                    color: selectedContact === contact.id ? 'rgba(255,255,255,0.9)' : (isDarkTheme ? '#9CA3AF' : '#6B7280'),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '4px',
                    paddingLeft: '48px'
                  }}>
                    {contact.lastMessage}
                  </div>
                )}
                
                {contact.unread ? (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '40px',
                    background: '#0052FF',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '11px'
                  }}>
                    {contact.unread}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Основная область чата */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: isDarkTheme ? '#0A0B0D' : '#F5F7FA'
      }}>
        {/* Шапка чата */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${isDarkTheme ? '#2C2E35' : '#E5E7EB'}`,
          background: isDarkTheme ? '#1A1B1F' : '#FFFFFF'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {recipient && selectedContact && (
                <>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: contacts.find(c => c.id === selectedContact)?.avatar || '#0052FF',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    {!contacts.find(c => c.id === selectedContact)?.avatar && 
                      contacts.find(c => c.id === selectedContact)?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '18px',
                      marginBottom: '4px'
                    }}>
                      {contacts.find(c => c.id === selectedContact)?.name}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: isDarkTheme ? '#9CA3AF' : '#6B7280'
                    }}>
                      {shortenAddress(recipient)}
                    </div>
                  </div>
                </>
              )}
              {!recipient && (
                <div style={{
                  fontSize: '16px',
                  color: isDarkTheme ? '#9CA3AF' : '#6B7280'
                }}>
                  {t('enterRecipient')}
                </div>
              )}
            </div>
            
            {/* Индикатор онлайн/автообновления */}
            {recipient && (
              <div style={{
                padding: '6px 12px',
                background: isDarkTheme ? '#2C2E35' : '#F5F7FA',
                borderRadius: '20px',
                fontSize: '12px',
                color: isDarkTheme ? '#9CA3AF' : '#6B7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ color: '#00aa00', fontSize: '8px' }}>●</span>
                <span>Автообновление каждые 5с</span>
              </div>
            )}
          </div>
        </div>

        {/* Сообщения */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: isDarkTheme ? '#6B7280' : '#9CA3AF',
              marginTop: '50px',
              fontStyle: 'italic'
            }}>
              {recipient ? t('noMessages') : t('enterRecipient')}
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender.toLowerCase() === address?.toLowerCase();
              
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isOwn ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    marginBottom: '4px'
                  }}
                >
                  <div style={{
                    background: isOwn ? '#0052FF' : (isDarkTheme ? '#2C2E35' : '#FFFFFF'),
                    color: isOwn ? '#FFFFFF' : (isDarkTheme ? '#FFFFFF' : '#0A0B0D'),
                    padding: '10px 15px',
                    borderRadius: isOwn 
                      ? '18px 18px 4px 18px' 
                      : '18px 18px 18px 4px',
                    border: !isOwn ? `1px solid ${isDarkTheme ? '#3A3C45' : '#E5E7EB'}` : 'none',
                    position: 'relative',
                    wordBreak: 'break-word'
                  }}>
                    <div>{msg.content}</div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '4px',
                      fontSize: '11px',
                      opacity: 0.7
                    }}>
                      <span>{msg.timestamp.toLocaleTimeString()}</span>
                      {isOwn && (
                        <span>
                          {msg.status === 'sending' && '⏳'}
                          {msg.status === 'sent' && '🕒'}
                          {msg.status === 'confirmed' && '✅'}
                        </span>
                      )}
                    </div>

                    {msg.txHash && (
                      <div
                        style={{
                          fontSize: '9px',
                          marginTop: '2px',
                          fontFamily: 'monospace',
                          opacity: 0.6,
                          cursor: 'pointer',
                          color: isOwn ? 'rgba(255,255,255,0.8)' : (isDarkTheme ? '#9CA3AF' : '#6B7280')
                        }}
                        onClick={() => window.open(`https://sepolia.basescan.org/tx/${msg.txHash}`, '_blank')}
                      >
                        {shortenAddress(msg.txHash)} 🔍
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода */}
        <div style={{
          padding: '20px',
          borderTop: `1px solid ${isDarkTheme ? '#2C2E35' : '#E5E7EB'}`,
          background: isDarkTheme ? '#1A1B1F' : '#FFFFFF'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder={
                !isConnected ? t('messagePlaceholder.notConnected') :
                !recipient ? t('messagePlaceholder.noRecipient') :
                isSending ? t('messagePlaceholder.sending') :
                !isInitialized ? '⏳ FHE Initializing...' :
                t('messagePlaceholder.default')
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isSending || !isConnected || !recipient || !isInitialized}
              maxLength={500}
              style={{
                flex: 1,
                padding: '12px',
                border: `1px solid ${isDarkTheme ? '#3A3C45' : '#E5E7EB'}`,
                borderRadius: '24px',
                background: isDarkTheme ? '#2C2E35' : '#F5F7FA',
                color: isDarkTheme ? '#FFFFFF' : '#0A0B0D',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isSending || !isConnected || !recipient || !isInitialized}
              style={{
                padding: '12px 24px',
                background: '#0052FF',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                cursor: (isSending || !isConnected || !recipient || !isInitialized) ? 'not-allowed' : 'pointer',
                opacity: (isSending || !isConnected || !recipient || !isInitialized) ? 0.5 : 1,
                fontWeight: 'bold'
              }}
            >
              {isSending ? '⛓️' : t('send')}
            </button>
          </div>
          
          <div style={{
            marginTop: '8px',
            fontSize: '11px',
            color: isDarkTheme ? '#6B7280' : '#9CA3AF',
            textAlign: 'center'
          }}>
            {t('gasInfo')} • {isInitialized ? '🔐 Сообщения шифруются' : '⏳ Инициализация FHE...'}
          </div>
        </div>
      </div>

      {/* Модальное окно добавления контакта */}
      {showContactModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: isDarkTheme ? '#1A1B1F' : '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#0052FF' }}>
              {t('addContact')}
            </h3>
            
            <input
              type="text"
              placeholder={t('contactName')}
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                background: isDarkTheme ? '#2C2E35' : '#F5F7FA',
                border: `1px solid ${isDarkTheme ? '#3A3C45' : '#E5E7EB'}`,
                color: isDarkTheme ? '#FFFFFF' : '#0A0B0D',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            
            <input
              type="text"
              placeholder={t('contactAddress')}
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '20px',
                background: isDarkTheme ? '#2C2E35' : '#F5F7FA',
                border: `1px solid ${isDarkTheme ? '#3A3C45' : '#E5E7EB'}`,
                color: isDarkTheme ? '#FFFFFF' : '#0A0B0D',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowContactModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: `1px solid ${isDarkTheme ? '#3A3C45' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDarkTheme ? '#FFFFFF' : '#0A0B0D',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={addContact}
                style={{
                  padding: '8px 16px',
                  background: '#0052FF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}