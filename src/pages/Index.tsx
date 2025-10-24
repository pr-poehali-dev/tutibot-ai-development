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
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
}

const themeColors = [
  { name: 'Черный', bg: '#0F0F0F', panel: '#1A1A1A', card: '#2A2A2A' },
  { name: 'Темно-синий', bg: '#0A1929', panel: '#1E293B', card: '#334155' },
  { name: 'Темно-зеленый', bg: '#0F1E13', panel: '#1A2E1F', card: '#2A4431' },
  { name: 'Фиолетовый', bg: '#1A0F2E', panel: '#2E1A4A', card: '#3E2A5A' },
];

export default function Index() {
  const [chats, setChats] = useState<Chat[]>([
    { id: '1', name: 'Основной чат', messages: [] }
  ]);
  const [activeChat, setActiveChat] = useState('1');
  const [inputValue, setInputValue] = useState('');
  const [botName, setBotName] = useState('TuTiBot');
  const [botAvatar, setBotAvatar] = useState('🤖');
  const [userName, setUserName] = useState('Пользователь');
  const [userAvatar, setUserAvatar] = useState('👤');
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(c => c.id === activeChat);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-primary', themeColors[selectedTheme].bg);
    document.documentElement.style.setProperty('--bg-secondary', themeColors[selectedTheme].panel);
    document.documentElement.style.setProperty('--bg-card', themeColors[selectedTheme].card);
  }, [selectedTheme]);

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { ...chat, messages: [...chat.messages, newMessage] }
        : chat
    ));

    setInputValue('');

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      };

      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, botResponse] }
          : chat
      ));
    }, 800);
  };

  const getBotResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('привет') || lower.includes('здравствуй')) {
      return `Привет! Я ${botName}, твой ИИ-ассистент. Чем могу помочь?`;
    }
    if (lower.includes('как дела')) {
      return 'Отлично работаю! Готов помочь тебе 24/7 🚀';
    }
    if (lower.includes('помощь') || lower.includes('команды')) {
      return 'Я могу:\n• Отвечать на вопросы\n• Анализировать текст\n• Запоминать команды\n• Помогать с задачами';
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
    toast.success('Бот перезапущен');
  };

  return (
    <div className="flex h-screen" style={{ 
      backgroundColor: 'var(--bg-primary)',
      color: '#FFFFFF'
    }}>
      <div className="w-80 border-r border-gray-800 flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{botAvatar}</div>
            <div>
              <h2 className="font-semibold text-lg">{botName}</h2>
              <p className="text-xs text-gray-400">Онлайн</p>
            </div>
          </div>
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Icon name="Settings" size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-96" style={{ backgroundColor: 'var(--bg-secondary)', border: 'none' }}>
              <SheetHeader>
                <SheetTitle className="text-white">Настройки</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <Label className="text-white">Аватар бота</Label>
                  <Input 
                    value={botAvatar}
                    onChange={(e) => setBotAvatar(e.target.value)}
                    className="mt-2 bg-gray-800 border-gray-700 text-white"
                    placeholder="🤖"
                  />
                </div>
                <div>
                  <Label className="text-white">Имя бота</Label>
                  <Input 
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="mt-2 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Ваш аватар</Label>
                  <Input 
                    value={userAvatar}
                    onChange={(e) => setUserAvatar(e.target.value)}
                    className="mt-2 bg-gray-800 border-gray-700 text-white"
                    placeholder="👤"
                  />
                </div>
                <div>
                  <Label className="text-white">Ваш никнейм</Label>
                  <Input 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="mt-2 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-3 block">Тема оформления</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {themeColors.map((theme, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTheme(idx)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedTheme === idx ? 'border-blue-500' : 'border-gray-700'
                        }`}
                        style={{ backgroundColor: theme.bg }}
                      >
                        <div className="text-sm text-white font-medium">{theme.name}</div>
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
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`w-full p-4 text-left hover:bg-gray-800/50 transition-colors border-b border-gray-800 ${
                activeChat === chat.id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name="MessageSquare" size={20} className="text-blue-500" />
                <div className="flex-1">
                  <div className="font-medium">{chat.name}</div>
                  <div className="text-xs text-gray-400">
                    {chat.messages.length} сообщений
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <Button onClick={createNewChat} className="w-full bg-blue-600 hover:bg-blue-700">
            <Icon name="Plus" size={20} className="mr-2" />
            Новый чат
          </Button>
          <Button onClick={restartBot} variant="outline" className="w-full border-gray-700 hover:bg-gray-800">
            <Icon name="RotateCcw" size={20} className="mr-2" />
            Перезапустить
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div>
            <h1 className="font-semibold text-lg">{currentChat?.name}</h1>
            <p className="text-xs text-gray-400">ИИ ассистент активен</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentChat?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">{botAvatar}</div>
                <h2 className="text-2xl font-bold mb-2">{botName}</h2>
                <p className="text-gray-400">Напиши что-нибудь, чтобы начать общение</p>
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
                    message.sender === 'user'
                      ? 'bg-blue-600 ml-auto'
                      : 'bg-gray-800'
                  }`}
                  style={message.sender === 'bot' ? { backgroundColor: 'var(--bg-card)' } : {}}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-800 p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex gap-3">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Icon name="Paperclip" size={20} />
            </Button>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Напишите сообщение..."
              className="flex-1 bg-gray-800 border-gray-700 text-white text-base h-12"
            />
            <Button 
              onClick={sendMessage}
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
