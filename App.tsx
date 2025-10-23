import React, { useState } from 'react';
import IdeaForm from './components/IdeaForm';
import ResultDisplay from './components/ResultDisplay';
import Loader from './components/Loader';
import { generateCreativeContent } from './services/geminiService';
import type { IdeaType, SubType } from './types';
import { LANGUAGES } from './constants';

const App: React.FC = () => {
  const [idea, setIdea] = useState<string>('');
  const [ideaType, setIdeaType] = useState<IdeaType>('Song');
  const [subType, setSubType] = useState<SubType>('Regular');
  const [language, setLanguage] = useState<string>(LANGUAGES[0].value);
  
  const [generatedText, setGeneratedText] = useState<string>('');
  const [base64Audio, setBase64Audio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedText('');
    setBase64Audio(null);

    try {
      const selectedLanguage = LANGUAGES.find(lang => lang.value === language);
      if (!selectedLanguage) {
        throw new Error("Invalid language selected.");
      }

      const result = await generateCreativeContent(idea, ideaType, subType, selectedLanguage.value, selectedLanguage.voiceName);
      setGeneratedText(result.generatedText);
      setBase64Audio(result.base64Audio);
    } catch (err: any) {
      console.error(err);
      setError('An error occurred while generating content. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Creative Spark
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Turn your ideas into songs, stories, and narrations.
          </p>
        </header>

        <main className="w-full">
            <IdeaForm
              idea={idea}
              setIdea={setIdea}
              ideaType={ideaType}
              setIdeaType={setIdeaType}
              subType={subType}
              setSubType={setSubType}
              language={language}
              setLanguage={setLanguage}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
            />

          {error && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center animate-fade-in">
              {error}
            </div>
          )}

          <div className="mt-8">
            {isLoading && <Loader />}
            {!isLoading && generatedText && (
              <ResultDisplay text={generatedText} base64Audio={base64Audio} ideaType={ideaType}/>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
