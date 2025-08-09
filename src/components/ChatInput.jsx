import { useState, useRef, useCallback, useEffect } from 'preact/hooks'

export default function ChatInput({ onSendMessage, disabled = false, placeholder = "Type your message..." }) {
  const [inputText, setInputText] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const inputRef = useRef()
  const lastValueRef = useRef('')

  // Prevent external re-renders from affecting input
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== inputText) {
      inputRef.current.value = inputText
    }
  }, [inputText])

  const handleInputChange = useCallback((e) => {
    const value = e.target.value
    if (value.length <= 200) {
      setInputText(value)
      lastValueRef.current = value
    }
  }, [])

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true)
  }, [])

  const handleCompositionEnd = useCallback((e) => {
    setIsComposing(false)
    const value = e.target.value
    setInputText(value)
    lastValueRef.current = value
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing && !disabled) {
      e.preventDefault()
      sendMessage()
    }
  }, [isComposing, disabled])

  const sendMessage = useCallback(() => {
    const message = inputText.trim()
    if (!message || disabled || isComposing) return

    // Send the message
    onSendMessage(message)
    
    // Clear input
    setInputText('')
    lastValueRef.current = ''
    
    // Clear the actual input element
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.focus()
    }
  }, [inputText, disabled, isComposing, onSendMessage])

  const handleButtonClick = useCallback((e) => {
    e.preventDefault()
    sendMessage()
  }, [sendMessage])

  return (
    <div className="bg-dark-card p-4 border-t border-gray-700">
      <div className="flex space-x-3">
        <input
          ref={inputRef}
          type="text"
          defaultValue=""
          onChange={handleInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none transition-colors"
          maxLength={200}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          disabled={disabled}
        />
        <button 
          onClick={handleButtonClick}
          disabled={!inputText.trim() || disabled || isComposing}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
            inputText.trim() && !disabled && !isComposing
              ? 'bg-gradient-to-r from-neon-pink to-neon-violet text-white hover:scale-105 shadow-lg' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Send
        </button>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs text-gray-500">
          {inputText.length}/200 characters
        </div>
        {inputText.length > 0 && !isComposing && (
          <div className="text-xs text-neon-blue">
            ✏️ Typing...
          </div>
        )}
      </div>
    </div>
  )
}