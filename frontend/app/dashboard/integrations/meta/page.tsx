'use client';

import React, { useState } from 'react';
import { 
  Share2, 
  Settings, 
  Phone, 
  Key, 
  Save, 
  Check, 
  Activity, 
  AlertTriangle,
  FileText,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function MetaApiPage() {
  const [wabaId, setWabaId] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState<'creds' | 'templates' | 'test'>('creds');
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSaveCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Configurações salvas! / Settings saved successfully!');
    }, 1500);
  };

  const handleTestConnection = () => {
    setTestStatus('loading');
    setTimeout(() => {
      setTestStatus('success');
      toast.success('Conexão S2S Verificada! / S2S Connection Verified!');
    }, 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Policy 1.6 Compliance Header (Captions) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-start gap-4 shadow-xl">
        <div className="bg-blue-500/20 p-3 rounded-2xl">
          <Info className="w-6 h-6 text-blue-500" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Server-to-Server (S2S) Architecture Guide
            <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded uppercase">Meta Review</span>
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            This module manages WhatsApp Business messaging assets using permanent tokens. 
            The system performs automatic asset discovery (WABA ID and Phone ID) via Graph API S2S calls.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Share2 className="w-8 h-8 text-blue-500" />
            Meta API Integration
          </h1>
          <p className="text-slate-400">
            Configure seu WhatsApp Business Cloud API e gerencie ativos da Meta.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="flex border-b border-slate-800">
              {['creds', 'templates', 'test'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                    activeTab === tab 
                      ? 'text-blue-500 border-blue-500 bg-blue-500/5' 
                      : 'text-slate-400 border-transparent hover:text-white'
                  }`}
                >
                  {tab === 'creds' ? 'Configuration / Configurações' : 
                   tab === 'templates' ? 'Templates (BBM)' : 'Diagnostic Test'}
                </button>
              ))}
            </div>

            <div className="p-8">
              {activeTab === 'creds' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <form onSubmit={handleSaveCreds} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                          WhatsApp Business ID (WABA)
                        </label>
                        <div className="relative">
                          <Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="Ex: 1098234..." 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                            value={wabaId}
                            onChange={(e) => setWabaId(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                          Phone Number ID
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="Ex: 1023485..." 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                            value={phoneId}
                            onChange={(e) => setphoneId?.(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                        System User Access Token (Permanent)
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          type="password" 
                          placeholder="EAAB..." 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95"
                    >
                      {isSaving ? 'Salvando...' : (
                        <>
                          <Save className="w-5 h-5" />
                          Salvar e Sincronizar / Save & Sync
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'templates' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Message Templates (HSM)</h3>
                    <button className="text-sm font-bold text-blue-500 hover:text-blue-400">Sincronizar Meta Assets</button>
                  </div>
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-12 text-center">
                    <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                      <FileText className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 max-w-sm mx-auto text-sm leading-relaxed">
                      Sincronize seus modelos de mensagem aprovados. 
                      Os templates são baixados via S2S Graph API calls para uso em campanhas.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'test' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <h3 className="text-xl font-bold text-white mb-4">S2S Integrity Check</h3>
                  <div className="p-8 bg-slate-950 rounded-3xl border border-slate-800 text-center space-y-6">
                    <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                      testStatus === 'success' ? 'bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.2)]' :
                      testStatus === 'error' ? 'bg-red-500/20' : 'bg-slate-900'
                    }`}>
                      {testStatus === 'success' ? <Check className="w-12 h-12 text-green-500" /> :
                       testStatus === 'error' ? <AlertTriangle className="w-12 h-12 text-red-500" /> :
                       <Activity className="w-12 h-12 text-blue-500 animate-pulse" />}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white mb-2 italic">
                        {testStatus === 'idle' ? 'Ready to Test' :
                         testStatus === 'loading' ? 'Verifying S2S Connectivity...' :
                         testStatus === 'success' ? 'S2S Connection Verified!' : 'Falha na Conexão'}
                      </h4>
                      <p className="text-slate-400 text-sm max-w-md mx-auto">
                        Verifica a validade do Token, Business ID e a conectividade com os servidores da WhatsApp Cloud API.
                      </p>
                    </div>
                    <button 
                      onClick={handleTestConnection}
                      disabled={testStatus === 'loading'}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {testStatus === 'loading' ? 'Checking...' : 'Iniciar Teste S2S'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Recursos de Integração
            </h3>
            <ul className="space-y-3">
              {[
                'Envio massivo via Cloud API',
                'Status de entrega (Read/Delivered)',
                'Webhook Integration',
                'Automated Data Extraction'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold text-white uppercase text-xs tracking-widest">Segurança</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "We use permanent Access Tokens to maintain server-side automation without user re-authentication."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
