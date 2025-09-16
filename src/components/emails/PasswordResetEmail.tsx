// src/components/emails/PasswordResetEmail.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  userName?: string;
  resetUrl?: string;
}

function getResetBaseURL(): string {
  if (typeof window === 'undefined') {
    if (import.meta.env.PUBLIC_BETTER_AUTH_URL) {
      return import.meta.env.PUBLIC_BETTER_AUTH_URL;
    }
    
    if (import.meta.env.BETTER_AUTH_URL) {
      return import.meta.env.BETTER_AUTH_URL;
    }
    
    if (import.meta.env.NETLIFY_URL) {
      return import.meta.env.NETLIFY_URL;
    }
    
  }
  
  return 'http://localhost:4321';
}

export const PasswordResetEmail = ({
  userName = 'User',
  resetUrl = `${getResetBaseURL()}/reset-password?token=sample-token`,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your password for Manobal</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={title}>Manobal</Text>
        </Section>
        
        <Section style={section}>
          <Text style={greeting}>Hi {userName},</Text>
          
          <Text style={paragraph}>
            We received a request to reset your password. If you didn't make this request,
            you can safely ignore this email.
          </Text>
          
          <Text style={paragraph}>
            To reset your password, click the button below:
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>
          
          <Text style={paragraph}>
            Or copy and paste this URL into your browser:
          </Text>
          
          <Link href={resetUrl} style={link}>
            {resetUrl}
          </Link>
          
          <Text style={paragraph}>
            This link will expire in 1 hour for security reasons.
          </Text>
          
          <Text style={footer}>
            If you have any questions, please contact our support team.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const logoContainer = {
  marginBottom: '32px',
};

const title = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  textAlign: 'center' as const,
  margin: '0',
};

const section = {
  padding: '24px',
  border: 'solid 1px #dedede',
  borderRadius: '5px',
  textAlign: 'left' as const,
};

const greeting = {
  fontSize: '16px',
  lineHeight: '26px',
  fontWeight: 'bold',
  color: '#374151',
};

const paragraph = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#374151',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  margin: '0 auto',
  padding: '12px 20px',
};

const link = {
  fontSize: '14px',
  color: '#2563eb',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const footer = {
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '32px',
};