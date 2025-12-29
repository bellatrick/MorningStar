import React, { useState } from 'react';
import { Question, Answer, PlayerRole } from '../types';

interface QuestionCardProps {
  question: Question;
  answerState: Answer;
  playerRole: PlayerRole;
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
    <div className={`bg-zinc-900/40 border transition-all duration-500 backdrop-blur-md flex flex-col h-full rounded-2xl p-6 ${
      isRevealed 
        ? 'border-pink-500/30 shadow-[0_0_30px_-10px_rgba(236,72,153,0.2)]' 
        : 'border-zinc-800/60 hover:border-zinc-700'
    }`}>
      <div className="flex justify-between items-start mb-6">
        <span className="px-2.5 py-1 bg-zinc-950 text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg border border-zinc-800">
          Entity Query #{question.id}
        </span>
        {isRevealed && (
          <div className="animate-in fade-in zoom-in duration-500">
            <span className="text-pink-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]"></span>
              Synchronized
            </span>
          </div>
        )}
      </div>

      <h3 className="text-lg font-light text-zinc-100 mb-8 leading-relaxed flex-grow">
        {question.text}
      </h3>

      <div className="space-y-5 mt-auto">
        {/* My Answer Section */}
        <div className="space-y-2">
          <label className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Your Revelation</label>
          <div className="relative">
            {myAnswer ? (
              <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 text-zinc-300 text-sm break-words transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                {myAnswer}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative space-y-3">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter your thoughts..."
                  className="w-full bg-zinc-950/30 border border-zinc-800/80 rounded-xl p-4 text-zinc-200 text-sm placeholder:text-zinc-800 focus:outline-none focus:border-pink-500/50 transition-all min-h-[100px] resize-none"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-full py-3 bg-white text-black font-bold text-[10px] tracking-[0.2em] uppercase rounded-xl transition-all disabled:opacity-10 active:scale-[0.98] hover:bg-zinc-200"
                >
                  Confirm Input
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Other User Section */}
        <div className="space-y-2 pt-4 border-t border-zinc-900/50">
          <label className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Partner Revelation</label>
          <div className={`relative min-h-[56px] rounded-xl border transition-all duration-500 overflow-hidden ${
            isRevealed 
              ? 'bg-pink-500/[0.03] border-pink-500/20 text-zinc-200' 
              : 'bg-zinc-950/20 border-dashed border-zinc-800/50'
          }`}>
            
            <div className={`p-4 transition-all duration-700 ease-out text-sm break-words ${
              isRevealed 
                ? 'opacity-100 blur-none translate-y-0' 
                : 'opacity-0 blur-xl translate-y-4 pointer-events-none'
            }`}>
              {otherAnswer || ''}
            </div>

            <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 transition-all duration-500 ${
              isRevealed 
                ? 'opacity-0 scale-110 pointer-events-none' 
                : 'opacity-100 scale-100'
            }`}>
              <div className="text-zinc-700 text-[10px] uppercase tracking-widest font-bold text-center leading-tight">
                {waitingForOther ? "Awaiting partner..." : "Encrypted until both submit"}
              </div>
              
              {!isRevealed && otherAnswer && (
                <div className="mt-2 flex items-center gap-1.5 animate-pulse">
                   <span className="w-1 h-1 bg-pink-500 rounded-full"></span>
                   <span className="text-pink-500/60 text-[8px] font-black uppercase tracking-widest">
                    Presence detected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;