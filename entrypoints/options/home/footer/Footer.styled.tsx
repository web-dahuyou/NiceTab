import styled from 'styled-components';

export const StyledFooterWrapper = styled.div<{ $paddingLeft?: number }>`
  display: flex;
  align-items: center;
  height: 70px;
  padding-left: ${(props) => props.$paddingLeft || 0}px;
  gap: 10px;
  transition: padding 0.2s ease-in-out;
  .next-version-tip {
    max-width: 820px;
    margin-left: auto;
  }
`;


export default {
  name: 'home-footer-styled',
};
