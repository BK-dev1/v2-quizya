"use client"

import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { NeuCard, NeuCardContent, NeuCardHeader, NeuCardTitle } from "@/components/ui/neu-card"
import { FileText, Users, ShieldAlert, UserX, Clock } from "lucide-react"

export default function TermsPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <section className="py-20 px-4 bg-muted/30">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                <FileText className="w-12 h-12 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                            Terms of Service
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            By accessing or using Quizya, you agree to the following terms.
                        </p>
                    </div>
                </section>

                <section className="py-20 px-4 bg-background">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold">User Roles</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Different roles provide different capabilities within the Quizya platform.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Users className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Teachers</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Can create, manage, and publish exams with full control over their content and settings.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Users className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Students</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Can participate in exams and view their results and performance analytics.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Users className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Guests</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Can join exams using room codes without authentication for quick access.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <ShieldAlert className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Admins</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Manage system-wide settings and analytics with elevated privileges.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>
                        </div>
                    </div>
                </section>

                <section className="py-20 px-4 bg-muted/30">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold">User Responsibilities</h2>
                            <p className="text-lg text-muted-foreground">
                                All users must adhere to these responsibilities when using Quizya.
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
                                            <h3 className="font-semibold mb-1">Accurate Information</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Users must provide accurate and truthful information when creating accounts and using the platform.
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
                                            <h3 className="font-semibold mb-1">Teacher Content Responsibility</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Teachers are responsible for the content of their exams and ensuring it is appropriate and accurate.
                                            </p>
                                        </div>
                                    </div>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background">
                                <NeuCardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                            <ShieldAlert className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">Platform Integrity</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Students and guests must not engage in cheating or misuse of the platform to maintain exam integrity.
                                            </p>
                                        </div>
                                    </div>
                                </NeuCardContent>
                            </NeuCard>
                        </div>
                    </div>
                </section>

                <section className="py-20 px-4 bg-background">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold">Prohibited Activities</h2>
                            <p className="text-lg text-muted-foreground">
                                The following activities are strictly prohibited on Quizya.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            <NeuCard className="bg-background border-destructive/20">
                                <NeuCardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
                                            <UserX className="w-5 h-5 text-destructive" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">Fake Accounts</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Creating fake or misleading accounts to deceive other users or the system.
                                            </p>
                                        </div>
                                    </div>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background border-destructive/20">
                                <NeuCardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
                                            <ShieldAlert className="w-5 h-5 text-destructive" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">Bypassing Proctoring</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Attempting to bypass or disable proctoring mechanisms designed to ensure exam integrity.
                                            </p>
                                        </div>
                                    </div>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background border-destructive/20">
                                <NeuCardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
                                            <FileText className="w-5 h-5 text-destructive" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">Unauthorized Sharing</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Sharing exam content or answers without permission from the exam creator.
                                            </p>
                                        </div>
                                    </div>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background border-destructive/20">
                                <NeuCardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
                                            <ShieldAlert className="w-5 h-5 text-destructive" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">Harmful Content</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Uploading harmful, inappropriate, or offensive content that violates community standards.
                                            </p>
                                        </div>
                                    </div>
                                </NeuCardContent>
                            </NeuCard>
                        </div>
                    </div>
                </section>

                <section className="py-20 px-4 bg-muted/30">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <NeuCard className="bg-background border-2">
                            <NeuCardHeader>
                                <div className="flex items-center gap-3">
                                    <UserX className="w-10 h-10 text-primary" />
                                    <NeuCardTitle className="text-2xl">Account Suspension</NeuCardTitle>
                                </div>
                            </NeuCardHeader>
                            <NeuCardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Quizya reserves the right to suspend or terminate accounts that violate these terms.
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Violations will be reviewed on a case-by-case basis</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Repeated violations may result in permanent suspension</span>
                                    </li>
                                </ul>
                            </NeuCardContent>
                        </NeuCard>

                        <NeuCard className="bg-background border-2">
                            <NeuCardHeader>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-10 h-10 text-primary" />
                                    <NeuCardTitle className="text-2xl">Service Availability</NeuCardTitle>
                                </div>
                            </NeuCardHeader>
                            <NeuCardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    While we aim to provide uninterrupted access, Quizya does not guarantee continuous availability of the service.
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Maintenance may be performed as needed</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Downtime will be minimized whenever possible</span>
                                    </li>
                                </ul>
                            </NeuCardContent>
                        </NeuCard>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="py-20 px-4 bg-background">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold">Questions About These Terms?</h2>
                        <p className="text-lg text-muted-foreground">
                            If you have any questions or concerns about our terms of service, please don't hesitate to contact us.
                        </p>
                       
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
