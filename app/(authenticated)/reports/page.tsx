"use client";

import React, { useState } from "react";
import ReportsView from "@/components/reports-view";
import ReportDetailView from "@/components/report-detail-view";
import { useAuth } from "@/components/auth-context";

export default function ReportsPage() {
    const { currentUser } = useAuth();
    const [detailViewData, setDetailViewData] = useState<any | null>(null);

    if (!currentUser) return null;

    const handleShowDetailView = (detail: any) => {
        setDetailViewData(detail);
    };

    const handleBackToReports = () => {
        setDetailViewData(null);
    };

    if (detailViewData) {
        return (
            <ReportDetailView
                detail={detailViewData}
                onBack={handleBackToReports}
                currentUser={currentUser}
            />
        );
    }

    return (
        <ReportsView
            currentUser={currentUser}
            onDetailClick={handleShowDetailView}
        />
    );
}
