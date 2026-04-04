export const verifyEmailTemplate = (params: {
  full_name: string;
  verify_url: string;
}) => ({
  subject: 'Xác nhận địa chỉ email',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Xin chào ${params.full_name},</h2>
      <p>Cảm ơn bạn đã đăng ký. Vui lòng xác nhận email bằng cách bấm vào nút bên dưới:</p>
      <a href="${params.verify_url}"
        style="display:inline-block; padding:12px 24px; background:#4F46E5;
               color:#fff; border-radius:6px; text-decoration:none; font-weight:bold;">
        Xác nhận Email
      </a>
      <p style="color:#888; margin-top:24px;">
        Link có hiệu lực trong <strong>24 giờ</strong>.<br/>
        Nếu bạn không đăng ký, hãy bỏ qua email này.
      </p>
    </div>
  `,
});