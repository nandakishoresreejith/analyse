export interface VisualizationStep {
  array: number[];
  highlights: number[]; // Indices of elements currently being compared/swapped
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}

export enum AlgorithmType {
  INSERTION_SORT = 'INSERTION_SORT',
  BUBBLE_SORT = 'BUBBLE_SORT',
  SELECTION_SORT = 'SELECTION_SORT',
  QUICK_SORT = 'QUICK_SORT',
}

export interface ExecutionResult {
  steps: VisualizationStep[];
  error?: string;
  logs: string[];
}