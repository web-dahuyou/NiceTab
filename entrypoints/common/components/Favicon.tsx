import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { LoadingOutlined } from '@ant-design/icons';
import { classNames } from '~/entrypoints/common/utils/common';
import { getFaviconUrl } from '~/entrypoints/common/utils/favicon';
import faviconDefaultImage from '/icon/favicon-default.png';

const StyledFaviconBox = styled.div<{ $size?: number }>`
  flex: 0 0 ${props => props.$size}px;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  .img-favicon,
  .img-loading {
    width: 100%;
    height: 100%;
  }
`;

const StyledFavicon = styled.img`
  &.loading {
    display: none;
  }
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
  const [loading, setLoading] = useState(true);
  const [renderUrl, setRenderUrl] = useState('');

  const onLoad = () => {
    setLoading(false);
  };

  const onError = () => {
    // console.log(`onError--${pageUrl}`);
    setRenderUrl(faviconDefaultImage);
    setLoading(false);
  };

  const init = async () => {
    setLoading(true);

    if (!pageUrl?.trim?.()) {
      setRenderUrl(faviconDefaultImage);
      setLoading(false);
      return;
    }
    const url = favIconUrl || (await getFaviconUrl(pageUrl));
    setRenderUrl(url);
    // src 未变化时不会触发 load 事件，需直接结束 loading
    if (url === renderUrl) setLoading(false);
  };

  useEffect(() => {
    init();
  }, [pageUrl, favIconUrl]);

  return (
    <StyledFaviconBox className="favicon-box" $size={size}>
      {renderUrl && (
        <StyledFavicon
          className={classNames('img-favicon', loading && 'loading')}
          src={renderUrl}
          onLoad={onLoad}
          onError={onError}
        />
      )}
      {loading && (
        <LoadingOutlined className="img-loading" style={{ fontSize: `${size}px` }} />
      )}
    </StyledFaviconBox>
  );
}
