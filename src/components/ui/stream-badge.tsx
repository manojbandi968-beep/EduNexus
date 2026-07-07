import React from 'react';
import { cn } from '@/lib/utils';
import { type StreamCode } from '@/types';
import { STREAMS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

interface StreamBadgeProps {
  stream: StreamCode;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export function StreamBadge({ stream, size = 'md', showDot = true, className }: StreamBadgeProps) {
  const streamInfo = STREAMS[stream];
  if (!streamInfo) return null;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 border-0 font-semibold',
        streamInfo.bgColor,
        streamInfo.textColor,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span
          className={cn('rounded-full', dotSizes[size])}
          style={{ backgroundColor: streamInfo.color }}
        />
      )}
      {streamInfo.name}
    </Badge>
  );
}
