import { useState, useRef, useEffect } from 'react';
import { IconMessageChatbot, IconX, IconSend, IconLoader2 } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import style from './floating-chat.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function FloatingChat({ result }: { result: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm CodeSense AI. Ask me anything about the pull request I just reviewed!",
        },
      ]);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prContext: result?.prData,
          reviewSummary: result?.summary,
          messages: newMessages,
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't process that right now." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={style.container}>
      {isOpen && (
        <div className={style.chatWindow}>
          <div className={style.header}>
            <div className={style.headerTitle}>
              <IconMessageChatbot size={20} />
              <span>Chat with CodeSense</span>
            </div>
            <button className={style.closeBtn} onClick={() => setIsOpen(false)}>
              <IconX size={20} />
            </button>
          </div>
          
          <div className={style.messagesArea}>
            {messages.map((msg, i) => (
              <div key={i} className={`${style.messageWrapper} ${style[msg.role]}`}>
                <div className={style.bubble}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className={`${style.messageWrapper} ${style.assistant}`}>
                <div className={`${style.bubble} ${style.typing}`}>
                  <IconLoader2 size={16} className={style.spin} /> Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={style.inputArea}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the code..."
              className={style.input}
              disabled={isTyping}
            />
            <button type="submit" disabled={!input.trim() || isTyping} className={style.sendBtn}>
              <IconSend size={18} />
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button className={style.fab} onClick={() => setIsOpen(true)}>
          <IconMessageChatbot size={28} />
        </button>
      )}
    </div>
  );
}
