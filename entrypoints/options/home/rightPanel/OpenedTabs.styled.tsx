import styled from 'styled-components';
import { StyledEllipsis } from '~/entrypoints/common/style/Common.styled';

export const StyledGroupWrapper = styled.div<{ $color?: string }>`
  margin-bottom: 4px;

  .group-header-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 4px 0;
    font-size: 12px;
    color: ${props => props.theme.colorTextSecondary || '#666'};
    user-select: none;

    &:hover {
      color: ${props => props.theme.colorText || '#000'};
    }

    .collapse-icon-btn {
      display: flex;
      align-items: center;
      width: 16px;
      flex-shrink: 0;
    }

    .group-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .tab-list {
    display: block;
    .tab-list-item {
      position: relative;
      padding-left: 24px;
      .group-color-flag {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        background-color: ${props => props.$color || 'transparent'};
      }
    }
  }

  &.collapsed {
    .tab-list {
      display: none;
    }
  }
`;

export const StyledTabItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  &:hover,
  &.active {
    background: ${props => props.theme.colorPrimaryBg || 'rgba(0, 0, 0, 0.1)'};
  }
  // &.active:before {
  //   content: '';
  //   position: absolute;
  //   left: 0;
  //   top: 0;
  //   width: 3px;
  //   height: 100%;
  //   background: ${props => props.theme.colorPrimary};
  // }
  .tab-item-title {
    flex: 1;
    overflow: hidden;
    font-size: 12px;
    color: ${props => props.theme.colorText || '#000'};
    ${StyledEllipsis}
  }
  .action-icon-btn {
    flex-shrink: 0;
    margin-left: 8px;
  }
  &.discarded {
    .tab-item-title,
    .btn-discarded {
      color: ${props => props.theme.colorTextQuaternary || 'rgba(0, 0, 0, 0.25)'};
    }
  }
`;

export default {
  name: 'opened-tabs-styled',
};
