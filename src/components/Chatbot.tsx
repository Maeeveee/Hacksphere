"use client";

import { useState, useRef, useEffect, type FC } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

// 1. Definisikan struktur data untuk sebuah pesan
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const Chatbot: FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Halo! Ada yang bisa saya bantu terkait layanan PT. Kereta Api Indonesia?",
      sender: 'bot'
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Efek untuk auto-scroll setiap kali ada pesan baru
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Tambahkan pesan pengguna ke daftar
    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: inputValue }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data: { answer: string } = await response.json();

      // Tambahkan jawaban bot ke daftar
      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.answer,
        sender: 'bot',
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);

    } catch (error) {
      console.error("Failed to fetch:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Maaf, terjadi kesalahan. Silakan coba lagi nanti.",
        sender: 'bot',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="h-[85vh] flex flex-col">
        <DrawerHeader className="text-left">
          <DrawerTitle>KAI GOAT Chatbot</DrawerTitle>
          <DrawerDescription>Asisten virtual Anda, siap membantu 24/7.</DrawerDescription>
        </DrawerHeader>

        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-100'}`}>
                <div className="prose text-sm">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="bg-slate-100 p-3 rounded-lg">
                  <p className="text-sm animate-pulse">...</p>
               </div>
            </div>
          )}
        </div>
        
        <DrawerFooter className="border-t">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Ketik pertanyaanmu di sini..."
              className="flex-grow"
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading}>
              Kirim
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default Chatbot;