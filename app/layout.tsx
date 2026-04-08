import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Painel de Imóveis',
  description: 'Análise de imóveis coletados via scraper',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
