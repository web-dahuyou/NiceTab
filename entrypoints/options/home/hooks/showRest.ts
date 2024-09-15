import { useState } from 'react';

export default function useRest<T>({
  list = [],
  totalCount = 0,
  defaultCount = 10,
}: {
  list: T[];
  totalCount?: number;
  defaultCount?: number;
}) {
  const [showRest, setShowRest] = useState(false);
  const defaultList = list.slice(0, defaultCount);
  const restList = list.slice(defaultCount);

  const handleShowRest = () => {
    setShowRest(true);
  };

  useEffect(() => {
    if (totalCount <= defaultCount) {
      setShowRest(true);
    }
  }, []);

  return {
    showRest,
    defaultList,
    restList,
    handleShowRest,
  };
}
