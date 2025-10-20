// src/components/emails/OrderConfirmationEmail.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderConfirmationEmailProps {
  customerName: string;
  customerEmail: string;
  orderId: string; // Changed from number to string
  orderDate: string;
  items: OrderItem[];
  subtotal: string; // Changed from number to string
  shipping: string; // Changed from number to string
  tax: string; // Changed from number to string
  total: string; // Changed from number to string
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export const OrderConfirmationEmail = ({
  customerName = 'John Doe',
  customerEmail = 'john@example.com',
  orderId = '12345',
  orderDate = '2024-01-15',
  items = [{ id: '1', name: 'Sample Product', price: 99.99, quantity: 1 }],
  subtotal = '99.99',
  shipping = '50.00',
  tax = '4.99',
  total = '154.98',
  shippingAddress = {
    address: '123 Main St',
    city: 'Mumbai',
    state: 'MH',
    zipCode: '400001',
  },
}: OrderConfirmationEmailProps) => {
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Html>
      <Head />
      <Preview>
        Order #{orderId} confirmed - Thank you for your purchase!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Ecom Starter</Heading>
            <Text style={subtitle}>Order Confirmation</Text>
          </Section>

          {/* Order Confirmed Message */}
          <Section style={section}>
            <Heading as="h2" style={h2}>
              Thank you for your order, {customerName}!
            </Heading>
            <Text style={text}>
              We've received your order and are preparing it for shipment.
              You'll receive a tracking email once your order is on its way.
            </Text>
          </Section>

          {/* Order Details */}
          <Section style={section}>
            <Row style={orderDetailsRow}>
              <Column style={orderDetailsColumn}>
                <Text style={orderDetailLabel}>Order Number</Text>
                <Text style={orderDetailValue}>#{orderId}</Text>
              </Column>
              <Column style={orderDetailsColumn}>
                <Text style={orderDetailLabel}>Order Date</Text>
                <Text style={orderDetailValue}>{formatDate(orderDate)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Order Items */}
          <Section style={section}>
            <Heading as="h3" style={h3}>
              Order Items
            </Heading>
            {items.map((item, index) => (
              <Row key={item.id} style={itemRow}>
                <Column style={itemNameColumn}>
                  <Text style={itemName}>{item.name}</Text>
                  <Text style={itemQuantity}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={itemPriceColumn}>
                  <Text style={itemPrice}>
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          {/* Order Summary */}
          <Section style={section}>
            <Heading as="h3" style={h3}>
              Order Summary
            </Heading>
            <Row style={summaryRow}>
              <Column style={summaryLabelColumn}>
                <Text style={summaryLabel}>Subtotal</Text>
              </Column>
              <Column style={summaryValueColumn}>
                <Text style={summaryValue}>{formatCurrency(subtotal)}</Text>
              </Column>
            </Row>
            <Row style={summaryRow}>
              <Column style={summaryLabelColumn}>
                <Text style={summaryLabel}>Shipping (Weight-based)</Text>
              </Column>
              <Column style={summaryValueColumn}>
                <Text style={summaryValue}>{formatCurrency(shipping)}</Text>
              </Column>
            </Row>
            <Row style={summaryRow}>
              <Column style={summaryLabelColumn}>
                <Text style={summaryLabel}>Tax (GST)</Text>
              </Column>
              <Column style={summaryValueColumn}>
                <Text style={summaryValue}>{formatCurrency(tax)}</Text>
              </Column>
            </Row>
            <Hr style={summaryDivider} />
            <Row style={summaryRow}>
              <Column style={summaryLabelColumn}>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column style={summaryValueColumn}>
                <Text style={totalValue}>{formatCurrency(total)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Shipping Address */}
          <Section style={section}>
            <Heading as="h3" style={h3}>
              Shipping Address
            </Heading>
            <Text style={address}>
              {shippingAddress.address}
              <br />
              {shippingAddress.city}, {shippingAddress.state}{' '}
              {shippingAddress.zipCode}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions about your order? Contact us at{' '}
              <Link href="mailto:support@manubal.com" style={link}>
                support@manubal.com
              </Link>
            </Text>
            <Text style={footerText}>
              Track your order status in your{' '}
              <Link href="https://manubal.com/account" style={link}>
                account dashboard
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

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
  maxWidth: '600px',
};

const header = {
  padding: '24px',
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  padding: '0',
};

const subtitle = {
  color: '#64748b',
  fontSize: '16px',
  margin: '0',
  padding: '0',
};

const section = {
  padding: '24px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const h3 = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const orderDetailsRow = {
  marginBottom: '16px',
};

const orderDetailsColumn = {
  width: '50%',
  paddingRight: '8px',
};

const orderDetailLabel = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 4px 0',
  fontWeight: '500',
};

const orderDetailValue = {
  color: '#1a1a1a',
  fontSize: '16px',
  margin: '0',
  fontWeight: 'bold',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '0',
};

const itemRow = {
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '12px',
  marginBottom: '12px',
};

const itemNameColumn = {
  width: '70%',
  paddingRight: '16px',
};

const itemPriceColumn = {
  width: '30%',
  textAlign: 'right' as const,
};

const itemName = {
  color: '#1a1a1a',
  fontSize: '16px',
  margin: '0 0 4px 0',
  fontWeight: '500',
};

const itemQuantity = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0',
};

const itemPrice = {
  color: '#1a1a1a',
  fontSize: '16px',
  margin: '0',
  fontWeight: 'bold',
};

const summaryRow = {
  marginBottom: '8px',
};

const summaryLabelColumn = {
  width: '70%',
};

const summaryValueColumn = {
  width: '30%',
  textAlign: 'right' as const,
};

const summaryLabel = {
  color: '#4a5568',
  fontSize: '16px',
  margin: '0',
};

const summaryValue = {
  color: '#1a1a1a',
  fontSize: '16px',
  margin: '0',
};

const summaryDivider = {
  borderColor: '#e2e8f0',
  margin: '12px 0',
};

const totalLabel = {
  color: '#1a1a1a',
  fontSize: '18px',
  margin: '0',
  fontWeight: 'bold',
};

const totalValue = {
  color: '#1a1a1a',
  fontSize: '18px',
  margin: '0',
  fontWeight: 'bold',
};

const address = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const footer = {
  padding: '24px',
  backgroundColor: '#f8fafc',
  borderTop: '1px solid #e2e8f0',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px 0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};

export default OrderConfirmationEmail;
