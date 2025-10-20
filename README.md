# Astro E-commerce Starter

A production-ready, full-stack e-commerce platform built with Astro, React, and TypeScript. Designed for small to medium businesses with a focus on maintainability, performance, and developer experience.

## 🚀 Tech Stack

- **Framework**: Astro 5.14 (SSR mode) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + DaisyUI 5
- **Database**: Turso (LibSQL) with Drizzle ORM
- **Authentication**: Better Auth 1.2
- **Payments**: Razorpay integration
- **Storage**: Cloudflare R2 for product images
- **Email**: Resend for transactional emails
- **Deployment**: Cloudflare Pages
- **Data Fetching**: TanStack React Query
- **State Management**: Nanostores + Zustand
- **Charts**: Chart.js

## ✨ Features

### Admin Panel
- 📦 **Product Management** - Full CRUD with image uploads, slug generation, SKU support
- 📊 **Analytics Dashboard** - Orders chart, revenue tracking, product sales analytics
- 🛒 **Order Management** - Order tracking, status updates, order history
- 👥 **Customer Management** - Customer profiles, order history
- 💰 **Discount System** - Flexible discount codes with conditions and limits
- 👤 **User Management** - Role-based access control (admin/customer)
- 📁 **CSV Import** - Bulk product import functionality

### Customer Features
- 🛍️ **Product Catalog** - Responsive product grid with filtering
- 🔍 **Search & Filter** - Category and search-based filtering
- 🛒 **Shopping Cart** - Persistent cart with nanostores
- 💳 **Razorpay Checkout** - Secure payment processing
- 📧 **Email Notifications** - Order confirmations, email verification
- 📱 **Responsive Design** - Mobile-first, works on all devices

### Developer Features
- ⚡ **Type Safety** - Full TypeScript coverage
- 🔄 **React Query** - Optimistic updates, caching, and background refetching
- 📊 **DataTable Component** - Reusable table with sorting, pagination, search
- 🎨 **Component Library** - Consistent UI components with DaisyUI
- 🖼️ **R2 Image Storage** - Cloudflare R2 for scalable image hosting
- 🔐 **Auth System** - Email verification, password reset, session management

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>

# Install dependencies (uses pnpm)
pnpm install

# Set up environment variables
cp .env.example .env

# Generate database schema
pnpm db:generate

# Run migrations
pnpm db:migrate

# Start development server
pnpm dev
```

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm db:generate` | Generate database migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Drizzle Studio |

## 🌍 Environment Variables

Create a `.env` file with the following:

```bash
# Database
DATABASE_URL=your_turso_url
DATABASE_AUTH_TOKEN=your_turso_token

# Auth
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:4321

# Razorpay
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

# R2 Storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=your_bucket
R2_BUCKET_URL=your_bucket_url

# Email
RESEND_API_KEY=your_resend_key
```

## 💳 Razorpay Test Cards

Use these test card details in development mode:

| Card Network | Card Number           | CVV          | Expiry Date     |
| ------------ | --------------------- | ------------ | --------------- |
| Mastercard   | `5267 3181 8797 5449` | Any 3 digits | Any future date |
| Visa         | `4386 2894 0766 0153` | Any 3 digits | Any future date |

**Test Scenarios:**

- **Successful Payment**: Use above cards
- **Failed Payment**: Use card number `4000000000000002`
- **Insufficient Funds**: Use card number `4000000000000341`

### Discount Coupons Features

#### IMPLEMENTED FEATURES

- Percentage-based discounts on order total
- Fixed amount discounts on order total
- Minimum order value requirements
- Coupon usage limits and tracking
- Active/inactive coupon status
- Admin coupon management interface
- A prefixed amount will be deducted on specified products
- A rate will be deducted on specified products
- A prefixed amount will be deducted on items of specified categories
- A rate will be deducted on products of specified categories
- Offer free products when a customer buys a specified quantity of a product
- Fixed amount on a subscription
- Rate on a subscription

### CHOOSE WHEN THE DISCOUNT SHOULD BE APPLIED

#### CONDITION

- Manually enter a discount code
- When an order reaches a specific amount
- When a product is added a number of times
- When cart only contains specified products
- When cart contains some of the specified products
- When cart contains at least all specified products
- When cart only contains products from the specified categories
- When cart contains some products from the specified categories

# DataTable Usage Guide

## Overview

The `DataTable` component is a reusable table built with TanStack Table that provides sorting, filtering, pagination, and search functionality. Column definitions are kept separate in the `columns/` folder for better organization.

## Basic Usage

```tsx
import { DataTable } from '../react-ui/DataTable';
import { createProductColumns } from '../columns/product-columns';

function MyTableComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = createProductColumns({
    onEdit: (product) => console.log('Edit', product),
    onDelete: (product) => console.log('Delete', product),
    onView: (product) => console.log('View', product),
  });

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name" // Column to search in
      searchPlaceholder="Search products..."
      loading={loading}
      onRowClick={(row) => console.log('Row clicked', row)}
    />
  );
}
```

## DataTable Props

| Prop                | Type                         | Default     | Description                       |
| ------------------- | ---------------------------- | ----------- | --------------------------------- |
| `columns`           | `ColumnDef<TData, TValue>[]` | Required    | Column definitions                |
| `data`              | `TData[]`                    | Required    | Array of data objects             |
| `searchKey`         | `string`                     | Optional    | Key of column to enable search on |
| `searchPlaceholder` | `string`                     | "Search..." | Placeholder text for search input |
| `loading`           | `boolean`                    | `false`     | Show loading state                |
| `onRowClick`        | `(row: TData) => void`       | Optional    | Callback when row is clicked      |

## Creating Column Definitions

### 1. Create a new file in `src/components/columns/`

```tsx
// src/components/columns/my-entity-columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '../react-ui/Button';

interface MyEntity {
  id: string;
  name: string;
  // ... other properties
}

interface MyEntityColumnsProps {
  onEdit?: (entity: MyEntity) => void;
  onDelete?: (entity: MyEntity) => void;
}

export const createMyEntityColumns = ({
  onEdit,
  onDelete,
}: MyEntityColumnsProps = {}): ColumnDef<MyEntity>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true, // Enable sorting for this column
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const entity = row.original;
      return (
        <div className="flex space-x-2">
          {onEdit && <Button onClick={() => onEdit(entity)}>Edit</Button>}
          {onDelete && (
            <Button variant="error" onClick={() => onDelete(entity)}>
              Delete
            </Button>
          )}
        </div>
      );
    },
    enableSorting: false, // Disable sorting for actions
  },
];
```

### 2. Column Configuration Options

- `accessorKey`: The key from your data object
- `header`: Display name for the column header
- `cell`: Custom render function for the cell content
- `enableSorting`: Whether this column can be sorted (default: true)
- `id`: Custom identifier for the column (required if no accessorKey)

### 3. Custom Cell Rendering

```tsx
{
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const status = row.getValue("status") as string;
    return (
      <div className={`badge ${status === 'active' ? 'badge-success' : 'badge-error'}`}>
        {status}
      </div>
    );
  },
  enableSorting: true,
}
```

## Features

### ✅ Sorting

- Click column headers to sort
- Visual indicators (↑↓) show sort direction
- Only enabled for columns with `enableSorting: true`

### ✅ Search/Filtering

- Global search on specified column
- Real-time filtering as you type

### ✅ Pagination

- Configurable page sizes (10, 20, 30, 40, 50)
- Navigation controls (first, previous, next, last)
- Page information display

### ✅ Loading States

- Shows loading spinner when `loading={true}`
- Maintains table structure during loading

### ✅ Empty States

- Displays helpful message when no data
- Includes icon and descriptive text

### ✅ Row Actions

- Clickable rows with `onRowClick` prop
- Custom action buttons in columns
- Event propagation handled properly

## Styling

The component uses DaisyUI classes and adapts to your theme:

- `table-zebra` for alternating row colors
- `badge-*` for status indicators
- `btn-*` for action buttons
- Responsive design with `overflow-x-auto`

## Example Implementations

Check out these example column definitions:

- `product-columns.tsx` - E-commerce products
- `order-columns.tsx` - Order management
- `user-columns.tsx` - User administration

## Installation Note

Make sure to install TanStack Table:

```bash
npm install @tanstack/react-table
```
