'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { parseCSV } from '@/lib/csv';
import { Imovel } from '@/lib/types';

export default function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<{ nome: string; total: number; imoveis: Imovel[] } | null>(null);
  const [error, setError] = useState('');
  const [parsing, setParsing] = useState(false);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function processFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Por favor, selecione um arquivo CSV.');
      return;
    }
    setError('');
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imoveis = parseCSV(content);
        if (imoveis.length === 0) {
          setError('Nenhum imóvel encontrado no arquivo.');
          setParsing(false);
          return;
        }
        setPreview({ nome: file.name, total: imoveis.length, imoveis });
      } catch {
        setError('Erro ao processar o CSV. Verifique o formato do arquivo.');
      }
      setParsing(false);
    };
    reader.readAsText(file, 'UTF-8');
  }

  function handleConfirm() {
    if (!preview) return;
    sessionStorage.setItem('imoveis', JSON.stringify(preview.imoveis));
    router.push('/painel');
  }

  function handleCancel() {
    setPreview(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  if (preview) {
    return (
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Arquivo carregado</h2>
            <p className="text-sm text-slate-500 mt-0.5">{preview.nome}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-700">{preview.total.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-blue-600 mt-1">imóveis encontrados</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-slate-700">
              {preview.imoveis.filter(i => i._encalhado).length.toLocaleString('pt-BR')}
            </p>
            <p className="text-sm text-slate-500 mt-1">possíveis encalhados</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm"
          >
            Analisar imóveis
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg transition text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
          ${dragging
            ? 'border-blue-400 bg-blue-50 scale-[1.02]'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleChange}
        />

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${dragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
          {parsing ? (
            <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className={`w-8 h-8 ${dragging ? 'text-blue-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>

        {parsing ? (
          <p className="text-slate-600 font-medium">Processando CSV...</p>
        ) : (
          <>
            <p className="text-slate-700 font-medium mb-1">
              {dragging ? 'Solte o arquivo aqui' : 'Arraste o arquivo CSV aqui'}
            </p>
            <p className="text-sm text-slate-400">ou clique para selecionar</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <p className="text-center text-xs text-slate-400 mt-4">
        Formato suportado: CSV com separador ponto e vírgula (;)
      </p>
    </div>
  );
}
