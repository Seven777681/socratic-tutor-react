import { AuthInfoPage } from "@/components/auth/auth-info-page";

const sections = [
  {
    title: "Educational Use",
    body: "This platform is intended for programming learning and research demonstration.",
  },
  {
    title: "User Responsibilities",
    body: "Users should submit their own work and use AI guidance for learning rather than copying answers.",
  },
  {
    title: "AI Guidance Limitation",
    body: "The AI tutor provides guidance questions and may not always be correct.",
  },
  {
    title: "Academic Integrity",
    body: "The platform is designed to support thinking, not to provide complete solutions.",
  },
  {
    title: "Prototype Status",
    body: "Features may change during development.",
  },
];

export default function TermsOfServicePage() {
  return <AuthInfoPage title="Terms of Service" sections={sections} />;
}
