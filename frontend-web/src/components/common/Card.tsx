import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  hover?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  actions,
  className = '',
  hover = false,
  glass = false,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-2xl shadow-card border border-dark-100 overflow-hidden';
  const hoverClasses = hover
    ? ' transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer'
    : '';
  const glassClasses = glass ? ' bg-white/80 backdrop-blur-lg border-white/20' : '';

  return (
    <div className={`${baseClasses}${hoverClasses}${glassClasses} ${className}`} {...props}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          {title && <h3 className="text-lg font-semibold text-dark-900">{title}</h3>}
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`px-6 py-4 border-b border-dark-100 ${className}`}>{children}</div>;
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-6 py-4 border-t border-dark-100 bg-dark-50/50 ${className}`}>
      {children}
    </div>
  );
};

