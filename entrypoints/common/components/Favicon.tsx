import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFaviconUrl } from '~/entrypoints/common/utils/favicon';
import faviconDefaultImage from '/icon/favicon-default.png';

const StyledFavicon = styled.img<{ $size?: number }>`
  flex: 0 0 ${props => props.$size}px;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
`;

export default function Favicon({
  pageUrl,
  favIconUrl,
  size = 16,
}: {
  pageUrl: string;
  favIconUrl?: string;
  size?: number;
}) {
  const [renderUrl, setRenderUrl] = useState(faviconDefaultImage);

  const handleError = () => {
    // console.log('handleError');
    setRenderUrl(faviconDefaultImage);
  };

  const init = async () => {
    if (!pageUrl?.trim?.()) {
      setRenderUrl(faviconDefaultImage);
      return;
    }
    const url = favIconUrl || (await getFaviconUrl(pageUrl));
    setTimeout(() => {
      setRenderUrl(url);
    }, 100);
  };

  useEffect(() => {
    init();
  }, [pageUrl, favIconUrl]);

  return (
    <StyledFavicon
      className="img-favicon"
      src={renderUrl}
      $size={size}
      onError={handleError}
    />
  );
}
