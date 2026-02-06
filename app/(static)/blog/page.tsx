"use client"

import { useState } from "react"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card"
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react"

interface FAQItem {
    question: string
    answer: string
}

const faqs: FAQItem[] = [
    {
        question: "What is Quizya?",
        answer: "Quizya is an online examination platform that allows teachers to create exams and students or guests to take them in real time."
    },
    {
        question: "Who can create exams?",
        answer: "Only users with a teacher role can create and manage exams."
    },
    {
        question: "How can students join an exam?",
        answer: "Students can join through their account, and guests can join using a room code provided by the teacher."
    },
    {
        question: "Does Quizya support proctoring?",
        answer: "Yes, Quizya supports basic proctoring features such as tab-switch detection and fullscreen exit detection."
    },
    {
        question: "Can teachers view student performance?",
        answer: "Yes, teachers have access to exam results and performance analytics."
    },
    {
        question: "Are results shown immediately after the exam?",
        answer: "This depends on the exam settings chosen by the teacher."
    }
]

function FAQAccordion({ faq, isOpen, onToggle }: { faq: FAQItem; isOpen: boolean; onToggle: () => void }) {
    return (
        <NeuCard className="bg-background border-2 hover:border-primary/30 transition-all cursor-pointer" onClick={onToggle}>
            <NeuCardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                        <HelpCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        <h3 className="font-semibold text-lg">{faq.question}</h3>
                    </div>
                    <div className="flex-shrink-0">
                        {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-primary" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                    </div>
                </div>
                
                {isOpen && (
                    <div className="mt-4 pl-8 pr-8">
                        <p className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                        </p>
                    </div>
                )}
            </NeuCardContent>
        </NeuCard>
    )
}

export default function BlogPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-20 px-4 bg-muted/30">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                <HelpCircle className="w-12 h-12 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Find answers to common questions about Quizya and how it works.
                        </p>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-20 px-4 bg-background">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {faqs.map((faq, index) => (
                            <FAQAccordion
                                key={index}
                                faq={faq}
                                isOpen={openIndex === index}
                                onToggle={() => handleToggle(index)}
                            />
                        ))}
                    </div>
                </section>

                {/* Contact Section */}
                <section className="py-20 px-4 bg-muted/30">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold">Still Have Questions?</h2>
                        <p className="text-lg text-muted-foreground">
                            If you couldn't find the answer you were looking for, feel free to contact our support team.
                        </p>
                        
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
