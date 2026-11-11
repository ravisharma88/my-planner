import { useEffect, useRef, useState, type FormEvent } from 'react'
import { sendChatMessage } from '../../api/chat'
import { Icon } from '../../components/Icon'
import './chat.css'

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
}

function messageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string>()
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: messageId(),
    role: 'assistant',
    text: 'Hi! Ask me about your trips or tell me what kind of trip you’d like to plan.',
  }])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isProcessing])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  async function handleMessage(text: string) {
    const message = text.trim()
    if (!message || isProcessing) return

    setInput('')
    setError('')
    setIsProcessing(true)
    setMessages((current) => [...current, { id: messageId(), role: 'user', text: message }])

    try {
      const result = await sendChatMessage({ conversationId, message })
      setConversationId(result.conversationId)
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', text: result.reply }])
    } catch (requestError) {
      const details = requestError instanceof Error ? requestError.message : 'Unable to reach the chat service.'
      setError(details)
      setMessages((current) => [...current, {
        id: messageId(),
        role: 'assistant',
        text: 'I couldn’t get a response from the chat service. Please try again.',
      }])
    } finally {
      setIsProcessing(false)
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void handleMessage(input)
  }

  function sendQuickReply(text: string) {
    void handleMessage(text)
  }

  return <div className="chat-assistant">
    {isOpen && <section className="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title">
      <header className="chat-header">
        <span className="chat-avatar"><Icon name="sparkle" size={17} /></span>
        <div className="chat-heading"><strong id="chat-title">Trip assistant</strong><small>Ask about trips or plan a new one</small></div>
        <button className="chat-close" type="button" aria-label="Close chat" onClick={() => setIsOpen(false)}><Icon name="close" size={17} /></button>
      </header>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message) => <article className={`chat-message chat-message-${message.role}`} key={message.id}>
          <p>{message.text}</p>
        </article>)}
        {isProcessing && <div className="chat-typing" role="status">Thinking…</div>}
        {error && <p className="chat-error" role="alert">Chat service error: {error}</p>}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-quick-replies">
        <button type="button" disabled={isProcessing} onClick={() => sendQuickReply('Show my upcoming trips')}>Upcoming trips</button>
        <button type="button" disabled={isProcessing} onClick={() => sendQuickReply('How much have I spent?')}>Trip expenses</button>
        <button type="button" disabled={isProcessing} onClick={() => sendQuickReply('Help me plan a trip')}>Create a trip</button>
      </div>
      <form className="chat-input-form" onSubmit={submitMessage}>
        <input ref={inputRef} aria-label="Message trip assistant" placeholder="Ask about a trip or say “plan a trip”…" value={input} onChange={(event) => setInput(event.target.value)} disabled={isProcessing} />
        <button type="submit" aria-label="Send message" disabled={!input.trim() || isProcessing}><Icon name="arrow" size={17} /></button>
      </form>
      <p className="chat-disclaimer">Connected to your trip assistant service.</p>
    </section>}
    <button className={`chat-launcher ${isOpen ? 'chat-launcher-open' : ''}`} type="button" aria-label={isOpen ? 'Close trip assistant' : 'Open trip assistant'} aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
      <Icon name={isOpen ? 'close' : 'chat'} size={21} />
      {!isOpen && <span>Ask your trip assistant</span>}
    </button>
  </div>
}
