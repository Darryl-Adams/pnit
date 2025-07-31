import React, { useState, useRef, useEffect } from 'react';
import { useAccessibility } from './AccessibilityProvider';

// Individual chat message component
export const ChatMessage = ({ 
  message, 
  isUser = false, 
  timestamp, 
  results = [],
  onResultClick,
  className = '' 
}) => {
  const { announce } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(false);
  const messageRef = useRef(null);

  // Announce new messages to screen readers
  useEffect(() => {
    if (!isUser && message) {
      announce(`Assistant: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`, 'polite');
    }
  }, [message, isUser, announce]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (results.length > 0) {
        setIsExpanded(!isExpanded);
      }
    }
  };

  return (
    <div
      ref={messageRef}
      className={`
        flex ${isUser ? 'justify-end' : 'justify-start'} mb-4
        ${className}
      `}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message at ${formatTimestamp(timestamp)}`}
    >
      <div
        className={`
          max-w-[80%] rounded-lg px-4 py-3 shadow-sm
          ${isUser 
            ? 'bg-primary text-white' 
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
          }
        `}
      >
        {/* Message content */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message}
        </div>

        {/* Results section */}
        {results && results.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              onKeyDown={handleKeyDown}
              className={`
                text-xs font-medium w-full text-left flex items-center justify-between
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                rounded p-1 -m-1
                ${isUser ? 'text-blue-100 hover:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
              `}
              aria-expanded={isExpanded}
              aria-controls={`results-${timestamp}`}
            >
              <span>Found {results.length} connection{results.length !== 1 ? 's' : ''}</span>
              <svg 
                className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Results list */}
            <div
              id={`results-${timestamp}`}
              className={`mt-2 space-y-2 transition-all duration-200 ${
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
              }`}
              aria-hidden={!isExpanded}
            >
              {results.slice(0, 10).map((result, index) => (
                <ConnectionCard
                  key={`${result.first_name}-${result.last_name}-${index}`}
                  connection={result}
                  onClick={onResultClick}
                  compact={true}
                  className={isUser ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}
                />
              ))}
              
              {results.length > 10 && (
                <div className={`text-xs px-2 py-1 rounded ${
                  isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  ... and {results.length - 10} more connections
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-2 opacity-70 ${isUser ? 'text-right' : 'text-left'}`}>
          <time dateTime={timestamp} title={new Date(timestamp).toLocaleString()}>
            {formatTimestamp(timestamp)}
          </time>
        </div>
      </div>
    </div>
  );
};

// Connection card component for search results
export const ConnectionCard = ({ 
  connection, 
  onClick, 
  compact = false,
  className = '' 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(connection);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  if (compact) {
    return (
      <div
        className={`
          p-2 rounded border cursor-pointer transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${className}
        `}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`View ${connection.first_name} ${connection.last_name}'s profile`}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {connection.first_name?.[0]}{connection.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {connection.first_name} {connection.last_name}
            </div>
            {connection.position && (
              <div className="text-xs opacity-75 truncate">
                {connection.position}
              </div>
            )}
            {connection.company && (
              <div className="text-xs opacity-75 truncate">
                {connection.company}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
        rounded-lg p-4 cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View ${connection.first_name} ${connection.last_name}'s profile`}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
          {connection.first_name?.[0]}{connection.last_name?.[0]}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
              {connection.first_name} {connection.last_name}
            </h3>
          </div>
          
          {connection.position && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
              {connection.position}
            </p>
          )}
          
          {connection.company && (
            <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
              {connection.company}
            </p>
          )}
          
          {connection.email && (
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2 truncate">
              {connection.email}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          {connection.profile_url && (
            <a
              href={connection.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-primary rounded p-1"
              onClick={(e) => e.stopPropagation()}
              aria-label="Open LinkedIn profile in new tab"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// Typing indicator component
export const TypingIndicator = ({ className = '' }) => {
  return (
    <div 
      className={`flex justify-start mb-4 ${className}`}
      role="status" 
      aria-label="Assistant is typing"
    >
      <div className="max-w-[80%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
        <div className="flex space-x-1 items-center">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                style={{ 
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            Assistant is typing
          </span>
        </div>
        <span className="sr-only">Assistant is typing a response</span>
      </div>
    </div>
  );
};

// Message input component
export const MessageInput = ({ 
  value, 
  onChange, 
  onSubmit, 
  disabled = false,
  placeholder = "Type your message...",
  className = '' 
}) => {
  const textareaRef = useRef(null);
  const { handleKeyNavigation } = useAccessibility();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    handleKeyNavigation(e, {
      enter: (event) => {
        if (!event.shiftKey) {
          event.preventDefault();
          onSubmit?.(event);
        }
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit?.(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex space-x-2 ${className}`}>
      <div className="flex-1 relative">
        <label htmlFor="message-input" className="sr-only">
          {placeholder}
        </label>
        <textarea
          id="message-input"
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={`
            w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 
            rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary 
            focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            transition-colors duration-200
          `}
          style={{ minHeight: '48px', maxHeight: '120px' }}
          aria-describedby="message-help"
        />
        
        {/* Character count for longer messages */}
        {value.length > 200 && (
          <div className="absolute bottom-1 right-1 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-700 px-1 rounded">
            {value.length}
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className={`
          px-4 py-3 bg-primary text-white rounded-lg font-medium
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary 
          focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200 flex-shrink-0
        `}
        aria-label="Send message"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
};

// Help text for the message input
export const MessageInputHelp = ({ className = '' }) => {
  return (
    <div id="message-help" className={`text-xs text-gray-500 dark:text-gray-400 mt-2 ${className}`}>
      <p>Press Enter to send, Shift+Enter for new line</p>
      <p>Try asking: "Who works at Google?" or "Show me product managers"</p>
    </div>
  );
};

export default ChatMessage;