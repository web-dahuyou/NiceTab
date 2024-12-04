import React, { useEffect, useState } from 'react';
import { Skeleton } from 'antd';

export default function DelayedComponent({
  delay = 30,
  fallback = <Skeleton />,
  children,
}: {
  delay?: number;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [display, setDisplay] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplay(true);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [delay]);

  return display ? children : fallback;
}
