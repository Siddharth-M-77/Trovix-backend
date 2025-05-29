import speakeasy from "speakeasy";
import qrcode from "qrcode";

export const generate2FA = async (walletAddress) => {
  const secret = speakeasy.generateSecret({
    name: `Nexocoin (${walletAddress})`,
  });

  const qrCode = await qrcode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode,
  };
};

export const verify2FA = (secret, otp) => {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: otp,
    window: 2,
  });
};
