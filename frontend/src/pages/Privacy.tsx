const Privacy = () => (
  <div className="app-page app-section py-8 max-w-3xl">
    <h1 className="app-title">Política de Privacidade</h1>
    <p className="app-subtitle mt-2">Última atualização: junho de 2026</p>
    <div className="app-card mt-4 space-y-4 text-sm text-gray-700 leading-relaxed">
      <p>
        O NutriFit trata dados pessoais e de saúde conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        Esta política descreve quais dados coletamos, para quais finalidades e quais são seus direitos.
      </p>
      <h2 className="font-semibold text-gray-900">Dados coletados</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Dados de cadastro: nome, e-mail, telefone, conselho profissional (quando aplicável).</li>
        <li>Dados clínicos: planos alimentares, diário alimentar, anamnese, exames e evolução antropométrica.</li>
        <li>Dados de uso: logs de acesso, preferências e interações na plataforma.</li>
      </ul>
      <h2 className="font-semibold text-gray-900">Finalidades</h2>
      <p>Prestação do serviço de gestão nutricional, comunicação entre profissional e paciente, melhoria da plataforma e cumprimento de obrigações legais.</p>
      <h2 className="font-semibold text-gray-900">Seus direitos</h2>
      <p>Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados nas configurações da conta ou pelo e-mail de suporte.</p>
      <h2 className="font-semibold text-gray-900">Segurança</h2>
      <p>Utilizamos criptografia em trânsito (HTTPS), autenticação segura e armazenamento em nuvem com controles de acesso.</p>
    </div>
  </div>
)

export default Privacy
