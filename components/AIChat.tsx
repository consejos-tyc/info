
import React, { useState, useRef, useEffect } from 'react';
import { getAIAnalysis } from '../services/geminiService';
import { Indicator, ChatMessage } from '../types';

interface AIChatProps {
  data: Indicator[];
}

const AIChat: React.FC<AIChatProps> = ({ data }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const response = await getAIAnalysis(data, input);
    const aiMsg: ChatMessage = { role: 'model', text: response };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white border border-[#E0E0E0] shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[#F0F0F0] bg-[#FAFAFA] flex items-center justify-between">
        <h3 className="font-bold text-[#333] flex items-center gap-2 text-sm uppercase tracking-widest">
          <svg className="w-4 h-4 text-[#002D5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Análisis de Datos
        </h3>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="text-[10px] font-bold text-[#999] uppercase hover:text-[#002D5A] transition-colors">Limpiar</button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 bg-slate-50 text-[#999] rounded-full flex items-center justify-center border border-[#EEE]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <p className="text-[13px] text-[#666] leading-relaxed italic">
              "Donde se lleva un registro, el progreso se acelera". <br/>
              Puedo ayudarle a interpretar las tendencias de su estaca.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              <button onClick={() => setInput('Resumen ejecutivo')} className="text-[10px] font-bold uppercase tracking-widest border border-[#EEE] px-3 py-1.5 hover:bg-[#FAFAFA] transition-colors">Resumen</button>
              <button onClick={() => setInput('¿Qué indicadores van mejor?')} className="text-[10px] font-bold uppercase tracking-widest border border-[#EEE] px-3 py-1.5 hover:bg-[#FAFAFA] transition-colors">Logros</button>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-4 text-[14px] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-[#F0F4F8] text-[#002D5A] border-r-4 border-[#002D5A]' 
                  : 'bg-white border border-[#EEE] text-[#333]'
              }`}>
                {msg.text.split('\n').map((line, idx) => (
                  <p key={idx} className={idx > 0 ? 'mt-2' : ''}>{line}</p>
                ))}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="text-[11px] text-[#999] font-bold uppercase tracking-widest flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-[#002D5A] rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-[#002D5A] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1 h-1 bg-[#002D5A] rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              Generando análisis...
            </div>
          </div>
        )}
      </div>

      <div className="p-5 border-t border-[#F0F0F0]">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunte sobre los datos..."
            className="flex-1 bg-white border border-[#CCC] px-4 py-3 text-[13px] outline-none focus:border-[#002D5A] transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-[#002D5A] text-white px-5 rounded disabled:bg-[#CCC] transition-all hover:bg-[#003D7A]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
