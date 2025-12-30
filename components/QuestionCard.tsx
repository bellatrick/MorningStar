import React, { useState } from 'react';
import { Question, Answer } from '../types';

interface QuestionCardProps {
  question: Question;
  answerState: Answer;
  playerRole: 'userA' | 'userB';
  onAnswer: (text: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, answerState, playerRole, onAnswer }) => {
  const [inputValue, setInputValue] = useState('');

  const myAnswer = answerState[playerRole];
  const otherRole = playerRole === 'userA' ? 'userB' : 'userA';
  const otherAnswer = answerState[otherRole];
  
  const isRevealed = !!(myAnswer && otherAnswer);
  const waitingForOther = !!(myAnswer && !otherAnswer);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAnswer(inputValue.trim());
    }
  };

  return (
    <div className={`ms-card ms-q-card ${isRevealed ? 'revealed' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <span className="ms-badge">Query #{question.id}</span>
        {isRevealed && (
          <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--primary-color)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '4px', height: '4px', background: 'var(--primary-color)', borderRadius: '50%' }}></span>
            Synchronized
          </span>
        )}
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 300, lineHeight: 1.6, marginBottom: '2rem', flexGrow: 1 }}>
        {question.text}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ fontSize: '0.5rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.1em' }}>Your Revelation</label>
          {myAnswer ? (
            <div className="ms-reveal-slot active">
              {myAnswer}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Share your thoughts..."
                className="ms-input"
                style={{ minHeight: '80px', fontSize: '0.9rem', marginBottom: '0.75rem', resize: 'none' }}
              />
              <button type="submit" disabled={!inputValue.trim()} className="ms-btn-primary" style={{ fontSize: '0.6rem', padding: '0.75rem' }}>
                Confirm
              </button>
            </form>
          )}
        </div>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(63, 63, 70, 0.2)' }}>
          <label style={{ fontSize: '0.5rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.1em' }}>Partner Revelation</label>
          <div className={`ms-reveal-slot ${isRevealed ? 'active' : ''}`}>
            {isRevealed ? otherAnswer : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <span>{waitingForOther ? "Awaiting partner..." : "Encrypted"}</span>
                {!isRevealed && otherAnswer && (
                  <span style={{ color: 'var(--primary-color)', fontSize: '0.5rem', opacity: 0.6 }}>Presence Detected</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;