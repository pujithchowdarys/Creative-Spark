export type IdeaType = 'Song' | 'Story' | 'Narration / Description';
export type SubType = 'Kids' | 'Adult';

export interface Language {
  value: string;
  label: string;
  voiceName: string; // Default voice for the language
}

export interface VoiceProfile {
  value: string; // Corresponds to the voiceName
  label: string; // Descriptive label for the UI
}

export interface DialoguePart {
  speaker: string;
  line: string;
}

export interface Dialogue {
  title?: string;
  dialogue: DialoguePart[];
}

// New interface for the complete generated output
export interface CreativeContentOutput {
  mainContent: string | Dialogue; // Could be song lyrics, story text, or dialogue object
  moral: string; // The moral or key takeaway from the content
}