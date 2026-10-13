/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Newspaper,
  Tag,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Flame,
  Dumbbell,
  Bike,
  Trophy,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { localDatabase, WeeklyNewsItem } from '../../db/localDatabase';
import { useApp } from '../../context/AppContext';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../common/ScrollReveal';

interface WeeklyNewsViewProps {
  onNavigate: (screen: ScreenId) => void;
}

export const WeeklyNewsView: React.FC<WeeklyNewsViewProps> = ({ onNavigate }) => {
  const { user, language } = useApp();
  const [newsList] = useState<WeeklyNewsItem[]>(() => localDatabase.getWeeklyNews());
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = language === 'en'
    ? ['All', 'Weightlifting', 'Cycling', 'Strength']
    : ['Todos', 'Halterofilia', 'Ciclismo', 'Fuerza'];

  const filteredNews = newsList.filter((item) => {
    if (selectedCategory === 'Todos' || selectedCategory === 'All') return true;
    if (selectedCategory === 'Fuerza' || selectedCategory === 'Strength') {
      return item.category === 'Running' || item.category === 'Fuerza' || item.category === 'Halterofilia';
    }
    return item.category === selectedCategory;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto text-left">
      {/* Header */}
      <ScrollReveal direction="down" duration={0.4}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#56A867]/15 text-[#56A867] text-[11px] font-mono font-bold uppercase tracking-wider mb-1">
              <Newspaper className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Weekly Updates & High Performance News' : 'Novedades Semanales & Noticias Deportivas'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {language === 'en' ? 'Weekly Sports Digest' : 'Boletín Deportivo Semanal'}
            </h1>
            <p className="text-xs sm:text-sm text-[#8E8E9E]">
              {language === 'en'
                ? 'Official weekly updates: high performance breakthroughs, training science, and sport ecosystem news.'
                : 'Actualizaciones oficiales cada semana: primicias de alto rendimiento, ciencia del entrenamiento y novedades del ecosistema.'}
            </p>
          </div>

          {/* User streak discount banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#172010] to-[#13131D] border border-[#56A867]/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#56A867] text-black flex items-center justify-center font-bold font-mono">
              <Flame className="w-5 h-5 fill-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">
                {language === 'en' ? 'Active Streak:' : 'Tu Racha Activa:'}{' '}
                <span className="text-[#56A867]">{user.streakDays || 1} {language === 'en' ? 'Days' : 'Días'}</span>
              </span>
              <span className="text-[10px] text-[#A0A0B0]">
                {language === 'en' ? 'Daily consistency in your training routines' : 'Constancia y disciplina diaria en tus entrenamientos'}
              </span>
            </div>
            <button
              onClick={() => onNavigate('routines')}
              className="px-3 py-1.5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black text-[11px] font-mono font-bold uppercase cursor-pointer"
            >
              {language === 'en' ? 'View Routines' : 'Ver Rutinas'}
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Categories Bar */}
      <ScrollReveal direction="up" delay={0.08} duration={0.4}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#56A867] text-black font-bold shadow-[0_0_15px_rgba(86,168,103,0.25)]'
                  : 'bg-[#151520] text-[#9E9EA8] hover:text-white hover:bg-[#1E1E2C] border border-[#222232]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Featured News Grid */}
      <ScrollReveal direction="up" delay={0.12} duration={0.4}>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6" staggerDelay={0.06}>
          {filteredNews.map((news) => (
            <StaggerItem key={news.id}>
              <div className="rounded-2xl bg-[#12121A] border border-[#222232] overflow-hidden hover:border-[#56A867]/40 transition-all group flex flex-col justify-between h-full">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={news.imageUrl}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] via-transparent to-black/40" />

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur text-[#56A867] text-[10px] font-mono font-bold uppercase">
                      {news.category}
                    </span>
                    {news.discountBadge && (
                      <span className="px-2 py-0.5 rounded-full bg-[#56A867] text-black text-[10px] font-mono font-bold">
                        {news.discountBadge}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-[#C0C0D0] font-mono">
                    <span>{news.source}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {news.readTime}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white font-serif group-hover:text-[#56A867] transition-colors leading-snug">
                      {news.title}
                    </h3>
                    <p className="text-xs text-[#9E9EA8] mt-2 leading-relaxed">
                      {news.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#20202E] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#7E7E8E]">{news.date}</span>
                    <button
                      onClick={() => onNavigate('exercise-library')}
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#56A867] group-hover:translate-x-1 transition-transform cursor-pointer"
                    >
                      <span>{language === 'en' ? 'View Related Exercises' : 'Ver Ejercicios Relacionados'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </ScrollReveal>
    </div>
  );
};
