import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IGF Football - Admin Dashboard',
  description: 'Panel administrativo para gestionar usuarios y transacciones',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 antialiased`} suppressHydrationWarning={true}>
        <div className="min-h-screen">
          {/* Navegación superior */}
          <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center space-x-8">
                  <a href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                     IGF Football Admin
                  </a>
                  
                  <div className="hidden sm:flex space-x-4">
                    <a href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      Dashboard
                    </a>
                    <a href="/users" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      Usuarios
                    </a>
                    <a href="/apuestas" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      🎯 Apuestas
                    </a>
                    <a href="/transactions" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      Transacciones
                    </a>
                    <a href="/wallets" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      Wallets
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="hidden sm:block text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                     Panel Administrativo
                  </span>
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">A</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          
          {/* Contenido principal */}
          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {children}
            </div>
          </main>
          
          {/* Footer */}
          <footer className="bg-gray-50 border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="text-center text-sm text-gray-500">
                <p>IGF Football Admin Dashboard  2025 - Panel de administración</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}