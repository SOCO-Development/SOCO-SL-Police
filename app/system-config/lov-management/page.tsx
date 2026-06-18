'use client';

import { PageHeader, PageLayout } from '@/components/ui';
import { ListBullets } from 'phosphor-react';

export default function LovManagementPage() {
    return (
        <PageLayout>
            <PageHeader
                backHref="/system-config"
                title="LOV Management"
                description="LOV කළමනාකරණය"
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 mb-5">
                    <ListBullets className="w-12 h-12" weight="bold" style={{ color: '#ef4444' }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">LOV Management</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                    This section will allow you to manage list-of-values used in dropdowns and form selections system-wide.
                </p>
                <span className="mt-6 inline-block px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
                    Coming Soon
                </span>
            </div>
        </PageLayout>
    );
}
