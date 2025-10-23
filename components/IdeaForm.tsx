import React from 'react';
import type { IdeaType, SubType, Language } from '../types';
import { IDEA_TYPES, SUB_TYPES, LANGUAGES } from '../constants';
import { MusicNoteIcon, BookOpenIcon, MicrophoneIcon } from './icons';

interface IdeaFormProps {
  idea: string;
  setIdea: (idea: string) => void;
  ideaType: IdeaType;
  setIdeaType: (type: IdeaType) => void;
  subType: SubType;
  setSubType: (type: SubType) => void;
  language: string;
  setLanguage: (language: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const TypeIcon = ({ type }: { type: IdeaType }) => {
    switch (type) {
        case 'Song': return <MusicNoteIcon />;
        case 'Story': return <BookOpenIcon />;
        case 'Narration / Description': return <MicrophoneIcon />;
        default: return null;
    }
}

const IdeaForm: React.FC<IdeaFormProps> = ({
  idea, setIdea, ideaType, setIdeaType, subType, setSubType, language, setLanguage, handleSubmit, isLoading
}) => {
  const showSubTypes = ideaType === 'Song' || ideaType === 'Story';

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 w-full space-y-6">
      <div className="space-y-2">
        <label htmlFor="idea" className="text-lg font-semibold text-purple-300">Your Brilliant Idea</label>
        <textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g., A friendly robot who discovers a magical garden..."
          className="w-full h-32 p-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-300 text-white"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-lg font-semibold text-purple-300">Choose Content Type</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {IDEA_TYPES.map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setIdeaType(type)}
              className={`flex items-center justify-center p-4 rounded-lg text-center font-semibold transition-all duration-300 border-2 ${ideaType === type ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'}`}
            >
              <TypeIcon type={type} />
              <span className="ml-2">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {showSubTypes && (
        <div className="space-y-2 animate-fade-in">
          <label className="text-lg font-semibold text-purple-300">Audience</label>
          <div className="flex gap-3 bg-gray-700 p-1 rounded-full">
            {SUB_TYPES.map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setSubType(type)}
                className={`w-full py-2 rounded-full font-semibold transition-colors duration-300 ${subType === type ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-gray-600'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="language-select" className="text-lg font-semibold text-purple-300">Language Selection</label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-300 text-white"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
      >
        {isLoading ? 'Generating...' : '✨ Spark Creativity'}
      </button>
    </form>
  );
};

export default IdeaForm;
