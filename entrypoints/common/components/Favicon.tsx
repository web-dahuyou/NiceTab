import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFaviconUrl } from '~/entrypoints/common/utils/favicon';
import faviconDefaultImage from '/icon/favicon-default.png';

const StyledTabItemFavicon = styled.i<{ $bgUrl?: string }>`
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  background: url(${props => props.$bgUrl}) no-repeat center / 100% 100%;
`;

export default function Favicon({
  pageUrl,
  favIconUrl,
}: {
  pageUrl: string;
  favIconUrl?: string;
}) {
  const [renderUrl, setRenderUrl] = useState(faviconDefaultImage);

  const handleError = () => {
    console.log('handleError');
    setRenderUrl(faviconDefaultImage);
  };

  const init = async () => {
    const url = favIconUrl || (await getFaviconUrl(pageUrl));
    setTimeout(() => {
      setRenderUrl(url);
    }, 100);
  };

  useEffect(() => {
    init();
  }, []);

  return <StyledTabItemFavicon $bgUrl={renderUrl} onError={handleError} />;
}
