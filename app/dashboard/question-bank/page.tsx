'use client'

import dynamic from "next/dynamic";

const QuestionBankList = dynamic(
  () => import("@/components/dashboard/question-bank-list"),
  {
    ssr: false,
  }
);

export default function QuestionBankPage() {
  return <QuestionBankList />;
}
