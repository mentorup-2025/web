import React from "react";
import { Metadata } from "next";
import Page from "./index";
export const metadata: Metadata = {
  title: "Log In to Your MentorUp Account - Access Mentorship Opportunities",
  description:
    "Welcome back to MentorUp! Log in to your account to continue your journey towards career growth. Securely access mentorship opportunities and resources.",
};
export default function LoginPage() {
  return <Page />;
}
