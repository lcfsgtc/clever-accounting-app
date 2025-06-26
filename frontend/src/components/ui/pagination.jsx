// frontend\src\components\ui\pagination.jsx (或 .tsx，取决于您的项目)

import React from 'react';

// Base component for navigation links
const PaginationLink = ({ className, isActive, children, ...props }) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={`flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-gray-200 bg-white text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 ${
      isActive ? 'bg-gray-100 text-gray-900' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </a>
);

// Component for previous button
const PaginationPrevious = ({ className, ...props }) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default" // Assuming a size prop is used for styling
    className={`gap-1 pl-2.5 ${className}`}
    {...props}
  >
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
    <span>Previous</span>
  </PaginationLink>
);

// Component for next button
const PaginationNext = ({ className, ...props }) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default" // Assuming a size prop
    className={`gap-1 pr-2.5 ${className}`}
    {...props}
  >
    <span>Next</span>
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  </PaginationLink>
);

// Component for ellipsis (...)
const PaginationEllipsis = ({ className, ...props }) => (
  <span
    aria-hidden
    className={`flex h-9 w-9 items-center justify-center ${className}`}
    {...props}
  >
    ...
  </span>
);

// Main Pagination Container
const Pagination = ({ className, children, ...props }) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={`mx-auto flex w-full justify-center ${className}`}
    {...props}
  >
    {children}
  </nav>
);

// Content Wrapper for pagination items
const PaginationContent = ({ className, children, ...props }) => (
  <ul className={`flex flex-row items-center gap-1 ${className}`} {...props}>
    {children}
  </ul>
);

// Individual Pagination Item
const PaginationItem = ({ className, children, ...props }) => (
  <li className={className} {...props}>
    {children}
  </li>
);

// Export components
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};