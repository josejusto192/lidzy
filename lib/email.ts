// Serviço de envio de emails
// Para usar, instale: pnpm add resend
// E configure a variável de ambiente: RESEND_API_KEY

interface EmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@lidzy.com.br"

  if (!RESEND_API_KEY) {
    console.warn("[v0] RESEND_API_KEY não configurada. Email não será enviado.")
    return { success: false, error: "Email não configurado" }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] Erro ao enviar email:", error)
      return { success: false, error }
    }

    const data = await response.json()
    console.log("[v0] Email enviado com sucesso:", data.id)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Erro ao enviar email:", error)
    return { success: false, error }
  }
}

// Templates de email

export function getPaymentConfirmedEmailHtml(userName: string, planName: string, credits: number, paymentDate: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pagamento Confirmado! 🎉</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${userName}</strong>,</p>
            <p>Seu pagamento foi confirmado com sucesso!</p>
            <p><strong>Detalhes:</strong></p>
            <ul>
              <li>Plano: ${planName}</li>
              <li>Créditos adicionados: ${credits.toLocaleString("pt-BR")}</li>
              <li>Data do pagamento: ${paymentDate}</li>
            </ul>
            <p>Seus créditos já estão disponíveis para uso.</p>
            <a href="https://app.lidzy.com.br/dashboard" class="button">Acessar Dashboard</a>
          </div>
          <div class="footer">
            <p>Lidzy - Automação de Prospecção</p>
            <p>Se você não solicitou este email, por favor ignore-o.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getPaymentOverdueEmailHtml(userName: string, planName: string, dueDate: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pagamento em Atraso ⚠️</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${userName}</strong>,</p>
            <p>Identificamos que o pagamento da sua assinatura está em atraso.</p>
            <p><strong>Detalhes:</strong></p>
            <ul>
              <li>Plano: ${planName}</li>
              <li>Vencimento: ${dueDate}</li>
            </ul>
            <p>Para continuar utilizando os serviços do Lidzy, por favor regularize seu pagamento.</p>
            <a href="https://app.lidzy.com.br/pagamentos" class="button">Ver Pagamentos</a>
          </div>
          <div class="footer">
            <p>Lidzy - Automação de Prospecção</p>
            <p>Em caso de dúvidas, entre em contato com nosso suporte.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getSubscriptionCanceledEmailHtml(userName: string, planName: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6b7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Assinatura Cancelada</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${userName}</strong>,</p>
            <p>Sua assinatura do plano <strong>${planName}</strong> foi cancelada.</p>
            <p>Sentiremos sua falta! Se você mudou de ideia, pode reativar sua assinatura a qualquer momento.</p>
            <p>Seus créditos atuais ainda podem ser utilizados.</p>
            <a href="https://app.lidzy.com.br/planos" class="button">Ver Planos</a>
          </div>
          <div class="footer">
            <p>Lidzy - Automação de Prospecção</p>
            <p>Obrigado por ter usado nossos serviços!</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getPaymentRefundedEmailHtml(userName: string, amount: number, credits: number) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reembolso Processado</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${userName}</strong>,</p>
            <p>Seu reembolso foi processado com sucesso.</p>
            <p><strong>Detalhes:</strong></p>
            <ul>
              <li>Valor: R$ ${amount.toFixed(2)}</li>
              <li>Créditos removidos: ${credits.toLocaleString("pt-BR")}</li>
            </ul>
            <p>O valor será creditado de acordo com a política da sua forma de pagamento.</p>
          </div>
          <div class="footer">
            <p>Lidzy - Automação de Prospecção</p>
            <p>Em caso de dúvidas, entre em contato com nosso suporte.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
