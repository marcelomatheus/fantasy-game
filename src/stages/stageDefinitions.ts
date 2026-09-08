import type { StageId } from '../types/game.js';

export interface StageDefinition {
  id: StageId;
  name: string;
  subtitle: string;
  timeOfDay: string;
}

export const STAGES: StageDefinition[] = [
  { id:'cristo', name:'CORCOVADO HEIGHTS', subtitle:'Silhueta do Cristo, morros cariocas e luz dourada sobre a baía', timeOfDay:'Sunset' },
  { id:'amazonia', name:'AMAZON TWILIGHT', subtitle:'Floresta densa com rio, névoa e profundidade de camadas', timeOfDay:'Mist' },
  { id:'colonial', name:'OURO SQUARE', subtitle:'Centro histórico colonial com telhados, igreja e bandeirolas', timeOfDay:'Afternoon' },
  { id:'sertao', name:'SERTÃO ARENA', subtitle:'Caatinga estilizada, rochas, mandacarus e calor do interior', timeOfDay:'Dusk' }
];

export const getStage = (id: StageId): StageDefinition => STAGES.find(stage => stage.id === id) ?? STAGES[0]!;
