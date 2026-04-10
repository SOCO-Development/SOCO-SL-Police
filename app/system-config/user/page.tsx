'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ArrowLeft } from 'lucide-react';
import { UserGear } from 'phosphor-react';

export default function UserConfigPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1 relative z-10 w-full pt-14">
                <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                        <div className="flex items-center gap-3 mb-8">
                            <Link
                                href="/system-config"
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">User Configuration</h2>
                                <p className="text-sm text-gray-500 mt-0.5 font-noto-sinhala">පරිශීලක වින්‍යාස කිරීම</p>
                            </div>
                        </div>

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
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
