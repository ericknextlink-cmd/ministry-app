"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, ArrowDown, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  messages: Message[];
  timestamp: number;
}

// Format message content: convert markdown to HTML
function formatMessage(content: string): React.ReactNode {
  // Split by lines to handle list items
  const lines = content.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Check if line starts with "- " (list item)
    if (line.trim().startsWith('- ')) {
      // Remove the "- " and format the rest
      const listContent = line.trim().substring(2);
      // Process bold text in list item
      const parts: (string | React.ReactNode)[] = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;
      let lastIndex = 0;

      while ((match = boldRegex.exec(listContent)) !== null) {
        // Add text before the bold
        if (match.index > lastIndex) {
          parts.push(listContent.substring(lastIndex, match.index));
        }
        // Add bold text
        parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }
      // Add remaining text
      if (lastIndex < listContent.length) {
        parts.push(listContent.substring(lastIndex));
      }

      return (
        <div key={lineIndex} className="flex items-start gap-2 my-1">
          <span className="text-blue-500 shrink-0">→</span>
          <span>{parts.length > 0 ? parts : listContent}</span>
        </div>
      );
    }
    
    // Regular line - process bold text
    const parts: (string | React.ReactNode)[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;

    while ((match = boldRegex.exec(line)) !== null) {
      // Add text before the bold
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      // Add bold text
      parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    // Return empty line or formatted line
    if (line.trim() === '') {
      return <br key={lineIndex} />;
    }

    return (
      <div key={lineIndex} className={lineIndex < lines.length - 1 ? 'mb-1' : ''}>
        {parts.length > 0 ? parts : line}
      </div>
    );
  });
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm Mavis, your assistant for the Ministry of Works, Housing & Water Resources. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const storedConversations = localStorage.getItem("chat_conversations");
    if (storedConversations) {
      setConversations(JSON.parse(storedConversations));
    }
  }, []);

  const saveConversations = (updatedConversations: Conversation[]) => {
    setConversations(updatedConversations);
    localStorage.setItem("chat_conversations", JSON.stringify(updatedConversations));
  };

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom("auto");
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollButton(!atBottom);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = { role: "assistant", content: data.response };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      const newConversation: Conversation = {
        id: Date.now().toString(),
        messages: updatedMessages,
        timestamp: Date.now(),
      };
      saveConversations([newConversation, ...conversations]);

    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again or contact the Classification Office directly.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    saveConversations([]);
    setMessages([
      {
        role: "assistant",
        content: "Hello! I'm Mavis, your assistant for the Ministry of Works, Housing & Water Resources. How can I help you today?",
      },
    ]);
  };

  return (
    <>
      {/* Floating Orb Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[10000] flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-all hover:bg-blue-700 hover:scale-110"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="h-8 w-8" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="h-8 w-8" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed bottom-24 right-6 z-[10000] flex h-[70vh] max-h-[700px] w-[90vw] max-w-[440px] flex-col rounded-2xl border border-gray-200/50 bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-gray-900/80 dark:border-gray-700/50"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200/80 p-4 text-gray-900 dark:border-gray-700/80 dark:text-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12">
                    <Image src="/ministry-1.png" alt="Ministry Logo" fill className="object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Mavis</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ministry Assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-200/50 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-100"
                    aria-label="Toggle history"
                  >
                    <History className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-200/50 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-100"
                    aria-label="Close chat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* History Panel */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute top-0 left-0 h-full w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-10"
                  >
                    <div className="flex items-center justify-between border-b border-gray-200/80 p-4">
                      <h3 className="font-bold text-lg">History</h3>
                      <button
                        onClick={() => setShowHistory(false)}
                        className="rounded-full p-2 text-gray-500 hover:bg-gray-200/50 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-100"
                        aria-label="Close history"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-120px)]">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setMessages(conv.messages);
                            setShowHistory(false);
                          }}
                          className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 cursor-pointer"
                        >
                          <p className="text-sm font-medium truncate">{conv.messages[0].content}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(conv.timestamp).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-200/80">
                      <Button
                        onClick={handleClearHistory}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear History
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-6 relative">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        <Image src="/ministry-1.png" alt="Mavis" width={32} height={32} className="rounded-full" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.role === "user"
                          ? "bg-blue-600 text-white rounded-br-lg"
                          : "bg-white text-gray-800 rounded-bl-lg dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.role === "assistant" 
                          ? formatMessage(message.content)
                          : message.content
                        }
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start gap-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                      <Image src="/ministry-1.png" alt="Mavis" width={32} height={32} className="rounded-full" />
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-gray-800 px-4 py-3 shadow-sm flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
                
                <AnimatePresence>
                  {showScrollButton && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-4 right-4"
                    >
                      <Button
                        onClick={() => scrollToBottom()}
                        size="icon"
                        className="rounded-full bg-blue-600/80 text-white backdrop-blur-sm hover:bg-blue-600"
                      >
                        <ArrowDown className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input */}
              <div className="border-t border-gray-200/80 p-4 dark:border-gray-700/80">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Auto-resize textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 rounded-lg border border-gray-300 bg-white/50 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100 resize-none overflow-y-auto max-h-[120px]"
                    disabled={isLoading}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-400 shrink-0 rounded-lg h-11 w-11"
                    size="icon"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

