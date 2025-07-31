import { useState, useRef, useEffect } from 'react';
import { authenticatedFetch, useAuth } from '../utils/auth';

export default function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await authenticatedFetch('/api/query', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add assistant response to chat
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.assistant_message,
        results: data.results || [],
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] border border-gray-300 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Network Intelligence Chat
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ask questions about your professional network
        </p>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
        tabIndex="0"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="text-lg mb-2">Welcome to PNIT Chat{user?.name ? `, ${user.name}` : ''}!</p>
            <p className="text-sm">
              Try asking: "Who works at Microsoft?" or "Show me connections in product management"
            </p>
            {user?.connection_count && (
              <p className="text-xs mt-2">
                Ready to search through your {user.connection_count} connections
              </p>
            )}
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            role="article"
            aria-label={`${message.type === 'user' ? 'Your' : 'Assistant'} message at ${formatTimestamp(message.timestamp)}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-primary text-white'
                  : message.type === 'error'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-700'
                  : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              
              {/* Display search results if present */}
              {message.results && message.results.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                  <h4 className="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-400">
                    Found {message.results.length} connections:
                  </h4>
                  <div className="space-y-2">
                    {message.results.slice(0, 5).map((result, index) => (
                      <div 
                        key={index} 
                        className="text-xs p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                      >
                        <div className="font-medium">
                          {result.first_name} {result.last_name}
                        </div>
                        {result.position && (
                          <div className="text-gray-600 dark:text-gray-400">
                            {result.position}
                          </div>
                        )}
                        {result.company && (
                          <div className="text-gray-600 dark:text-gray-400">
                            {result.company}
                          </div>
                        )}
                      </div>
                    ))}
                    {message.results.length > 5 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ... and {message.results.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="text-xs opacity-70 mt-1">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start" role="status" aria-label="Assistant is typing">
            <div className="max-w-[70%] rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="sr-only">Assistant is typing</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
        {error && (
          <div 
            className="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-200"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <label htmlFor="message-input" className="sr-only">
            Type your message
          </label>
          <textarea
            id="message-input"
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your network connections..."
            disabled={isLoading}
            rows="1"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            style={{ minHeight: '40px', maxHeight: '120px' }}
            aria-describedby="message-help"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 dark:focus:ring-offset-gray-800"
            aria-label="Send message"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send'
            )}
          </button>
        </form>
        
        <div id="message-help" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}