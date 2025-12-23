import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Printer, Mail, Lock, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                });
                if (error) throw error;
                showToast('Confirme seu e-mail para ativar sua conta!', 'info');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao autenticar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-sans">
            <div className="max-w-md w-full">
                {/* Logo Section */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="bg-[#0ea5e9] p-3 rounded-2xl shadow-lg shadow-sky-100 mb-4">
                        <Printer className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800">3D Print Flow</h1>
                    <p className="text-slate-500 font-medium mt-2">Gerenciamento profissional para impressão 3D</p>
                </div>

                {/* Auth Card */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isLogin ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Entrar
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isLogin ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Cadastrar
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-medium leading-relaxed">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all"
                                    placeholder="Seu melhor e-mail"
                                    required
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm w-5 text-center">Aa</div>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all"
                                        placeholder="Seu nome"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all"
                                    placeholder="Sua senha secreta"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#0ea5e9] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#0284c7] active:scale-[0.98] transition-all shadow-lg shadow-sky-100 disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isLogin ? (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Acessar Dashboard
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Criar Minha Conta
                                </>
                            )}
                        </button>
                    </form>

                    {isLogin && (
                        <div className="mt-8 text-center">
                            <button className="text-sm font-bold text-slate-400 hover:text-sky-500 transition-all">
                                Esqueceu sua senha?
                            </button>
                        </div>
                    )}
                </div>

                <p className="mt-12 text-center text-xs font-medium text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Ao continuar, você concorda com nossos <span className="text-slate-600 underline">Termos de Serviço</span> e <span className="text-slate-600 underline">Política de Privacidade</span>.
                </p>
            </div >
        </div >
    );
};

export default Auth;
