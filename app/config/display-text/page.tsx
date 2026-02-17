'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function DisplayTextManagementPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1 w-full relative z-10 pt-14">
        <main className="flex-1 overflow-x-hidden overflow-y-auto min-w-0 flex flex-col min-h-screen main-scrollable">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Display Text Management</h1>
              {/* Content will be added here */}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

