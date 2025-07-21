export const FREE_COFFEE_CHAT = "Free Coffee Chat (15 Mins)"

export const allServiceTypes = [
  { key: "consultation", label: FREE_COFFEE_CHAT },
  { key: "mock_interview", label: "Mock Interview" },
  { key: "resume_review", label: "Resume Review" },
  { key: "behavioral_coaching", label: "Behavioral Question Coaching" },
  { key: "job_search", label: "Job Search Guidance" },
  { key: "career_guidance", label: "General Career Advice" },
  { key: "salary_negotiation", label: "Salary Negotiation" },
  { key: "promotion_strategy", label: "Promotion Strategy" },
  { key: "role_deep_dive", label: "My Company / Role Deep Dive" },
  { key: "grad_school", label: "Grad School Application Advice" },
];

export const SERVICE_OPTIONS = allServiceTypes.map(item => item.label);

export const isFreeCoffeeChat = (serviceType: string | null) => {
  if (!serviceType) return false;
  return serviceType.toLowerCase() === FREE_COFFEE_CHAT.toLowerCase();
}
