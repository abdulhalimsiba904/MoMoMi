import { useState, type FormEvent } from 'react'
import type { BusinessExpenseRecord, ConfirmedSale, DemoTransaction, ProductInventory } from '../../types/dashboard'
import type { BusinessAnalytics } from '../analytics/analyticsCalculations'
import type { BusinessInsight } from '../intelligence/intelligenceCalculations'
import type { MerchantAlert } from '../alerts/alertCalculations'
import { answerBusinessQuestion, type CopilotResponse } from './copilotResponses'
import './Copilot.css'

const exampleQuestions = [
  'How much money did I receive?',
  'Which product generated the most revenue?',
  'What is my current stock?',
  'What should I review?',
  'How much are my business expenses?',
  'How much money was business-related?',
]

interface ConversationTurn {
  id: number
  question: string
  response: CopilotResponse
}

interface BusinessCopilotProps {
  analytics: BusinessAnalytics
  transactions: readonly DemoTransaction[]
  sales: readonly ConfirmedSale[]
  expenses: readonly BusinessExpenseRecord[]
  inventory: readonly ProductInventory[]
  insights: readonly BusinessInsight[]
  alerts: readonly MerchantAlert[]
}

export function BusinessCopilot(props: BusinessCopilotProps) {
  const [question, setQuestion] = useState('')
  const [conversation, setConversation] = useState<ConversationTurn[]>([])

  function submitQuestion(rawQuestion: string) {
    const cleanQuestion = rawQuestion.trim()
    if (!cleanQuestion) return
    setConversation((current) => [...current, {
      id: Date.now() + current.length,
      question: cleanQuestion,
      response: answerBusinessQuestion(cleanQuestion, props),
    }])
    setQuestion('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitQuestion(question)
  }

  return <section className="copilot-page" aria-labelledby="copilot-title">
    <header className="copilot-heading">
      <div>
        <p className="analytics-eyebrow">BUSINESS INTELLIGENCE</p>
        <h1 id="copilot-title">Business Copilot</h1>
        <p>Ask about your recorded business activity. Answers distinguish verified business records from other activity and note when information is limited.</p>
      </div>
      <span className="copilot-prototype-label"><span className="demo-dot" />DEMO COPILOT</span>
    </header>

    <div className="copilot-safety-note">
      <span className="copilot-note-icon" aria-hidden="true">i</span>
      <p>Answers are generated locally from the same synthetic demo records used by Dashboard and Analytics. This prototype does not use an external AI service.</p>
    </div>

    <section className="copilot-chat" aria-label="Business Copilot conversation" aria-live="polite">
      {conversation.length === 0 ? <div className="copilot-empty-state">
        <span className="copilot-empty-icon" aria-hidden="true">✳</span>
        <h2>What would you like to understand?</h2>
        <p>Ask about your money, sales, expenses, inventory, or business activity.</p>
      </div> : <ol className="copilot-conversation">
        {conversation.map((turn) => <li className="copilot-turn" key={turn.id}>
          <div className="copilot-user-message"><span className="copilot-message-label">YOU</span><p>{turn.question}</p></div>
          <article className="copilot-answer-card">
            <div className="copilot-answer-heading"><span className="copilot-answer-mark" aria-hidden="true">M</span><strong>MoMoMI</strong><span className={`copilot-confidence copilot-confidence--${turn.response.confidence}`}>{turn.response.confidence === 'verified' ? 'Verified records' : 'Limited data'}</span></div>
            <p className="copilot-answer-text">{turn.response.answer}</p>
            {turn.response.limitation && <p className="copilot-limitation">{turn.response.limitation}</p>}
            {turn.response.evidence && turn.response.evidence.length > 0 && <details className="copilot-evidence">
              <summary>View evidence <span>{turn.response.evidence.length} {turn.response.evidence.length === 1 ? 'record' : 'items'}</span></summary>
              <ul>{turn.response.evidence.map((item, index) => <li key={`${item.sourceRecordId ?? item.label}-${index}`}><span>{item.label}</span><strong>{item.value}</strong></li>)}</ul>
            </details>}
          </article>
        </li>)}
      </ol>}
    </section>

    <div className="copilot-examples">
      <div className="copilot-examples-heading"><strong>Try asking</strong><span>Questions use current demo records</span></div>
      <div className="copilot-example-list">{exampleQuestions.map((example) => <button type="button" key={example} onClick={() => submitQuestion(example)}>{example}</button>)}</div>
    </div>

    <form className="copilot-composer" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="copilot-question">Ask a business question</label>
      <input id="copilot-question" type="text" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your recorded business activity…" maxLength={240} />
      <button type="submit" disabled={!question.trim()}>Ask MoMoMI <span aria-hidden="true">→</span></button>
      <small>Deterministic demo responses · No external AI</small>
    </form>
  </section>
}
