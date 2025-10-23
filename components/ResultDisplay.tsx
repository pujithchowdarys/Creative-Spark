
import React, { useState, useEffect, useRef } from 'react';
import { DownloadIcon } from './icons';
import { decode, decodePcmToAudioBuffer, createWavBlob } from '../utils/audioUtils';

interface ResultDisplayProps {
  text: string;
  base64Audio: string | null;
  ideaType: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ text, base64Audio, ideaType }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    let isMounted = true;
    if (base64Audio) {
      const decodedPcm = decode(base64Audio);
      decodePcmToAudioBuffer(decodedPcm, audioContextRef.current, 24000, 1)
        .then(audioBuffer => {
          if (isMounted) {
            const source = audioContextRef.current!.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current!.destination);
            audioSourceRef.current = source;
            source.onended = () => setIsPlaying(false);
          }
        });
    }

    return () => {
      isMounted = false;
      audioSourceRef.current?.stop();
      audioSourceRef.current?.disconnect();
      audioSourceRef.current = null;
    };
  }, [base64Audio]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioSourceRef.current?.stop();
      setIsPlaying(false);
    } else {
      if (audioSourceRef.current) {
        // Re-create the source node if it has already been played
        if (audioSourceRef.current.buffer) {
          const newSource = audioContextRef.current!.createBufferSource();
          newSource.buffer = audioSourceRef.current.buffer;
          newSource.connect(audioContextRef.current!.destination);
          newSource.onended = () => setIsPlaying(false);
          newSource.start();
          audioSourceRef.current = newSource;
          setIsPlaying(true);
        }
      }
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ideaType.toLowerCase().replace(/ /g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = () => {
    if (base64Audio) {
      const pcmData = decode(base64Audio);
      const blob = createWavBlob(pcmData, 24000, 1, 16);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voiceover.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 w-full space-y-6 animate-fade-in">
      <div>
        <h3 className="text-2xl font-bold text-purple-300 mb-4">Generated Content</h3>
        <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-gray-300">
          {text}
        </div>
        <button
          onClick={handleDownloadText}
          className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-900"
        >
          <DownloadIcon />
          Download Text
        </button>
      </div>
      {base64Audio && (
        <div>
          <h3 className="text-2xl font-bold text-purple-300 mb-4">Voiceover</h3>
          <div className="flex items-center space-x-4">
             <button
              onClick={handlePlayPause}
              className="px-6 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition-colors duration-300 text-lg"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={handleDownloadAudio}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
            >
              <DownloadIcon />
              Download Audio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
