---
id: two-factor-auth
title: Two-Factor Authentication
sidebar_label: Two-Factor Auth (2FA)
---

# Two-Factor Authentication (2FA)

Two-factor authentication (2FA) adds an extra layer of security. After enabling it, you need both your password **and** a six-digit code from your authenticator app every time you sign in.

:::tip Strongly recommended
2FA prevents unauthorised access even if your password is compromised. Enable it as soon as you create your account.
:::

---

## Enabling 2FA

1. Click your profile icon in the top-right corner of the header.
2. Navigate to **Security** → **Two-Factor Authentication** (or go directly to `/security/mfa`).
3. Click **Set Up Two-Factor Authentication**.
4. Open your authenticator app and scan the **QR code** displayed on screen.
   - Supported apps: Google Authenticator, Authy, Microsoft Authenticator, 1Password
5. Your app will display a six-digit rotating code. Enter this code in the **Verification Code** field.
6. Click **Enable 2FA**.

2FA is now active. You will be prompted for a code on every future sign-in.

---

## Signing In with 2FA Active

1. Enter your email and password as normal.
2. When prompted, open your authenticator app.
3. Enter the current six-digit code shown in the app.
4. Click **Verify**.

:::info
The code changes every 30 seconds. If the code is rejected, wait for the next code to appear and try again.
:::

---

## Disabling 2FA

1. Return to **Security** → **Two-Factor Authentication** (`/security/mfa`).
2. Click **Disable Two-Factor Authentication**.
3. Enter your current six-digit authenticator code to confirm.
4. 2FA will be disabled.

---

## Troubleshooting 2FA

| Problem | Solution |
|---------|---------|
| Code is invalid | Ensure your phone's time is set to **automatic**. The authenticator app is time-sensitive. |
| Lost access to authenticator app | Contact your system administrator — account recovery without the authenticator is not currently self-service. |
| QR code won't scan | Use your authenticator app's manual entry option and type the setup key shown below the QR code. |

:::danger Backup your QR code
Store a backup copy of the QR code or setup key when you first enable 2FA. If you lose access to your authenticator app without a backup, you may be permanently locked out.
:::
