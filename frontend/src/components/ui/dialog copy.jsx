// frontend\src\components\ui\dialog.jsx

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react'; // For the close icon

// Dialog Root Component
// It manages the open/close state and handles outside clicks and escape key
const Dialog = ({ open, onOpenChange, children }) => {
  const contentRef = useRef(null);

  // Handle escape key press
  const handleEscape = useCallback((event) => {
    if (event.key === 'Escape' && open) {
      onOpenChange(false);
    }
  }, [open, onOpenChange]);

  // Handle outside click
  const handleClickOutside = useCallback((event) => {
    if (contentRef.current && !contentRef.current.contains(event.target)) {
      onOpenChange(false);
    }
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling when dialog is open
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = ''; // Restore scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = ''; // Ensure scrolling is restored on unmount
    };
  }, [open, handleEscape, handleClickOutside]);

  // Render the children (DialogTrigger, DialogContent, etc.)
  // We don't directly control visibility here, DialogContent will be conditioned
  return (
    <div className="relative z-50">
      {children}
      {/* Only render DialogContent if open is true */}
      {open && (
        <DialogContentWrapper ref={contentRef} onOpenChange={onOpenChange}>
          {React.Children.map(children, child =>
            child.type !== DialogTrigger ? child : null
          )}
        </DialogContentWrapper>
      )}
    </div>
  );
};

// Internal Wrapper for DialogContent to handle its own rendering logic
const DialogContentWrapper = React.forwardRef(({ className, children, onOpenChange, ...props }, ref) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 ${className}`}
      {...props}
    >
      <div ref={ref} className="relative w-full max-w-lg rounded-lg border bg-white p-6 shadow-lg transform scale-100 opacity-100 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%] sm:max-w-lg sm:rounded-lg">
        {children}
        {/* Close button with actual onClick handler */}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => onOpenChange(false)} // Call onOpenChange to close dialog
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
});

// DialogTrigger Component (unchanged, it's just a button)
const DialogTrigger = ({ children, onClick, ...props }) => {
  // We need to assume the parent Dialog component will toggle 'open' state
  // or you explicitly set the open state from here.
  // For shadcn/ui, the Dialog component usually provides the trigger.
  // If this is meant to be standalone, you'd need to pass setIsDialogOpen here.
  return <button {...props}>{children}</button>;
};

// DialogHeader Component
const DialogHeader = ({ className, children, ...props }) => {
  return (
    <div
      className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// DialogTitle Component
const DialogTitle = ({ className, children, ...props }) => {
  return (
    <h2
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
};

// DialogDescription Component
const DialogDescription = ({ className, children, ...props }) => {
  return (
    <p
      className={`text-sm text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

// DialogFooter Component
const DialogFooter = ({ className, children, ...props }) => {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Export components
export {
  Dialog,
  DialogTrigger,
  DialogContentWrapper as DialogContent, // Export the wrapper as DialogContent
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};