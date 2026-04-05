export const resetPasswordTemplate = (params: {
  full_name: string;
  reset_url: string;
}) => ({
  subject: 'Đặt lại mật khẩu',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Xin chào ${params.full_name},</h2>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu từ tài khoản của bạn.</p>
      <a href="${params.reset_url}"
        style="display:inline-block; padding:12px 24px; background:#DC2626;
               color:#fff; border-radius:6px; text-decoration:none; font-weight:bold;">
        Đặt lại mật khẩu
      </a>
      <p style="color:#888; margin-top:24px;">
        Link có hiệu lực trong <strong>1 giờ</strong>.<br/>
        Nếu bạn không yêu cầu, hãy bỏ qua email này.
      </p>
    </div>
  `,
});
