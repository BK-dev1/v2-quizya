import AuthResetPassword from '@/components/auth/auth-reset-password'

export const metadata = {
    title: 'Reset Password | Quizya',
    description: 'Set a new password for your Quizya account',
}

export default function ResetPasswordPage() {
    return <AuthResetPassword />
}
