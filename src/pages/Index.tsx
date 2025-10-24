import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  image?: string;
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
}

const themeColors = [
  { name: 'Темная', bg: '#17181C', panel: '#212226', card: '#2C2D32', text: '#E4E4E7', textMuted: '#A1A1AA' },
  { name: 'Синяя', bg: '#0F1419', panel: '#1A1F2E', card: '#252D3F', text: '#E1E8F0', textMuted: '#8B95A8' },
  { name: 'Зеленая', bg: '#0E1512', panel: '#1A2420', card: '#253329', text: '#E0F0E8', textMuted: '#8CA89A' },
  { name: 'Фиолетовая', bg: '#14111C', panel: '#221D2E', card: '#2F2940', text: '#E8E4F0', textMuted: '#9D94AA' },
];

export default function Index() {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('tutibot-chats');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'Основной чат', messages: [] }];
  });
  const [activeChat, setActiveChat] = useState('1');
  const [inputValue, setInputValue] = useState('');
  const [botName, setBotName] = useState(() => localStorage.getItem('tutibot-name') || 'TuTiBot');
  const [botAvatar, setBotAvatar] = useState(() => localStorage.getItem('tutibot-avatar') || '🤖');
  const [userName, setUserName] = useState(() => localStorage.getItem('user-name') || 'Пользователь');
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('user-avatar') || '👤');
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(c => c.id === activeChat);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  useEffect(() => {
    const theme = themeColors[selectedTheme];
    document.documentElement.style.setProperty('--bg-primary', theme.bg);
    document.documentElement.style.setProperty('--bg-secondary', theme.panel);
    document.documentElement.style.setProperty('--bg-card', theme.card);
    document.documentElement.style.setProperty('--text-primary', theme.text);
    document.documentElement.style.setProperty('--text-muted', theme.textMuted);
  }, [selectedTheme]);

  useEffect(() => {
    localStorage.setItem('tutibot-chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('tutibot-name', botName);
    localStorage.setItem('tutibot-avatar', botAvatar);
    localStorage.setItem('user-name', userName);
    localStorage.setItem('user-avatar', userAvatar);
  }, [botName, botAvatar, userName, userAvatar]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { ...chat, messages: [...chat.messages, newMessage] }
        : chat
    ));

    const messageText = inputValue;
    const hasImage = !!selectedImage;
    setInputValue('');
    setSelectedImage(null);
    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/8cfdcc3e-db57-4ccb-a57f-682fdefa729a', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: messageText,
            hasImage: hasImage
          })
        });

        const data = await response.json();
        
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response || getBotResponse(messageText, hasImage),
          sender: 'bot',
          timestamp: new Date()
        };

        setChats(prev => prev.map(chat => 
          chat.id === activeChat 
            ? { ...chat, messages: [...chat.messages, botResponse] }
            : chat
        ));
      } catch (error) {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: getBotResponse(messageText, hasImage),
          sender: 'bot',
          timestamp: new Date()
        };

        setChats(prev => prev.map(chat => 
          chat.id === activeChat 
            ? { ...chat, messages: [...chat.messages, botResponse] }
            : chat
        ));
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  const getBotResponse = (userMessage: string, hasImage: boolean): string => {
    if (hasImage) {
      return '🖼️ Вижу изображение! Я анализирую его... На фото я вижу интересные детали. Что именно тебя интересует?';
    }

    const lower = userMessage.toLowerCase();
    
    if (lower.includes('привет') || lower.includes('здравствуй')) {
      return `Привет! Я ${botName}, твой ИИ-ассистент. Чем могу помочь?`;
    }
    if (lower.includes('как дела')) {
      return 'Отлично работаю! Готов помочь тебе 24/7 🚀';
    }
    if (lower.includes('помощь') || lower.includes('команды')) {
      return 'Я могу:\n• Отвечать на вопросы\n• Анализировать текст и фото\n• Запоминать команды\n• Помогать с задачами\n• Экспортировать историю';
    }
    
    return 'Понял тебя! Обрабатываю запрос... 🤔';
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      name: `Чат ${chats.length + 1}`,
      messages: []
    };
    setChats(prev => [...prev, newChat]);
    setActiveChat(newChat.id);
    setIsSidebarOpen(false);
    toast.success('Новый чат создан');
  };

  const restartBot = () => {
    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { ...chat, messages: [] }
        : chat
    ));
    toast.success('Чат очищен');
  };

  const exportChat = () => {
    if (!currentChat) return;
    
    const chatText = currentChat.messages.map(msg => 
      `[${msg.timestamp.toLocaleString('ru-RU')}] ${msg.sender === 'user' ? userName : botName}: ${msg.text}`
    ).join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChat.name}_${new Date().toLocaleDateString('ru-RU')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('История экспортирована');
  };

  const deleteChat = (chatId: string) => {
    if (chats.length === 1) {
      toast.error('Нельзя удалить последний чат');
      return;
    }
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChat === chatId) {
      setActiveChat(chats[0].id);
    }
    toast.success('Чат удален');
  };

  return (
    <div className="flex h-screen" style={{ 
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <div className="w-80 flex flex-col" style={{ 
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div className="p-4 flex items-center justify-between" style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{botAvatar}</div>
            <div>
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{botName}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Онлайн</p>
            </div>
          </div>
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-white/5">
                <Icon name="Settings" size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-96 border-l border-white/10" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <SheetHeader>
                <SheetTitle style={{ color: 'var(--text-primary)' }}>Настройки</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <Label style={{ color: 'var(--text-primary)' }}>Аватар бота</Label>
                  <Input 
                    value={botAvatar}
                    onChange={(e) => setBotAvatar(e.target.value)}
                    className="mt-2 border-white/10"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    placeholder="🤖"
                  />
                </div>
                <div>
                  <Label style={{ color: 'var(--text-primary)' }}>Имя бота</Label>
                  <Input 
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="mt-2 border-white/10"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'var(--text-primary)' }}>Ваш аватар</Label>
                  <Input 
                    value={userAvatar}
                    onChange={(e) => setUserAvatar(e.target.value)}
                    className="mt-2 border-white/10"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    placeholder="👤"
                  />
                </div>
                <div>
                  <Label style={{ color: 'var(--text-primary)' }}>Ваш никнейм</Label>
                  <Input 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="mt-2 border-white/10"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'var(--text-primary)' }} className="mb-3 block">Тема оформления</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {themeColors.map((theme, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTheme(idx)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedTheme === idx ? 'border-blue-500' : 'border-white/10'
                        }`}
                        style={{ backgroundColor: theme.bg }}
                      >
                        <div className="text-sm font-medium" style={{ color: theme.text }}>{theme.name}</div>
                        <div className="flex gap-1 mt-2">
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.panel }} />
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.card }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`group relative transition-colors ${
                activeChat === chat.id ? 'bg-white/5' : 'hover:bg-white/[0.02]'
              }`}
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
            >
              <button
                onClick={() => setActiveChat(chat.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon name="MessageSquare" size={20} className="text-blue-400" />
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{chat.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {chat.messages.length} сообщений
                    </div>
                  </div>
                  {chats.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity"
                    >
                      <Icon name="Trash2" size={16} className="text-red-400" />
                    </button>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 space-y-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <Button onClick={createNewChat} className="w-full bg-blue-600 hover:bg-blue-700">
            <Icon name="Plus" size={20} className="mr-2" />
            Новый чат
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={restartBot} variant="outline" className="border-white/10 hover:bg-white/5" style={{ color: 'var(--text-primary)' }}>
              <Icon name="RotateCcw" size={18} className="mr-1" />
              Очистить
            </Button>
            <Button onClick={exportChat} variant="outline" className="border-white/10 hover:bg-white/5" style={{ color: 'var(--text-primary)' }}>
              <Icon name="Download" size={18} className="mr-1" />
              Экспорт
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-16 flex items-center justify-between px-6" style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div>
            <h1 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{currentChat?.name}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isProcessing ? 'Печатает...' : 'ИИ ассистент активен'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentChat?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">{botAvatar}</div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{botName}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Напиши что-нибудь или прикрепи фото</p>
              </div>
            </div>
          ) : (
            currentChat?.messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 animate-fade-in ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="text-2xl flex-shrink-0">
                  {message.sender === 'user' ? userAvatar : botAvatar}
                </div>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.sender === 'user' ? 'bg-blue-600 ml-auto' : ''
                  }`}
                  style={message.sender === 'bot' ? { backgroundColor: 'var(--bg-card)' } : {}}
                >
                  {message.image && (
                    <img src={message.image} alt="Uploaded" className="rounded-lg mb-2 max-w-full max-h-64 object-contain" />
                  )}
                  <p className="whitespace-pre-wrap" style={{ color: message.sender === 'user' ? '#fff' : 'var(--text-primary)' }}>
                    {message.text}
                  </p>
                  <p className="text-xs mt-1" style={{ color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                    {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4" style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img src={selectedImage} alt="Selected" className="h-20 rounded-lg" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex-shrink-0 hover:bg-white/5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="Paperclip" size={20} />
            </Button>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Напишите сообщение..."
              className="flex-1 text-base h-12 border-white/10"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
              disabled={isProcessing}
            />
            <Button 
              onClick={sendMessage}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 px-8 h-12 text-base font-medium"
            >
              <Icon name="Send" size={20} className="mr-2" />
              Отправить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}