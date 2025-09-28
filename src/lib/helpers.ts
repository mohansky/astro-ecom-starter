// Format currency
export function formatCurrency(amount: number) {
  return `₹ ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format currency using Intl API (alternative format)
export function formatCurrencyIntl(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

// Format date from ISO string
export function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format date from ISO string
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Format date with long month name
export function formatDateLong(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

// Format date and time with short format
export function formatDateTimeShort(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Get status badge CSS class for order status
export function getStatusBadgeClass(status: string): string {
  const statusClasses: Record<string, string> = {
    'pending': 'badge-warning',
    'processing': 'badge-info',
    'shipped': 'badge-primary',
    'delivered': 'badge-success',
    'cancelled': 'badge-error'
  };

  return statusClasses[status.toLowerCase()] || 'badge-neutral';
}

// Format address lines
export function formatAddress(customer: {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): string[] {
  const lines: string[] = [];

  if (customer.address) {
    lines.push(customer.address);
  }

  const cityStateZip = [customer.city, customer.state, customer.zipCode]
    .filter(Boolean)
    .join(', ');

  if (cityStateZip) {
    lines.push(cityStateZip);
  }

  return lines;
}

// Get full avatar URL for user images
export function getAvatarUrl(avatar?: string | null, r2BucketUrl?: string): string {
  // Default avatar URL for when no avatar is provided
  const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=random';

  if (!avatar) {
    return defaultAvatar;
  }

  // If avatar is already a full URL, return as is
  if (avatar.startsWith('http')) {
    return avatar;
  }

  // Use provided R2_BUCKET_URL or try to get from environment
  let R2_BUCKET_URL = r2BucketUrl;

  if (!R2_BUCKET_URL) {
    // Try different ways to access the environment variable
    try {
      if (import.meta?.env?.R2_BUCKET_URL) {
        R2_BUCKET_URL = import.meta.env.R2_BUCKET_URL;
      }
    } catch (e) {
      // import.meta might not be available in all contexts
    }

    if (!R2_BUCKET_URL && typeof window !== 'undefined' && (window as any).__R2_BUCKET_URL__) {
      R2_BUCKET_URL = (window as any).__R2_BUCKET_URL__;
    }
  }

  if (!R2_BUCKET_URL) {
    console.warn('R2_BUCKET_URL not found in environment variables, using default avatar');
    return defaultAvatar;
  }

  // Clean the src path and construct the full R2 URL (same logic as R2Image)
  const cleanSrc = avatar.replace(/^\.\//, '');
  return `${R2_BUCKET_URL}/${cleanSrc}`;
}

// Generate a fallback avatar URL with user initials
export function getInitialsAvatar(name: string): string {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128`;
}

// Handle fetch responses and detect 500 errors
export async function handleFetchResponse(response: Response) {
  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status} ${response.statusText}`);
    (error as any).status = response.status;

    // If it's a 500 error, it might be a session issue
    if (response.status === 500) {
      (error as any).isSessionError = true;
    }

    throw error;
  }

  return response.json();
}

// Check if an error is a session-related 500 error
export function isSessionError(error: any): boolean {
  return error?.status === 500 ||
         error?.isSessionError === true ||
         error?.message?.includes('500') ||
         error?.message?.toLowerCase().includes('session') ||
         error?.message?.toLowerCase().includes('expired');
}