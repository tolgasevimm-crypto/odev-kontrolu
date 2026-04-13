export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">Veliler İçin Ödev Kontrolü</h1>
          <p className="text-gray-500 mt-1">Yapay zeka ile akıllı ödev analizi</p>
        </div>
        {children}
      </div>
    </div>
  );
}
