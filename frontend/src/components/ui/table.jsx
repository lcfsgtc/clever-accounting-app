// frontend\src\components\ui\table.jsx (或 .tsx，取决于您的项目)

import React from 'react';

// Table Root Component
const Table = ({ className, children, ...props }) => (
  <div className="relative w-full overflow-auto">
    <table
      className={`w-full caption-bottom text-sm ${className}`}
      {...props}
    >
      {children}
    </table>
  </div>
);

// TableHeader Component
const TableHeader = ({ className, children, ...props }) => (
  <thead className={`[&_tr]:border-b ${className}`} {...props}>
    {children}
  </thead>
);

// TableBody Component
const TableBody = ({ className, children, ...props }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props}>
    {children}
  </tbody>
);

// TableFooter Component
const TableFooter = ({ className, children, ...props }) => (
  <tfoot
    className={`border-t bg-gray-100 font-medium [&>tr]:last:text-base ${className}`}
    {...props}
  >
    {children}
  </tfoot>
);

// TableRow Component
const TableRow = ({ className, children, ...props }) => (
  <tr
    className={`border-b transition-colors hover:bg-gray-100 data-[state=selected]:bg-gray-100 ${className}`}
    {...props}
  >
    {children}
  </tr>
);

// TableHead Component
const TableHead = ({ className, children, ...props }) => (
  <th
    className={`h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  >
    {children}
  </th>
);

// TableCell Component
const TableCell = ({ className, children, ...props }) => (
  <td
    className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  >
    {children}
  </td>
);

// TableCaption Component
const TableCaption = ({ className, children, ...props }) => (
  <caption
    className={`mt-4 text-sm text-gray-500 ${className}`}
    {...props}
  >
    {children}
  </caption>
);

// Export components
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};