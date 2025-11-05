"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
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
      let currentIndex = 0;
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
          <span className="text-[#033783] shrink-0">→</span>
          <span>{parts.length > 0 ? parts : listContent}</span>
        </div>
      );
    }
    
    // Regular line - process bold text
    const parts: (string | React.ReactNode)[] = [];
    let currentIndex = 0;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
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


  return (
    <>
      {/* Floating Orb Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-9999 flex h-16 w-16 items-center justify-center rounded-full bg-[#033783] text-white shadow-lg transition-all hover:bg-[#022555] hover:scale-110"
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
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="h-6 w-6" />
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
              className="fixed inset-0 z-9998 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-24 right-6 z-9999 flex h-[600px] w-[400px] flex-col rounded-lg border bg-white shadow-2xl dark:bg-gray-950 dark:border-gray-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b bg-[#033783] p-4 text-white dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Mavis</h3>
                    <p className="text-xs text-white/80">Ministry Assistant</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 hover:bg-white/20 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-[#033783] text-white"
                          : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.role === "assistant" 
                          ? formatMessage(message.content)
                          : message.content
                        }
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4 dark:border-gray-800">
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
                    placeholder="Type your message..."
                    rows={1}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#033783] focus:outline-none focus:ring-2 focus:ring-[#033783]/20 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 resize-none overflow-y-auto max-h-[120px]"
                    disabled={isLoading}
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-[#033783] text-white hover:bg-[#022555] disabled:opacity-50 shrink-0"
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
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

