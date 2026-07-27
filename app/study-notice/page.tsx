import { AuthInfoPage } from "@/components/auth/auth-info-page";

const sections = [
  {
    title: "Purpose of the Study",
    body: "This platform explores how Socratic AI tutoring and multi-agent support can help students learn programming.",
  },
  {
    title: "What You May Do",
    body: "You may complete programming tasks, interact with AI tutor agents, run code, and reflect on your learning process.",
  },
  {
    title: "Data Used for Learning Analytics",
    body: "The system may record task progress, interaction patterns, run results, and tutor usage for educational research.",
  },
  {
    title: "Voluntary Participation",
    body: "This prototype is for learning and research demonstration.",
  },
  {
    title: "No Direct Answers",
    body: "The tutor is designed to guide your thinking instead of giving full solutions.",
  },
];

export default function StudyNoticePage() {
  return <AuthInfoPage title="Study Notice" sections={sections} />;
}
