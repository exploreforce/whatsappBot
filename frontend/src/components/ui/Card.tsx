import { cn } from '@/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  actions,
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('bg-white shadow rounded-lg', className)} {...props}>
      {(title || description || actions) && (
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            {title && (
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
};

export default Card; 