"use client"

import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { NeuCard, NeuCardContent, NeuCardHeader, NeuCardTitle } from "@/components/ui/neu-card"
import { ShieldCheck, Database, Lock, Users, Cookie, FileText } from "lucide-react"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-20 px-4 bg-muted/30">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                <ShieldCheck className="w-12 h-12 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                            Privacy Policy
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Quizya is committed to protecting the privacy of all users, including teachers, students, guests, and administrators.
                        </p>
                    </div>
                </section>

                <section className="py-20 px-4 bg-background">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold">Information We Collect</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                We collect only the information necessary to provide you with a secure and efficient exam platform.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Users className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Account Information</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Name, email, and role (teacher or student) to manage your account and personalize your experience.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Exam-Related Data</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Answers, scores, and exam sessions to provide accurate results and analytics for performance tracking.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Users className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Guest Information</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Name and email for guest exam access, allowing participation without full account registration.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Proctoring Data</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Tab switching or fullscreen exit events to ensure exam integrity and prevent academic dishonesty.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Database className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Technical Data</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Required platform functionality data to ensure smooth operation and optimal user experience.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>
                        </div>
                    </div>
                </section>

                <section className="py-20 px-4 bg-muted/30">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold">How We Use Your Information</h2>
                            <p className="text-lg text-muted-foreground">
                                Your data powers the features that make Quizya work effectively for everyone.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            <NeuCard className="bg-background">
                                <NeuCardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                            <Users className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">Account Management</h3>
                                            <p className="text-sm text-muted-foreground">
                                                To create and manage user accounts securely and efficiently.
                                            </p>
                                        </div>
                                    </div>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background">
                                <NeuCardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                            <FileText className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">Exam Creation & Management</h3>
                                            <p className="text-sm text-muted-foreground">
                                                To allow teachers to create and manage exams with full control and flexibility.
                                            </p>
                                        </div>
                                    </div>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background">
                                <NeuCardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                            <Users className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">Exam Participation</h3>
                                            <p className="text-sm text-muted-foreground">
                                                To allow students and guests to join and take exams seamlessly.
                                            </p>
                                        </div>
                                    </div>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background">
                                <NeuCardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                            <Database className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">Analytics & Insights</h3>
                                            <p className="text-sm text-muted-foreground">
                                                To generate analytics and performance insights that help improve learning outcomes.
                                            </p>
                                        </div>
                                    </div>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background">
                                <NeuCardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                            <ShieldCheck className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">Security & Integrity</h3>
                                            <p className="text-sm text-muted-foreground">
                                                To ensure exam integrity and platform security for all users.
                                            </p>
                                        </div>
                                    </div>
                                </NeuCardContent>
                            </NeuCard>
                        </div>
                    </div>
                </section>

                <section className="py-20 px-4 bg-background">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <NeuCard className="bg-muted/30 border-2">
                            <NeuCardHeader>
                                <div className="flex items-center gap-3">
                                    <Cookie className="w-10 h-10 text-primary" />
                                    <NeuCardTitle className="text-2xl">Cookies</NeuCardTitle>
                                </div>
                            </NeuCardHeader>
                            <NeuCardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    We use cookies only to:
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Keep users logged in</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Improve the overall user experience</span>
                                    </li>
                                </ul>
                                <p className="text-sm text-muted-foreground font-medium pt-2">
                                    We do not use cookies for advertising or third-party tracking.
                                </p>
                            </NeuCardContent>
                        </NeuCard>

                        <NeuCard className="bg-muted/30 border-2">
                            <NeuCardHeader>
                                <div className="flex items-center gap-3">
                                    <Lock className="w-10 h-10 text-primary" />
                                    <NeuCardTitle className="text-2xl">Data Security</NeuCardTitle>
                                </div>
                            </NeuCardHeader>
                            <NeuCardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    All data is stored securely using Supabase with:
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Role-based access control</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Row Level Security (RLS)</span>
                                    </li>
                                </ul>
                                <p className="text-sm text-muted-foreground font-medium pt-2">
                                    Only authorized users can access relevant data.
                                </p>
                            </NeuCardContent>
                        </NeuCard>

                        <NeuCard className="bg-muted/30 border-2">
                            <NeuCardHeader>
                                <div className="flex items-center gap-3">
                                    <Users className="w-10 h-10 text-primary" />
                                    <NeuCardTitle className="text-2xl">User Rights</NeuCardTitle>
                                </div>
                            </NeuCardHeader>
                            <NeuCardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    You have the following rights:
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Update or delete your account</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Request data removal by contacting platform administrators</span>
                                    </li>
                                </ul>
                            </NeuCardContent>
                        </NeuCard>
                    </div>
                </section>

                <section className="py-20 px-4 bg-muted/30">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold">Questions About Privacy?</h2>
                        <p className="text-lg text-muted-foreground">
                            If you have any questions or concerns about our privacy policy or how we handle your data, please don't hesitate to contact us.
                        </p>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
