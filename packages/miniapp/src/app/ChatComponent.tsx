'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { ethers } from 'ethers';
import { BaseChatABI } from './contract/BaseChatABI';

// ВСТАВЬ СЮДА АДРЕС СВОЕГО КОНТРАКТА (из Remix)
const CONTRACT_ADDRESS = '0xc214aA9dafda6D93FA5942eB16627e11e1c363E8'; // Замени на свой адрес!

// Типы для языков
type Language = 'en' | 'ru' | 'zh';

// Переводы интерфейса
const translations = {
  en: {
    // Основные
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
    // Статусы сообщений
    sending: '⏳',
    sent: '🕒',
    confirmed: '✅',
    // Кнопки языка
    language: 'Language',
    english: 'English',
    russian: 'Russian',
    chinese: 'Chinese'
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
    chinese: 'Китайский'
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
    chinese: '中文'
  }
};

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: Date;
  txHash?: string;
  status?: 'sending' | 'sent' | 'confirmed';
}

interface Contact {
  id: string;
  address: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: Date;
}

export default function ChatComponent() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  
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
  
  // Состояния для добавления контакта
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  
  // Состояние для языка
  const [language, setLanguage] = useState<Language>('ru');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    
    // Загружаем тему из localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
      document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    }

    // Загружаем язык из localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'ru', 'zh'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }

    // Загружаем контакты
    loadContacts();
  }, []);

  // Сохранение контактов в localStorage
  const saveContacts = (updatedContacts: Contact[]) => {
    setContacts(updatedContacts);
    localStorage.setItem('contacts', JSON.stringify(updatedContacts));
  };

  // Загрузка контактов из localStorage
  const loadContacts = () => {
    const saved = localStorage.getItem('contacts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Конвертируем строки обратно в Date
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

  // Инициализация контракта
  useEffect(() => {
    if (walletClient && CONTRACT_ADDRESS !== '0x...') {
      try {
        const provider = new ethers.providers.Web3Provider(walletClient.transport);
        const signer = provider.getSigner();
        
        const chatContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          BaseChatABI,
          signer
        );
        setContract(chatContract);
      } catch (error) {
        console.error('Ошибка инициализации контракта:', error);
      }
    }
  }, [walletClient]);

  // Подключение кошелька
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

  // Отключение кошелька
  const disconnectWallet = () => {
    disconnect();
    setContract(null);
    setMessages([]);
  };

  // Загрузка сообщений
  const loadMessages = async () => {
    if (!contract || !address || !recipient) return;
    
    setIsLoading(true);
    try {
      const conversation = await contract.getConversation(address, recipient);
      
      const loadedMessages = conversation.map((msg: any, index: number) => ({
        id: index,
        sender: msg.sender,
        content: msg.content,
        timestamp: new Date(Number(msg.timestamp) * 1000),
        status: 'confirmed'
      }));
      
      setMessages(loadedMessages);
      
      // Обновляем последнее сообщение в контакте
      if (loadedMessages.length > 0 && selectedContact) {
        updateContactLastMessage(selectedContact, loadedMessages[loadedMessages.length - 1].content);
      }
      
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление последнего сообщения контакта
  const updateContactLastMessage = (contactId: string, message: string) => {
    const updatedContacts = contacts.map(c => 
      c.id === contactId 
        ? { ...c, lastMessage: message, lastMessageTime: new Date() }
        : c
    );
    saveContacts(updatedContacts);
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if (!newMessage.trim() || !recipient.trim() || !contract) {
      alert('Введите адрес получателя и сообщение');
      return;
    }

    if (!ethers.utils.isAddress(recipient)) {
      alert('Введите корректный адрес кошелька');
      return;
    }

    setIsSending(true);

    // Временное сообщение
    const tempId = Date.now();
    const tempMessage: Message = {
      id: tempId,
      sender: address || 'unknown',
      content: newMessage,
      timestamp: new Date(),
      status: 'sending'
    };
    
    setMessages([...messages, tempMessage]);
    setNewMessage('');

    try {
      const tx = await contract.sendMessage(recipient, newMessage);
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'sent', txHash: tx.hash } : msg
      ));
      
      const receipt = await tx.wait();
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'confirmed' } : msg
      ));
      
      // Обновляем последнее сообщение контакта, если он есть
      if (selectedContact) {
        updateContactLastMessage(selectedContact, newMessage);
      }
      
    } catch (error) {
      console.error('Ошибка отправки:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert('Ошибка при отправке: ' + (error as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  // Выбор контакта
  const selectContact = (contact: Contact) => {
    setRecipient(contact.address);
    setRecipientInput(contact.address);
    setSelectedContact(contact.id);
    loadMessages();
  };

  // Добавление нового контакта
  const addContact = () => {
    if (!newContactName.trim() || !newContactAddress.trim()) {
      alert('Заполните имя и адрес контакта');
      return;
    }

    if (!newContactAddress.startsWith('0x') && !newContactAddress.includes('...')) {
      alert('Введите корректный адрес (должен начинаться с 0x)');
      return;
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      address: newContactAddress,
      name: newContactName,
      lastMessageTime: new Date()
    };

    const updatedContacts = [newContact, ...contacts];
    saveContacts(updatedContacts);
    
    // Сброс формы
    setNewContactName('');
    setNewContactAddress('');
    setShowAddContact(false);
    
    // Автоматически выбираем новый контакт
    selectContact(newContact);
  };

  // Удаление контакта
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

  if (!isClient) return null;

  return (
    <div className="chat-container" style={{ display: 'flex', height: '100vh' }}>
      {/* Боковая панель с контактами */}
      <div style={{
        width: '280px',
        borderRight: '1px solid var(--border)',
        background: 'var(--message-received)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Шапка боковой панели */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h2 style={{ color: '#0052FF', fontSize: '1.3rem', margin: 0 }}>
              {t('appName')}
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Кнопка выбора языка */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                    background: 'var(--message-received)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    marginTop: '5px',
                    overflow: 'hidden',
                    zIndex: 1000,
                    minWidth: '120px'
                  }}>
                    <button
                      onClick={() => changeLanguage('en')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: language === 'en' ? '#0052FF' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        color: language === 'en' ? 'white' : 'var(--foreground)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>🇬🇧</span> {t('english')}
                    </button>
                    <button
                      onClick={() => changeLanguage('ru')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: language === 'ru' ? '#0052FF' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        color: language === 'ru' ? 'white' : 'var(--foreground)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>🇷🇺</span> {t('russian')}
                    </button>
                    <button
                      onClick={() => changeLanguage('zh')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: language === 'zh' ? '#0052FF' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: language === 'zh' ? 'white' : 'var(--foreground)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>🇨🇳</span> {t('chinese')}
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={toggleTheme}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '18px'
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
                  padding: '10px',
                  background: '#0052FF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
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
                  background: 'var(--message-received)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  marginTop: '5px',
                  overflow: 'hidden',
                  zIndex: 1000
                }}>
                  <button
                    onClick={() => connectWallet('metamask')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      color: 'var(--foreground)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🦊</span> MetaMask
                  </button>
                  <button
                    onClick={() => connectWallet('rabby')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--foreground)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🦉</span> Rabby Wallet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '10px',
              background: 'var(--background)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '12px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{t('connected')}</div>
              <div style={{ 
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: '#0052FF',
                fontSize: '11px'
              }}>
                {shortenAddress(address || '')}
              </div>
              <button
                onClick={disconnectWallet}
                style={{
                  marginTop: '8px',
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
          )}
        </div>

        {/* Кнопка добавления контакта */}
        <div style={{ padding: '15px 20px' }}>
          <button
            onClick={() => setShowAddContact(!showAddContact)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: '1px dashed var(--border)',
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
            <span style={{ fontSize: '18px' }}>➕</span> {t('addContact')}
          </button>
        </div>

        {/* Форма добавления контакта */}
        {showAddContact && (
          <div style={{
            padding: '0 20px 20px 20px',
            borderBottom: '1px solid var(--border)'
          }}>
            <input
              type="text"
              placeholder={t('contactName')}
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            />
            <input
              type="text"
              placeholder={t('contactAddress')}
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={addContact}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#0052FF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {t('save')}
              </button>
              <button
                onClick={() => {
                  setShowAddContact(false);
                  setNewContactName('');
                  setNewContactAddress('');
                }}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Список контактов */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 15px 15px 15px'
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '10px',
            color: 'var(--secondary)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {t('contacts')} ({contacts.length})
          </div>
          
          {contacts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'var(--secondary)',
              padding: '20px',
              fontSize: '13px',
              fontStyle: 'italic',
              whiteSpace: 'pre-line'
            }}>
              {t('noContacts')}
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => selectContact(contact)}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  background: selectedContact === contact.id ? '#0052FF' : 'var(--background)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
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
                  <span style={{ 
                    fontWeight: 'bold',
                    color: selectedContact === contact.id ? 'white' : 'var(--foreground)',
                    fontSize: '14px'
                  }}>
                    {contact.name}
                  </span>
                  <button
                    onClick={(e) => deleteContact(contact.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: selectedContact === contact.id ? 'white' : 'var(--secondary)',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '0 4px'
                    }}
                  >
                    ×
                  </button>
                </div>
                
                {/* Компактный адрес */}
                <div style={{ 
                  fontSize: '11px',
                  color: selectedContact === contact.id ? 'rgba(255,255,255,0.8)' : 'var(--secondary)',
                  fontFamily: 'monospace',
                  marginBottom: '4px',
                  background: selectedContact === contact.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {shortenAddress(contact.address)}
                </div>
                
                {contact.lastMessage && (
                  <div style={{ 
                    fontSize: '12px',
                    color: selectedContact === contact.id ? 'rgba(255,255,255,0.9)' : 'var(--foreground)',
                    opacity: 0.8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {contact.lastMessage}
                  </div>
                )}
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
        background: 'var(--background)'
      }}>
        {/* Шапка чата с полем ввода адреса */}
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--message-received)'
        }}>
          <div style={{ marginBottom: '10px', fontSize: '13px', color: 'var(--secondary)' }}>
            {t('sendTo')}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={t('recipientPlaceholder')}
              value={recipientInput}
              onChange={(e) => {
                setRecipientInput(e.target.value);
                setRecipient(e.target.value);
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
            {recipient && ethers.utils.isAddress(recipient) && (
              <div style={{
                padding: '4px 8px',
                background: '#00aa00',
                color: 'white',
                borderRadius: '12px',
                fontSize: '11px',
                whiteSpace: 'nowrap'
              }}>
                {t('validAddress')}
              </div>
            )}
          </div>
          
          {/* Компактное отображение выбранного контакта */}
          {recipient && selectedContact && (
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#0052FF',
              background: 'rgba(0,82,255,0.1)',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              📨 {contacts.find(c => c.id === selectedContact)?.name} • {shortenAddress(recipient)}
            </div>
          )}
        </div>
        
        {/* Сообщения */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'var(--secondary)',
              marginTop: '50px',
              fontStyle: 'italic'
            }}>
              {recipient ? t('noMessages') : t('enterRecipient')}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender.toLowerCase() === address?.toLowerCase() ? 'flex-end' : 'flex-start',
                  maxWidth: '70%'
                }}
              >
                <div style={{
                  background: msg.sender.toLowerCase() === address?.toLowerCase() 
                    ? '#0052FF' 
                    : 'var(--message-received)',
                  color: msg.sender.toLowerCase() === address?.toLowerCase() ? 'white' : 'var(--foreground)',
                  padding: '10px 15px',
                  borderRadius: msg.sender.toLowerCase() === address?.toLowerCase() 
                    ? '18px 18px 4px 18px' 
                    : '18px 18px 18px 4px',
                  border: msg.sender.toLowerCase() !== address?.toLowerCase() ? '1px solid var(--border)' : 'none'
                }}>
                  <div>{msg.content}</div>
                  
                  {/* Статус и время */}
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
                    {msg.sender.toLowerCase() === address?.toLowerCase() && (
                      <span>
                        {msg.status === 'sending' && t('sending')}
                        {msg.status === 'sent' && t('sent')}
                        {msg.status === 'confirmed' && t('confirmed')}
                      </span>
                    )}
                  </div>

                  {/* Хэш транзакции (сокращенный) */}
                  {msg.txHash && (
                    <div style={{
                      fontSize: '9px',
                      marginTop: '2px',
                      fontFamily: 'monospace',
                      opacity: 0.6,
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(`https://sepolia.basescan.org/tx/${msg.txHash}`, '_blank')}
                    >
                      {shortenAddress(msg.txHash)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Поле ввода сообщения */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--message-received)'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder={
                !isConnected ? t('messagePlaceholder.notConnected') :
                !recipient ? t('messagePlaceholder.noRecipient') :
                isSending ? t('messagePlaceholder.sending') :
                t('messagePlaceholder.default')
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isSending || !isConnected || !recipient}
              maxLength={280}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                background: 'var(--input-bg)',
                color: 'var(--foreground)',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button 
              onClick={sendMessage}
              disabled={isSending || !isConnected || !recipient}
              style={{
                padding: '12px 24px',
                background: '#0052FF',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                cursor: (isSending || !isConnected || !recipient) ? 'not-allowed' : 'pointer',
                opacity: (isSending || !isConnected || !recipient) ? 0.5 : 1,
                fontWeight: 'bold'
              }}
            >
              {isSending ? '⛓️' : t('send')}
            </button>
          </div>
          
          <div style={{
            marginTop: '8px',
            fontSize: '11px',
            color: 'var(--secondary)',
            textAlign: 'center'
          }}>
            {t('gasInfo')}
          </div>
        </div>
      </div>
    </div>
  );
}