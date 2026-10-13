/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Search,
  Check,
  X,
  Sparkles,
  Calendar,
  Tag,
  Save,
  Clock,
  Dumbbell,
  Apple,
  Zap,
  Award,
} from 'lucide-react';
import { UserNote } from '../../types';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';

interface AthleteNotesWidgetProps {
  userId: string;
}

export const AthleteNotesWidget: React.FC<AthleteNotesWidgetProps> = ({ userId }) => {
  const { language, theme } = useApp();
  const isDark = theme === 'dark';

  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal / Creator State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<UserNote['category']>('Entrenamiento');
  const [notePinned, setNotePinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const categories = [
    {
      id: 'all',
      label: language === 'en' ? 'All Notes' : 'Todas',
      icon: BookOpen,
    },
    {
      id: 'Entrenamiento',
      label: language === 'en' ? 'Workout' : 'Entrenamiento',
      icon: Dumbbell,
      color: 'text-[#56A867]',
      bgColor: 'bg-[#56A867]/15',
    },
    {
      id: 'Marcas Personales',
      label: language === 'en' ? 'PR / 1RM' : 'Marcas Personales',
      icon: Award,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/15',
    },
    {
      id: 'Nutrición',
      label: language === 'en' ? 'Nutrition' : 'Nutrición',
      icon: Apple,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/15',
    },
    {
      id: 'Recuperación',
      label: language === 'en' ? 'Recovery' : 'Recuperación',
      icon: Zap,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/15',
    },
    {
      id: 'General',
      label: language === 'en' ? 'General' : 'General',
      icon: Tag,
      color: 'text-neutral-400',
      bgColor: 'bg-neutral-400/15',
    },
  ];

  const fetchNotes = async () => {
    if (!userId) return;
    try {
      const list = await authService.getUserNotes(userId);
      setNotes(list);
    } catch (e) {
      console.error('Failed to load notes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const handleOpenNewNote = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('Entrenamiento');
    setNotePinned(false);
    setIsEditorOpen(true);
  };

  const handleOpenEditNote = (note: UserNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteCategory(note.category);
    setNotePinned(!!note.pinned);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingNoteId) {
        // Update
        const updated = await authService.updateUserNote(userId, editingNoteId, {
          title: noteTitle.trim() || (language === 'en' ? 'Training Note' : 'Nota de Entrenamiento'),
          content: noteContent.trim(),
          category: noteCategory,
          pinned: notePinned,
        });
        if (updated) {
          setNotes((prev) => prev.map((n) => (n.id === editingNoteId ? updated : n)));
          showToast(language === 'en' ? 'Note updated in database!' : '¡Nota actualizada en base de datos!');
        }
      } else {
        // Create
        const created = await authService.createUserNote(userId, {
          title: noteTitle.trim() || (language === 'en' ? 'Training Note' : 'Nota de Entrenamiento'),
          content: noteContent.trim(),
          category: noteCategory,
          pinned: notePinned,
        });
        setNotes((prev) => [created, ...prev]);
        showToast(language === 'en' ? 'Note saved to database!' : '¡Nota guardada en base de datos!');
      }
      setIsEditorOpen(false);
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const confirmMsg =
      language === 'en'
        ? 'Are you sure you want to delete this note from the database?'
        : '¿Estás seguro de eliminar esta nota de la base de datos?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await authService.deleteUserNote(userId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      showToast(language === 'en' ? 'Note deleted from database' : 'Nota eliminada de la base de datos');
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const handleTogglePin = async (note: UserNote) => {
    const newPinned = !note.pinned;
    try {
      const updated = await authService.updateUserNote(userId, note.id, { pinned: newPinned });
      if (updated) {
        setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    const cleanQuery = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !cleanQuery ||
      n.title.toLowerCase().includes(cleanQuery) ||
      n.content.toLowerCase().includes(cleanQuery);
    return matchesCategory && matchesSearch;
  });

  // Sort pinned notes to the top
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Entrenamiento':
        return {
          label: language === 'en' ? 'Workout' : 'Entrenamiento',
          className: 'bg-[#56A867]/20 text-[#56A867] border-[#56A867]/30',
        };
      case 'Marcas Personales':
        return {
          label: language === 'en' ? 'PR / 1RM' : 'Marcas Personales',
          className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        };
      case 'Nutrición':
        return {
          label: language === 'en' ? 'Nutrition' : 'Nutrición',
          className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        };
      case 'Recuperación':
        return {
          label: language === 'en' ? 'Recovery' : 'Recuperación',
          className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        };
      default:
        return {
          label: language === 'en' ? 'General' : 'General',
          className: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30',
        };
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-5 text-left relative overflow-hidden">
      {/* Toast alert */}
      {successToast && (
        <div className="absolute top-4 right-4 z-20 px-3.5 py-2 rounded-xl bg-[#56A867] text-black font-bold text-xs flex items-center gap-1.5 shadow-lg animate-in fade-in duration-200">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#20202A]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#56A867]/15 text-[#56A867]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider flex items-center gap-2">
              <span>{language === 'en' ? 'Personal Notes & Training Journal' : 'Notas Personales & Diario de Entrenamiento'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1B1B26] text-[#56A867] border border-[#2A2A38] font-semibold">
                {notes.length} {language === 'en' ? 'saved in DB' : 'en BD'}
              </span>
            </h3>
            <p className="text-[11px] text-[#8E8E9E]">
              {language === 'en'
                ? 'Your personal reflections, 1RM milestones, and recovery notes saved in the database'
                : 'Tus reflexiones personales, sensaciones tras entrenar y marcas 1RM guardadas en la base de datos'}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNewNote}
          className="px-3.5 py-2 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(86,168,103,0.25)] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{language === 'en' ? 'Add Note' : 'Nueva Nota'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#56A867] text-black font-bold shadow-sm'
                    : 'bg-[#181824] text-[#A0A0B0] hover:text-white border border-[#252535]'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative sm:w-60">
          <Search className="w-3.5 h-3.5 text-[#707080] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search notes...' : 'Buscar en notas...'}
            className="w-full bg-[#161622] text-xs text-white pl-8 pr-3 py-1.5 rounded-xl border border-[#252535] focus:border-[#56A867] focus:outline-none placeholder:text-[#606070]"
          />
        </div>
      </div>

      {/* Notes Grid Display */}
      {loading ? (
        <div className="py-8 text-center text-xs text-[#808090] font-mono">
          {language === 'en' ? 'Loading notes from database...' : 'Cargando notas de la base de datos...'}
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="p-8 rounded-xl bg-[#151520] border border-dashed border-[#282838] text-center space-y-2">
          <BookOpen className="w-8 h-8 text-[#56A867]/40 mx-auto" />
          <h4 className="text-sm font-bold text-white">
            {language === 'en' ? 'No notes in this category' : 'No hay notas en esta categoría'}
          </h4>
          <p className="text-xs text-[#8E8E9E] max-w-sm mx-auto">
            {language === 'en'
              ? 'Record your feelings after your next session, record your personal bests, or write technical reminders.'
              : 'Registra tus sensaciones tras la sesión, anota tus récords personales o escribe recordatorios técnicos.'}
          </p>
          <button
            onClick={handleOpenNewNote}
            className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs font-mono uppercase inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Create First Note' : 'Crear Primera Nota'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedNotes.map((note) => {
            const badge = getCategoryBadge(note.category);
            return (
              <div
                key={note.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all group ${
                  note.pinned
                    ? 'bg-[#181826] border-[#56A867]/50 shadow-[0_0_15px_rgba(86,168,103,0.08)]'
                    : 'bg-[#151520] border-[#242432] hover:border-[#38384C]'
                }`}
              >
                <div>
                  {/* Note header: Category + Pin + Actions */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(note)}
                        title={note.pinned ? (language === 'en' ? 'Unpin note' : 'Desfijar') : (language === 'en' ? 'Pin note' : 'Fijar')}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${
                          note.pinned ? 'text-[#56A867]' : 'text-[#606070] hover:text-white'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" fill={note.pinned ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => handleOpenEditNote(note)}
                        title={language === 'en' ? 'Edit note' : 'Editar'}
                        className="p-1 rounded text-[#606070] hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        title={language === 'en' ? 'Delete note' : 'Eliminar'}
                        className="p-1 rounded text-[#606070] hover:text-rose-400 hover:bg-white/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <h4 className="text-sm font-bold text-white font-serif mb-1 leading-snug">
                    {note.title}
                  </h4>
                  <p className="text-xs text-[#A0A0B2] leading-relaxed whitespace-pre-line line-clamp-4">
                    {note.content}
                  </p>
                </div>

                {/* Footer timestamp */}
                <div className="pt-3 mt-3 border-t border-[#222230] flex items-center justify-between text-[10px] font-mono text-[#707080]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#56A867]" />
                    <span>{note.date}</span>
                  </span>
                  <span className="text-[#56A867]">
                    {language === 'en' ? 'Database Saved' : 'Guardado en BD'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#56A867]/40 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#222230]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#56A867]" />
                <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                  {editingNoteId
                    ? language === 'en'
                      ? 'Edit Note'
                      : 'Editar Nota'
                    : language === 'en'
                    ? 'Create Personal Training Note'
                    : 'Crear Nota de Entrenamiento'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-md text-[#8E8E9E] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#A0A0B0]">
                  {language === 'en' ? 'Note Title' : 'Título de la Nota'}
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder={language === 'en' ? 'e.g., Squat Form Check & PR' : 'Ej: Sentadilla Goblet y Marca Personal'}
                  className="w-full bg-[#181824] text-sm text-white px-3.5 py-2.5 rounded-xl border border-[#252538] focus:border-[#56A867] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#A0A0B0]">
                    {language === 'en' ? 'Category' : 'Categoría'}
                  </label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value as UserNote['category'])}
                    className="w-full bg-[#181824] text-xs sm:text-sm text-white px-3 py-2.5 rounded-xl border border-[#252538] focus:border-[#56A867] focus:outline-none"
                  >
                    <option value="Entrenamiento">{language === 'en' ? 'Workout' : 'Entrenamiento'}</option>
                    <option value="Marcas Personales">{language === 'en' ? 'PR / 1RM Record' : 'Marcas Personales'}</option>
                    <option value="Nutrición">{language === 'en' ? 'Nutrition' : 'Nutrición'}</option>
                    <option value="Recuperación">{language === 'en' ? 'Recovery' : 'Recuperación'}</option>
                    <option value="General">{language === 'en' ? 'General' : 'General'}</option>
                  </select>
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-neutral-300">
                    <input
                      type="checkbox"
                      checked={notePinned}
                      onChange={(e) => setNotePinned(e.target.checked)}
                      className="rounded accent-[#56A867] w-4 h-4"
                    />
                    <span>{language === 'en' ? 'Pin to top' : 'Fijar en la parte superior'}</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#A0A0B0]">
                  {language === 'en' ? 'Content / Observations' : 'Contenido / Observaciones'}
                </label>
                <textarea
                  required
                  rows={5}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Write your sensations, weights lifted, nutrition insights, or recovery status...'
                      : 'Escribe tus sensaciones, cargas superadas, estrategia de nutrición o reflexiones...'
                  }
                  className="w-full bg-[#181824] text-sm text-white p-3 rounded-xl border border-[#252538] focus:border-[#56A867] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2A2A3C] text-xs font-mono text-[#A0A0B0] hover:text-white cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting
                      ? language === 'en'
                        ? 'Saving in DB...'
                        : 'Guardando en BD...'
                      : language === 'en'
                      ? 'Save in Database'
                      : 'Guardar en Base de Datos'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
