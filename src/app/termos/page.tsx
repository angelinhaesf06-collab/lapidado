import React from 'react'
import { FileText, CheckCircle, AlertCircle, Scale, Gem } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso | Lapidado',
  description: 'Regras e condições para utilização da plataforma Lapidado.',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#fffcfc] py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Cabeçalho */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-secondary/10 rounded-full text-brand-primary mb-4">
            <Scale size={32} />
          </div>
          <h1 className="text-4xl font-black text-brand-primary uppercase tracking-tighter">Termos de Uso</h1>
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Última atualização: 4 de maio de 2026</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[40px] border border-brand-secondary/10 shadow-sm space-y-8 text-brand-primary/80 leading-relaxed">
          
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <CheckCircle size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">1. Aceitação dos Termos</h2>
            </div>
            <p className="text-sm">
              Ao acessar e utilizar a plataforma **Lapidado**, você concorda integralmente com estes termos. O serviço é destinado a empresárias e lojistas do setor de semijoias para gestão de catálogo e vendas.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <Gem size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">2. Licença de Uso</h2>
            </div>
            <p className="text-sm">
              O Lapidado concede uma licença limitada, não exclusiva e intransferível para uso da plataforma. É proibido:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-sm">
              <li>Engenharia reversa ou cópia da interface e funcionalidades.</li>
              <li>Uso da plataforma para atividades ilícitas ou fraudulentas.</li>
              <li>Compartilhamento de conta com terceiros sem autorização.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <FileText size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">3. Assinaturas e Pagamentos</h2>
            </div>
            <p className="text-sm">
              O acesso aos recursos avançados (Pro) é realizado via assinatura recorrente processada pelo **Stripe**. O cancelamento pode ser feito a qualquer momento pelo painel administrativo, interrompendo a renovação para o próximo ciclo.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <AlertCircle size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">4. Limitação de Responsabilidade</h2>
            </div>
            <p className="text-sm">
              O Lapidado é uma ferramenta de gestão. Não nos responsabilizamos por perdas comerciais, interrupções de serviço por falhas de terceiros (hospedagem/APIs) ou decisões de negócio tomadas com base nos dados da plataforma.
            </p>
          </section>

          <div className="pt-8 border-t border-brand-secondary/10 text-center">
            <p className="text-[11px] font-bold text-brand-secondary uppercase">
              Dúvidas Jurídicas: juridico@lapidado.com.br
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
