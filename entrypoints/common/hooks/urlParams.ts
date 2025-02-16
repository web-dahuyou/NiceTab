import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParams = useMemo(() => {
    const params: Record<string, string> = {};
    for (let [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  }, [searchParams]);

  return {
    urlParams,
    setSearchParams,
  }
}