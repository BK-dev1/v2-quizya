"use client"

import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { NeuCard, NeuCardContent, NeuCardHeader, NeuCardTitle } from "@/components/ui/neu-card"
import { Accessibility, Keyboard, Eye, Laptop, Palette, MessageCircle, Target } from "lucide-react"

export default function AccessibilityPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-20 px-4 bg-muted/30">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                <Accessibility className="w-12 h-12 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                            Accessibility
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Quizya is committed to providing an accessible and inclusive experience for all users.
                        </p>
                    </div>
                </section>

                {/* Our Commitment Section */}
                <section className="py-20 px-4 bg-background">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold">We Strive To</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Making Quizya accessible to everyone is a core part of our mission.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Keyboard className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Keyboard Navigation</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Support full keyboard navigation throughout the platform for users who cannot or prefer not to use a mouse.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Eye className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Readable Design</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Ensure readable fonts and sufficient color contrast to support users with visual impairments.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Laptop className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Responsive Layouts</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Provide responsive layouts that work seamlessly across different screen sizes and devices.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Accessibility className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Assistive Technologies</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Maintain compatibility with assistive technologies like screen readers where possible.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Palette className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Theme Options</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Offer light and dark themes for visual comfort and to reduce eye strain.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>

                            <NeuCard className="bg-background hover:shadow-lg transition-shadow">
                                <NeuCardHeader>
                                    <div className="flex items-center gap-3">
                                        <Target className="w-8 h-8 text-primary" />
                                        <NeuCardTitle>Focus Indicators</NeuCardTitle>
                                    </div>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Provide clear visual indicators for focused elements to help users navigate and interact with the platform.
                                    </p>
                                </NeuCardContent>
                            </NeuCard>
                        </div>
                    </div>
                </section>

                {/* Feedback Section */}
                <section className="py-20 px-4 bg-muted/30">
                    <div className="max-w-4xl mx-auto">
                        <NeuCard className="bg-background border-2 border-primary/20">
                            <NeuCardHeader className="text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                        <MessageCircle className="w-10 h-10 text-primary" />
                                    </div>
                                </div>
                                <NeuCardTitle className="text-2xl">Help Us Improve</NeuCardTitle>
                            </NeuCardHeader>
                            <NeuCardContent className="space-y-4 text-center">
                                <p className="text-muted-foreground">
                                    If you encounter any accessibility barriers while using Quizya, we encourage you to contact us so improvements can be made.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Your feedback is invaluable in helping us create a more inclusive platform for everyone.
                                </p>
                            </NeuCardContent>
                        </NeuCard>
                    </div>
                </section>

                {/* Ongoing Commitment Section */}
                <section className="py-20 px-4 bg-background">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold">Our Ongoing Commitment</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Accessibility is not a one-time effort but an ongoing commitment. We continuously work to improve the accessibility of Quizya and welcome your input in this process.
                        </p>
                        
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
