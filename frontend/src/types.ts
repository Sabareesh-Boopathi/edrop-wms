// frontend/src/types.ts

export interface Milestone {
  id: string;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  milestone_value: number;
  description?: string;
  timestamp: string;
  auto_triggered: boolean;
  user_id?: string;
}