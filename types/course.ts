export type CourseModuleId =
  | "getting-started"
  | "variables-data-types"
  | "input-output"
  | "operators"
  | "conditionals"
  | "loops";

export interface CourseModule {
  id: CourseModuleId;
  title: string;
  description: string;
  order: number;
  taskIds: string[];
}

export interface TaskKnowledge {
  title: string;
  points: string[];
  example: string;
  reminder: string;
}
