'use client';

import { PageHeader, PageLayout } from '@/components/ui';
import { UserGear } from 'phosphor-react';

export default function UserConfigPage() {
    return (
        <PageLayout>
            <PageHeader
                backHref="/system-config"
                title="User Configuration"
                description="පරිශීලක වින්‍යාස කිරීම"
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 mb-5">
                    <UserGear className="w-12 h-12" weight="fill" style={{ color: '#8b5cf6' }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">User Configuration</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                    This section will allow you to manage system users, roles and access permissions.
                </p>
                <span className="mt-6 inline-block px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
                    Coming Soon
                </span>
            </div>
        </PageLayout>
    );
}
