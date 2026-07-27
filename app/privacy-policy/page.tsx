import { AuthInfoPage } from "@/components/auth/auth-info-page";

const sections = [
  {
    title: "Data We Collect",
    body: "We may store your account information, task progress, code submissions, and tutor interactions for learning purposes.",
  },
  {
    title: "How We Use Data",
    body: "We use data to provide programming practice, Socratic tutoring, progress tracking, and learning feedback.",
  },
  {
    title: "AI Tutor Data",
    body: "Tutor messages and code context may be used to generate guidance, but the tutor should not expose private data.",
  },
  {
    title: "Prototype Notice",
    body: "This project is a research prototype and not a production learning management system.",
  },
  {
    title: "Contact",
    body: "For questions, contact the project team.",
  },
];

export default function PrivacyPolicyPage() {
  return <AuthInfoPage title="Privacy Policy" sections={sections} />;
}
