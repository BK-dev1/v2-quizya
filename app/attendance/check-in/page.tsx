'use client'
import { Suspense } from "react"

import CheckInForm from "@/components/attendance/check-in-form"
export default function CheckInPage() {
    return(<Suspense fallback={<div className="p-4 text-center">Loading...</div>}> 
    <CheckInForm /></Suspense>)
}
