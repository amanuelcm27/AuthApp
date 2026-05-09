import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

class TOTPService {
  // Generate a new TOTP secret for a user
  static async generateSecret(email) {
    const secret = speakeasy.generateSecret({
      name: `AuthApp (${email})`,
      issuer: 'AuthApp',
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCode: await QRCode.toDataURL(secret.otpauth_url),
      otpauthUrl: secret.otpauth_url,
    };
  }

  // Verify a TOTP token
  static verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (±30 seconds) for clock skew
    });
  }

  // Generate backup codes
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generate codes like XXXX-XXXX-XXXX (12 hex characters with hyphens)
      const code = Array(3)
        .fill(0)
        .map(() => Math.random().toString(16).substr(2, 4).toUpperCase())
        .join('-');
      codes.push(code);
    }
    return codes;
  }

  // Verify and consume a backup code
  static verifyBackupCode(backupCodesJson, code) {
    if (!backupCodesJson) return false;

    try {
      const codes = JSON.parse(backupCodesJson);
      if (Array.isArray(codes) && codes.includes(code)) {
        // Remove the used code
        const index = codes.indexOf(code);
        codes.splice(index, 1);
        return {
          valid: true,
          remaining: codes,
        };
      }
      return { valid: false, remaining: null };
    } catch (e) {
      return { valid: false, remaining: null };
    }
  }
}

export default TOTPService;
