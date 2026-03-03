'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { UserPlus, Users } from 'phosphor-react';

export default function CrimeOfficerPage() {
    const options = [
        {
            title: 'Add Officer',
            titleSi: 'නිලධාරි එකතු කරන්න',
            description: 'Register a new SOCO officer with full personnel details.',
            href: '/config/crime-officer/add',
            icon: <UserPlus className="w-12 h-12" weight="fill" style={{ color: '#3b82f6' }} />,
            color: '#3b82f6',
        },
        {
            title: 'View Officers',
            titleSi: 'නිලධාරීන් බලන්න',
            description: 'Browse, search and manage all registered SOCO officers.',
            href: '/config/crime-officer/view',
            icon: <Users className="w-12 h-12" weight="fill" style={{ color: '#10b981' }} />,
            color: '#10b981',
        },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <Header />
            <div className="flex flex-1 relative z-10 w-full pt-14">
                <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                        {/* Breadcrumb */}
                        <nav className="mb-6 text-sm text-gray-500 flex items-center gap-2">
                            <Link href="/config" className="hover:text-blue-600 transition-colors">Configuration</Link>
                            <span>›</span>
                            <span className="text-gray-800 font-medium">Crime Officer Management</span>
                        </nav>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                Crime Officer Management
                            </h2>
                            <p className="text-sm text-gray-500 mb-8">
                                SOCO නිලධාරි කළමනාකරණ පද්ධතිය
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                                {options.map((opt) => (
                                    <Link
                                        key={opt.href}
                                        href={opt.href}
                                        className="block group"
                                    >
                                        <div className="bg-white rounded-xl shadow-sm hover:shadow-2xl border border-gray-100 hover:border-blue-200 p-8 cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 ease-in-out">
                                            {/* Gradient overlay on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-teal-50/0 group-hover:from-blue-50/50 group-hover:to-teal-50/50 transition-all duration-300" />

                                            {/* Icon */}
                                            <div className="relative mb-5 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50 group-hover:from-blue-100 group-hover:to-teal-100 transition-all duration-300 transform group-hover:scale-110 group-hover:-translate-y-2">
                                                <div className="text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
                                                    {opt.icon}
                                                </div>
                                            </div>

                                            <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 relative z-10 transition-colors duration-300 leading-tight mb-1">
                                                {opt.title}
                                            </h3>
                                            <p className="text-xs text-gray-400 relative z-10 mb-1">{opt.titleSi}</p>
                                            <p className="text-xs text-gray-500 relative z-10 mt-2 leading-relaxed">{opt.description}</p>

                                            {/* Decorative corner accent */}
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/0 to-teal-500/0 group-hover:from-blue-500/5 group-hover:to-teal-500/5 rounded-bl-full transition-all duration-300" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
