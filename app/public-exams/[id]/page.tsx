'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import {
    ArrowLeft,
    Clock,
    FileQuestion,
    Users,
    Globe,
    Star,
    Loader2,
    Calendar,
    User,
    CheckCircle2
} from 'lucide-react'

interface Question {
    id: string
    question_text: string
    question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
    options: any
    correct_answer: string
    points: number
    order_index: number
}

interface PublicExam {
    id: string
    title: string
    description: string | null
    duration_minutes: number
    total_questions: number
    passing_score: number
    created_at: string
    room_code: string | null
    profiles: {
        username: string | null
        full_name: string | null
    } | null
    _count?: {
        exam_sessions: number
    }
    questions?: Question[]
}

export default function PublicExamDetailPage() {
    const params = useParams()
    const [exam, setExam] = useState<PublicExam | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAnswers, setShowAnswers] = useState(false)

    useEffect(() => {
        if (params.id) {
            loadExamDetails()
        }
    }, [params.id])

    const loadExamDetails = async () => {
        try {
            const res = await fetch(`/api/public-exams/${params.id}`)
            if (!res.ok) {
                if (res.status === 404) {
                    setError('Exam not found')
                } else {
                    setError('Failed to load exam details')
                }
                return
            }

            const data = await res.json()
            setExam(data)
        } catch (error) {
            console.error('Error loading exam details:', error)
            setError('Failed to load exam details')
        } finally {
            setLoading(false)
        }
    }

    const renderQuestionOptions = (question: Question) => {
        if (question.question_type === 'true_false') {
            return (
                <div className="space-y-2 mt-3">
                    {['True', 'False'].map((option, idx) => (
                        <div
                            key={idx}
                            className={`p-3 rounded-lg border ${showAnswers && option === question.correct_answer
                                ? 'border-green-500 bg-green-50'
                                : 'border-border bg-muted/30'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {showAnswers && option === question.correct_answer && (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                                <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
                                <span>{option}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )
        }

        if (question.question_type === 'multiple_choice' && question.options) {
            const options = Array.isArray(question.options) ? question.options : []
            return (
                <div className="space-y-2 mt-3">
                    {options.map((option: any, idx: number) => {
                        const optionText = typeof option === 'string' ? option : option.text
                        const isCorrect = showAnswers && optionText === question.correct_answer

                        return (
                            <div
                                key={idx}
                                className={`p-3 rounded-lg border ${isCorrect
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-border bg-muted/30'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {isCorrect && (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    )}
                                    <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
                                    <span>{optionText}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )
        }

        if (question.question_type === 'short_answer' || question.question_type === 'essay') {
            return (
                <div className="mt-3">
                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                        <p className="text-sm text-muted-foreground italic">
                            {question.question_type === 'short_answer' ? 'Short answer question' : 'Essay question'}
                        </p>
                        {showAnswers && (
                            <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-sm font-medium text-green-600">Sample Answer:</p>
                                <p className="text-sm mt-1">{question.correct_answer}</p>
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        return null
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading exam details...</p>
                </div>
            </div>
        )
    }

    if (error || !exam) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <NeuCard className="p-8 text-center max-w-md">
                    <h2 className="text-xl font-semibold mb-2">{error || 'Exam not found'}</h2>
                    <p className="text-muted-foreground mb-4">
                        The exam you're looking for doesn't exist or has been removed.
                    </p>
                    <Link href="/dashboard/question-bank">
                        <NeuButton>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Question Bank
                        </NeuButton>
                    </Link>
                </NeuCard>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/dashboard/question-bank">
                        <NeuButton variant="outline" size="sm" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Question Bank
                        </NeuButton>
                    </Link>
                </div>

                {/* Main Content */}
                <NeuCard className="p-6 md:p-8 mb-6">
                    {/* Badge */}
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            Public Exam
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold mb-4">{exam.title}</h1>

                    {/* Description */}
                    {exam.description && (
                        <p className="text-muted-foreground mb-6">{exam.description}</p>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 rounded-xl border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <FileQuestion className="h-4 w-4" />
                                <span className="text-sm">Questions</span>
                            </div>
                            <p className="text-2xl font-bold">{exam.total_questions}</p>
                        </div>

                        <div className="p-4 rounded-xl border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">Duration</span>
                            </div>
                            <p className="text-2xl font-bold">{exam.duration_minutes}m</p>
                        </div>

                        <div className="p-4 rounded-xl border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Star className="h-4 w-4" />
                                <span className="text-sm">Passing</span>
                            </div>
                            <p className="text-2xl font-bold">{exam.passing_score}%</p>
                        </div>

                        <div className="p-4 rounded-xl border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">Attempts</span>
                            </div>
                            <p className="text-2xl font-bold">{exam._count?.exam_sessions || 0}</p>
                        </div>
                    </div>

                    {/* Creator Info */}
                    <div className="p-4 rounded-xl bg-muted/30 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Created by</p>
                                    <p className="font-medium">
                                        {exam.profiles?.full_name || exam.profiles?.username || 'Anonymous'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(exam.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Link href={`/join?exam=${exam.id}`} className="flex-1">
                            <NeuButton className="w-full">
                                Take This Exam
                            </NeuButton>
                        </Link>
                        <NeuButton
                            variant="outline"
                            onClick={() => setShowAnswers(!showAnswers)}
                        >
                            {showAnswers ? 'Hide' : 'Show'} Answers
                        </NeuButton>
                    </div>
                </NeuCard>

                {/* Questions Section */}
                {exam.questions && exam.questions.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold mb-4">Questions</h2>
                        {exam.questions
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((question, index) => (
                                <NeuCard key={question.id} className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="font-bold text-primary">{index + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-lg font-medium">{question.question_text}</h3>
                                                <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                                    {question.points} {question.points === 1 ? 'point' : 'points'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2 capitalize">
                                                {question.question_type.replace('_', ' ')}
                                            </p>
                                            {renderQuestionOptions(question)}
                                        </div>
                                    </div>
                                </NeuCard>
                            ))}
                    </div>
                )}
            </div>
        </div>
    )
}
