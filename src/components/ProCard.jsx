'use client';

export default function ProCard({ children, className = '', hover = true, ...props }) {
  const baseClasses = "card card-md";
  const hoverClasses = hover ? "hover:shadow-lg hover:-translate-y-1" : "";
  const combinedClasses = `${baseClasses} ${hoverClasses} ${className}`.trim();

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
}