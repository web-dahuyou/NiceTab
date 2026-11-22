import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { LoadingOutlined } from '@ant-design/icons';
import { classNames } from '~/entrypoints/common/utils/common';
import {
  defaultFaviconUrl,
  getFaviconUrl,
  getInitialFaviconUrl,
} from '~/entrypoints/common/utils/favicon';

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
  const [image, setImage] = useState({ url: '', requestId: 0 });
  const requestIdRef = useRef(0);
  const failedUrlsRef = useRef(new Set<string>());

  const onLoad = () => {
    if (image.requestId === requestIdRef.current) setLoading(false);
  };

  const onError = async () => {
    // console.log(`onError--${pageUrl}`);
    const requestId = image.requestId;
    if (requestId !== requestIdRef.current) return;
    if (image.url === defaultFaviconUrl) {
      setLoading(false);
      return;
    }
    // 同一地址的重复 error 不启动并行恢复；后续候选失败时继续回退。
    if (failedUrlsRef.current.has(image.url)) return;
    const knownFailedUrl =
      favIconUrl && failedUrlsRef.current.has(favIconUrl) ? favIconUrl : undefined;
    failedUrlsRef.current.add(image.url);
    setLoading(true);
    const url = await getFaviconUrl(
      pageUrl,
      32,
      [...failedUrlsRef.current],
      knownFailedUrl,
    );
    if (requestId !== requestIdRef.current) return;
    if (failedUrlsRef.current.has(url)) {
      setImage({ url: defaultFaviconUrl, requestId });
      setLoading(false);
      return;
    }
    setImage({ url, requestId });
  };

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    failedUrlsRef.current = new Set();
    setLoading(true);
    setImage({ url: '', requestId });

    const init = async () => {
      if (!pageUrl?.trim?.()) {
        setImage({ url: defaultFaviconUrl, requestId });
        setLoading(false);
        return;
      }
      const url = favIconUrl
        ? await getInitialFaviconUrl(pageUrl, favIconUrl)
        : await getFaviconUrl(pageUrl);
      if (requestId !== requestIdRef.current) return;
      if (favIconUrl && url !== favIconUrl) failedUrlsRef.current.add(favIconUrl);
      setImage({ url, requestId });
    };
    void init();
    return () => {
      requestIdRef.current += 1;
    };
  }, [pageUrl, favIconUrl]);

  return (
    <StyledFaviconBox className="favicon-box" $size={size}>
      {image.url && (
        <StyledFavicon
          key={`${image.requestId}:${image.url}`}
          className={classNames('img-favicon', loading && 'loading')}
          src={image.url}
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
