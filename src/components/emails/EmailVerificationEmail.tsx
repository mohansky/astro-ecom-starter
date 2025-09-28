import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
} from '@react-email/components';

interface EmailVerificationEmailProps {
  userName: string;
  verificationUrl: string;
}

export function EmailVerificationEmail({
  userName,
  verificationUrl,
}: EmailVerificationEmailProps) {
  const previewText =
    'Please verify your email address to complete your registration';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Text style={logo}>Manubal</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Verify Your Email Address</Text>

            <Text style={paragraph}>Hi {userName},</Text>

            <Text style={paragraph}>
              Welcome to Manubal! We're excited to have you join our community.
              To complete your registration and start shopping, please verify
              your email address by clicking the button below.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={verificationUrl}>
                Verify Email Address
              </Button>
            </Section>

            <Text style={paragraph}>
              If the button above doesn't work, you can also copy and paste the
              following link into your browser:
            </Text>

            <Text style={linkText}>
              <Link href={verificationUrl} style={link}>
                {verificationUrl}
              </Link>
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              <strong>Important:</strong> This verification link will expire in
              24 hours for security reasons. If you didn't create an account
              with Manubal, you can safely ignore this email.
            </Text>

            <Text style={footerText}>
              Need help? Contact our support team at{' '}
              <Link href="mailto:support@manubal.com" style={link}>
                support@manubal.com
              </Link>
            </Text>

            <Text style={footerText}>
              Best regards,
              <br />
              The Manubal Team
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerCopyright}>
              © 2024 Manubal. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logoContainer = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#3b82f6',
};

const logo = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  padding: '0 20px',
};

const heading = {
  fontSize: '24px',
  lineHeight: '1.25',
  fontWeight: '600',
  color: '#1f2937',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#374151',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0',
};

const linkText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#6b7280',
  margin: '16px 0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px',
  borderTop: '1px solid #e5e7eb',
  marginTop: '32px',
};

const footerCopyright = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
};

export default EmailVerificationEmail;
