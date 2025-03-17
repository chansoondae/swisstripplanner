// app/components/ChatButtonPortal.js
'use client';

import { useState } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';

const ChatButtonPortal = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', content: 'How can I help with your Swiss travel plan?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: message };
    setChatMessages([...chatMessages, userMessage]);
    setMessage('');
    setIsLoading(true);
    
    try {
      // Here you would typically call an API to get a response
      // For now, we'll simulate a response
      setTimeout(() => {
        const assistantMessage = { 
          role: 'system', 
          content: "I'd be happy to help with your Swiss travel questions! You can ask about specific destinations, transportation, or any other travel-related queries."
        };
        setChatMessages(prevMessages => [...prevMessages, assistantMessage]);
        setIsLoading(false);
      }, 1000);
      
      // Actual API call would look something like this:
      // const response = await fetch('/api/chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message }),
      // });
      // const data = await response.json();
      // setChatMessages(prev => [...prev, { role: 'system', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'system', 
        content: "I'm sorry, I couldn't process your request. Please try again." 
      }]);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors z-50"
        aria-label="Chat assistance"
      >
        <FiMessageCircle size={24} />
      </button>
      
      {/* Chat portal */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[500px]">
          {/* Chat header */}
          <div className="flex justify-between items-center p-4 bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-medium">Travel Assistant</h3>
            <button onClick={toggleChat} aria-label="Close chat">
              <FiX size={20} />
            </button>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[400px] bg-gray-50">
            {chatMessages.map((chatMessage, index) => (
              <div 
                key={index} 
                className={`mb-3 ${chatMessage.role === 'user' ? 'text-right' : ''}`}
              >
                <div 
                  className={`inline-block rounded-lg p-3 max-w-[80%] ${
                    chatMessage.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                >
                  {chatMessage.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Chat input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
            <div className="flex">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about your trip..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-400"
                disabled={isLoading || !message.trim()}
              >
                <FiSend />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatButtonPortal;