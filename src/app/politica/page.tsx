import React from 'react'
import { ShieldCheck, Lock, Eye, FileText, Gem } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade | Lapidado',
  description: 'Transparência e segurança no tratamento dos seus dados.',
}

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-[#fffcfc] py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Cabeçalho */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-secondary/10 rounded-full text-brand-primary mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl font-black text-brand-primary uppercase tracking-tighter">Política de Privacidade</h1>
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Última atualização: 27 de abril de 2026</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[40px] border border-brand-secondary/10 shadow-sm space-y-8 text-brand-primary/80 leading-relaxed">
          
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <Eye size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">1. Coleta de Dados</h2>
            </div>
            <p className="text-sm">
              O aplicativo **Lapidado** coleta informações essenciais para o funcionamento da plataforma de gestão de semijoias:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-sm">
              <li><strong>Dados de Login:</strong> Nome, e-mail e senha criptografada para autenticação segura via Supabase Auth.</li>
              <li><strong>Imagens de Produtos:</strong> Fotos carregadas pelo usuário para compor o catálogo digital e vitrine pública.</li>
              <li><strong>Dados Comerciais:</strong> Informações de vendas, clientes e estoque inseridos voluntariamente pelo lojista.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <Gem size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">2. Processamento por IA</h2>
            </div>
            <p className="text-sm">
              Utilizamos a tecnologia **Google Gemini API** para o processamento de imagens e geração de descrições automáticas. Ao utilizar a função "Mágica Lapidado", a imagem da joia e as características técnicas são enviadas de forma segura aos servidores do Google para análise e retorno de texto refinado. Nenhum dado pessoal é enviado para treinamento de modelos de terceiros.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <Lock size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">3. Segurança dos Dados</h2>
            </div>
            <p className="text-sm">
              Todos os dados são armazenados em infraestrutura de nuvem de alta segurança (Supabase/PostgreSQL) com criptografia de ponta a ponta. O acesso aos dados é estritamente restrito ao usuário proprietário da conta (Multi-Tenant Isolation).
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <FileText size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">4. Direitos do Usuário</h2>
            </div>
            <p className="text-sm">
              O usuário possui total controle sobre seus dados, podendo visualizar, editar ou excluir qualquer produto, venda ou informação de marca a qualquer momento através do painel administrativo.
            </p>
          </section>

          <div className="pt-8 border-t border-brand-secondary/10 text-center">
            <p className="text-[11px] font-bold text-brand-secondary uppercase">
              Contato: suporte@lapidado.com.br
            </p>
          </div>
        </div>

        <div className="text-center opacity-20">
          <Gem className="mx-auto" size={24} />
        </div>
      </div>
    </div>
  )
}
