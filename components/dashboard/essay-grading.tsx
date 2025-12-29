'use client'

import { useState } from 'react'
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuInput } from '@/components/ui/neu-input'
import { FileEdit, Save, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface EssayAnswer {
    question_id: string
    question_text: string
    answer: string
    points_earned: number
    max_points: number
}

interface EssayGradingProps {
    sessionId: string
    studentName: string
    essays: EssayAnswer[]
    onGraded: () => void
}

export default function EssayGrading({ sessionId, studentName, essays, onGraded }: EssayGradingProps) {
    const { t } = useTranslation()
    const [grades, setGrades] = useState<Record<string, number>>(
        essays.reduce((acc, essay) => ({
            ...acc,
            [essay.question_id]: essay.points_earned
        }), {})
    )
    const [saving, setSaving] = useState(false)

    const handleGradeChange = (questionId: string, value: string) => {
        const numValue = parseFloat(value) || 0
        setGrades(prev => ({ ...prev, [questionId]: numValue }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const essay_grades = Object.entries(grades).map(([question_id, points_earned]) => ({
                question_id,
                points_earned
            }))

            const res = await fetch(`/api/sessions/${sessionId}/grade`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ essay_grades })
            })

            if (!res.ok) {
                throw new Error(t('saveGradesFailed') || 'Failed to save grades')
            }

            toast.success(t('gradesSaved') || 'Essay grades saved successfully')
            onGraded()
        } catch (error: any) {
            console.error('Error saving grades:', error)
            toast.error(error.message || t('saveGradesFailed') || 'Failed to save grades')
        } finally {
            setSaving(false)
        }
    }

    if (essays.length === 0) {
        return null
    }

    return (
        <NeuCard>
            <NeuCardHeader>
                <NeuCardTitle className="flex items-center gap-2">
                    <FileEdit className="h-5 w-5" />
                    {t('gradeEssays') || 'Grade Essays'} - {studentName}
                </NeuCardTitle>
            </NeuCardHeader>
            <NeuCardContent>
                <div className="space-y-6">
                    {essays.map((essay, index) => {
                        const currentGrade = grades[essay.question_id] || 0
                        const isOverMax = currentGrade > essay.max_points

                        return (
                            <div key={essay.question_id} className="border border-border rounded-lg p-4">
                                <div className="mb-3">
                                    <h4 className="font-medium mb-1">
                                        {t('question') || 'Question'} {index + 1} ({essay.max_points} {t('points') || 'points'})
                                    </h4>
                                    <p className="text-sm text-muted-foreground">{essay.question_text}</p>
                                </div>

                                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                                    <p className="text-sm font-medium mb-2">{t('studentsAnswer') || "Student's Answer"}:</p>
                                    <p className="text-sm whitespace-pre-wrap">{essay.answer || t('noAnswerProvided') || 'No answer provided'}</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium mb-2">
                                            {t('score') || 'Score'}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <NeuInput
                                                type="number"
                                                min="0"
                                                max={essay.max_points}
                                                step="0.5"
                                                value={currentGrade}
                                                onChange={(e) => handleGradeChange(essay.question_id, e.target.value)}
                                                className={isOverMax ? 'border-red-500' : ''}
                                            />
                                            <span className="text-sm text-muted-foreground">/ {essay.max_points}</span>
                                        </div>
                                        {isOverMax && (
                                            <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                                                <AlertCircle className="h-3 w-3" />
                                                <span>{t('scoreExceedsMax') || 'Score cannot exceed'} {essay.max_points} {t('points') || 'points'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <div className="flex-1 text-sm text-muted-foreground">
                            {t('totalEssayPoints') || 'Total Essay Points'}: {Object.values(grades).reduce((sum, val) => sum + val, 0)} / {essays.reduce((sum, e) => sum + e.max_points, 0)}
                        </div>
                        <NeuButton onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('saving') || 'Saving...'}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {t('saveGrades') || 'Save Grades'}
                                </>
                            )}
                        </NeuButton>
                    </div>
                </div>
            </NeuCardContent>
        </NeuCard>
    )
}