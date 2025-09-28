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
