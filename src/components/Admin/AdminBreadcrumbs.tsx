import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbsProps {
  items: BreadcrumbItem[];
  pageTitle?: string;
  pageDescription?: string;
}

export function AdminBreadcrumbs({ items, pageTitle, pageDescription }: AdminBreadcrumbsProps) {
  // Always include Dashboard as the first item if not already present
  const breadcrumbItems = items[0]?.label === 'Dashboard'
    ? items
    : [{ label: 'Dashboard', href: '/admin' }, ...items];

  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          {breadcrumbItems.map((item, index) => (
            <li key={index}>
              {item.href && index < breadcrumbItems.length - 1 ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Page Title and Description */}
      {pageTitle && (
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
          {pageDescription && (
            <p className="text-base-content/70">{pageDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}