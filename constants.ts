import { IdeaType, SubType, Language, VoiceProfile } from './types';

export const IDEA_TYPES: IdeaType[] = ['Song', 'Story', 'Narration / Description'];
export const SUB_TYPES: SubType[] = ['Kids', 'Adult'];

export const LANGUAGES: Language[] = [
  { value: 'English', label: 'English', voiceName: 'Puck' },
  { value: 'Hindi', label: 'Hindi', voiceName: 'Kore' },
  { value: 'Tamil', label: 'Tamil', voiceName: 'Zephyr' },
  { value: 'Telugu', label: 'Telugu', voiceName: 'Fenrir' },
];

export const SPEAKER_VOICES: VoiceProfile[] = [
  { value: 'Puck', label: 'Narrator - Confident & Clear Male' },
  { value: 'Kore', label: 'Storyteller - Warm & Expressive Female' },
  { value: 'Charon', label: 'Announcer - Deep & Authoritative Male' },
  { value: 'Zephyr', label: 'Character - Energetic & Playful Boy' },
  { value: 'Fenrir', label: 'Character - Gentle & Whimsical Girl' },
];