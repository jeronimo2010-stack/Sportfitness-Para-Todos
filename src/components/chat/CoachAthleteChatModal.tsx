/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  X,
  User,
  Shield,
  Clock,
  Sparkles,
  Dumbbell,
  CheckCheck,
  TrendingUp,
  Heart,
} from 'lucide-react';
import { UserProfile, CoachDirectChatMessage } from '../../types';
import { localDatabase } from '../../db/localDatabase';
import { useApp } from '../../context/AppContext';
import { formatTime } from '../../utils/localeFormatters';

interface CoachAthleteChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  otherUser: UserProfile;
  initialTopic?: string;
}

export const CoachAthleteChatModal: React.FC<CoachAthleteChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  otherUser,
  initialTopic,
}) => {
  const { language, t } = useApp();
  const [messages, setMessages] = useState<CoachDirectChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute standard canonical conversation ID based on coach ID and athlete ID
  const coachId = currentUser.role === 'entrenador' ? currentUser.id : otherUser.id;
  const athleteId = currentUser.role === 'atleta' ? currentUser.id : otherUser.id;
  const conversationId = `chat_${coachId}_${athleteId}`;

  // Load chat messages on mount and interval
  const reloadMessages = () => {
    const list = localDatabase.getChatMessages(conversationId);
    setMessages(list);
    localDatabase.markChatMessagesAsRead(conversationId, currentUser.id);
  };

  useEffect(() => {
    if (isOpen) {
      reloadMessages();
      const interval = setInterval(reloadMessages, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen, conversationId, currentUser.id]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    localDatabase.sendChatMessage({
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role === 'entrenador' ? 'entrenador' : 'atleta',
      recipientId: otherUser.id,
      recipientName: otherUser.name,
      text: clean,
      read: false,
    });

    setInputText('');
    reloadMessages();
  };

  const isCoach = currentUser.role === 'entrenador';

  const quickPrompts = isCoach
    ? [
        t('chat.coachPrompt1'),
        t('chat.coachPrompt2'),
        t('chat.coachPrompt3'),
        t('chat.coachPrompt4'),
      ]
    : [
        t('chat.athletePrompt1'),
        t('chat.athletePrompt2'),
        t('chat.athletePrompt3'),
        t('chat.athletePrompt4'),
      ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 text-left animate-fadeIn">
      <div className="bg-[#12121A] border border-[#2A2A3E] rounded-2xl w-full max-w-2xl h-[620px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#161622] border-b border-[#242436] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#56A867]/20 border border-[#56A867]/40 flex items-center justify-center text-[#56A867] font-bold font-mono">
                {otherUser.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#56A867] border-2 border-[#161622]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-serif">{otherUser.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    otherUser.role === 'entrenador'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                      : 'bg-[#56A867]/15 border border-[#56A867]/30 text-[#56A867]'
                  }`}
                >
                  {otherUser.role === 'entrenador' ? t('chat.officialCoach') : t('chat.adoptedAthlete')}
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E9E] font-mono">
                {otherUser.email} {otherUser.specialization ? `• ${otherUser.specialization}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E8E9E] hover:text-white hover:bg-[#202030] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-4 py-2 bg-[#181826] border-b border-[#222234] flex items-center justify-between text-[11px] font-mono text-[#9E9EAE] shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#56A867]" />
            <span>{t('chat.secureChannel')}</span>
          </div>
          <span>{t('chat.syncedMessages')}</span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0F0F16]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#56A867]/10 border border-[#56A867]/30 flex items-center justify-center text-[#56A867]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">{t('chat.emptyTitle')}</h4>
              <p className="text-xs text-[#8E8E9E] max-w-sm">
                {t('chat.emptyDesc')}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              const formattedTime = formatTime(msg.timestamp, language);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-[#7E7E8E]">
                    <span className="font-semibold">{isMine ? t('chat.you') : msg.senderName}</span>
                    <span>•</span>
                    <span>{formattedTime}</span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isMine
                        ? 'bg-[#56A867] text-black font-medium rounded-tr-none shadow-[0_2px_15px_rgba(86,168,103,0.2)]'
                        : 'bg-[#1C1C2A] text-neutral-100 border border-[#2B2B3E] rounded-tl-none shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-[#14141E] border-t border-[#222232] overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
          <span className="text-[10px] font-mono text-[#7E7E8E] shrink-0 uppercase font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#56A867]" />
            {t('chat.quick')}
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(prompt);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#1B1B28] hover:bg-[#252538] text-[11px] font-mono text-[#C0C0D0] hover:text-white border border-[#2A2A3E] whitespace-nowrap transition-colors"
            >
              {prompt.length > 38 ? `${prompt.slice(0, 38)}...` : prompt}
            </button>
          ))}
        </div>

        {/* Send Input Area */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-[#161622] border-t border-[#242436] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isCoach
                ? `${t('chat.coachPlaceholder')} (${otherUser.name})`
                : t('chat.athletePlaceholder')
            }
            className="flex-1 bg-[#101018] border border-[#28283C] text-sm text-white px-4 py-2.5 rounded-xl focus:border-[#56A867] focus:outline-none placeholder:text-[#606075]"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5 fill-black" />
            <span className="hidden sm:inline">{t('chat.send')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
