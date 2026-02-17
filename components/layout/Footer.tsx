'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-700 text-white py-2 w-full mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs">Powered by <span className="font-semibold">Sri Lanka Telecom</span> | © {new Date().getFullYear()} Sri Lanka Police</p>
      </div>
    </footer>
  );
}

