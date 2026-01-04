
export enum EngineeringField {
  MECHANICAL = 'Mechanical',
  ELECTRICAL = 'Electrical',
  CIVIL = 'Civil',
  CHEMICAL = 'Chemical'
}

export interface DiagnosticNode {
  hypothesis: string;
  test: string;
}

export interface BOMItem {
  itemName: string;
  specification: string;
  quantity: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface ProblemSolution {
  id: string;
  timestamp: number;
  field: EngineeringField;
  query: string;
  image?: string;
  analysis: string;
  safetyCheck?: string;
  diagnosticTree?: DiagnosticNode[];
  clarificationQuestions?: string[];
  projectScopeConfirm?: string;
  timeToComplete?: string;
  followUp24h?: string[];
  followUp7d?: string[];
  billOfMaterials?: BOMItem[];
  variables: Record<string, string>;
  steps: string[];
  finalResult: string;
  confidence: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}
