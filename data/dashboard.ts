import type {
  ContinueTask,
  DashboardModule,
  DashboardStat,
  RecentActivity,
} from "@/types/dashboard";

export const dashboardStats: DashboardStat[] = [
  {
    id: "overall-progress",
    title: "Overall Progress",
    value: "67%",
    progress: 67,
    icon: "progress",
  },
  {
    id: "completed-tasks",
    title: "Completed Tasks",
    value: "2 / 3",
    icon: "completed",
  },
  {
    id: "current-streak",
    title: "Current Streak",
    value: "5 days",
    icon: "streak",
  },
];

export const continueTask: ContinueTask = {
  id: "task-003",
  title: "Task 03: Loop and Sum",
  topic: "Loops",
  difficulty: "medium",
  progress: 60,
  lastStudied: "2 hours ago",
  description:
    "Practice using loops to calculate the sum of a sequence of numbers.",
  href: "/tasks/task-003",
};

export const courseModules: DashboardModule[] = [
  {
    id: "variables",
    name: "Variables",
    description: "Store values and use names to make programs easier to read.",
    progress: 100,
    status: "completed",
    href: "/tasks?topic=variables",
    icon: "braces",
  },
  {
    id: "conditionals",
    name: "Conditionals",
    description: "Choose different code paths with clear logical tests.",
    progress: 100,
    status: "completed",
    href: "/tasks?topic=conditionals",
    icon: "gitBranch",
  },
  {
    id: "loops",
    name: "Loops",
    description: "Repeat actions while keeping code compact and predictable.",
    progress: 60,
    status: "in_progress",
    href: "/tasks?topic=loops",
    icon: "refresh",
  },
];

export const recentActivities: RecentActivity[] = [
  {
    id: "activity-001",
    taskTitle: "Task 03: Loop and Sum",
    action: "saved",
    timestamp: "Yesterday, 4:20 PM",
    href: "/tasks/task-003",
  },
  {
    id: "activity-003",
    taskTitle: "Task 02: Grade Calculator",
    action: "ai_used",
    timestamp: "July 2, 2:15 PM",
    href: "/tasks/task-002",
  },
  {
    id: "activity-004",
    taskTitle: "Task 01: Variables Basics",
    action: "completed",
    timestamp: "July 1, 11:40 AM",
    href: "/tasks/task-001",
  },
];
