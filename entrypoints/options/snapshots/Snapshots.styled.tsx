import styled from 'styled-components';

export const StyledSnapshotsPage = styled.div`
  width: min(1120px, 100%);
  margin: 0 auto;

  .snapshot-toolbar,
  .section-title,
  .snapshot-header,
  .editor-toolbar,
  .group-header,
  .tab-row {
    display: flex;
    align-items: center;
  }

  .snapshot-toolbar {
    position: sticky;
    top: 60px;
    z-index: 8;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 0;
    background: ${props => props.theme.colorBgContainer};
  }

  .snapshot-section + .snapshot-section {
    margin-top: 28px;
  }

  .section-title {
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .snapshot-header {
    min-width: 0;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
  }

  .snapshot-heading {
    min-width: 0;
  }

  .snapshot-name {
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .snapshot-meta {
    margin-top: 3px;
    color: ${props => props.theme.colorTextSecondary};
    font-size: 12px;
  }

  .snapshot-actions {
    flex: 0 0 auto;
  }

  .snapshot-editor {
    min-width: 0;
    padding: 8px 0 4px;
  }

  .editor-toolbar {
    position: sticky;
    top: 124px;
    z-index: 6;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    background: ${props => props.theme.colorBgContainer};
  }

  .snapshot-name-input {
    width: min(420px, 100%);
  }

  .snapshot-items {
    display: grid;
    min-width: 0;
    gap: 10px;
    margin-top: 8px;
  }

  .snapshot-items > div,
  .group-tabs > div {
    min-width: 0;
    max-width: 100%;
  }

  .snapshot-group {
    overflow: hidden;
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
    border: 1px solid ${props => props.theme.colorBorderSecondary};
    border-radius: 6px;
  }

  .group-header {
    min-width: 0;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
    padding: 6px 10px;
    background: ${props => props.theme.colorFillQuaternary};
  }

  .group-title {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 8px;
    font-weight: 600;
  }

  .group-tabs {
    display: grid;
    gap: 1px;
    padding: 4px 8px 8px;
  }

  .tab-row {
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
    gap: 8px;
    min-height: 42px;
    padding: 5px 8px;
    border: 1px solid transparent;
    border-radius: 4px;
    transition:
      background-color 160ms ease,
      border-color 160ms ease;
  }

  .tab-row:hover,
  .tab-row:focus-within {
    border-color: ${props => props.theme.colorBorderSecondary};
    background: ${props => props.theme.colorFillQuaternary};
  }

  .drag-handle {
    color: ${props => props.theme.colorTextTertiary};
    cursor: grab;
  }

  .tab-content {
    min-width: 0;
    flex: 1;
  }

  .tab-title,
  .tab-url {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tab-url {
    color: ${props => props.theme.colorTextSecondary};
    font-size: 12px;
  }

  .drop-target {
    min-height: 30px;
    padding: 6px 10px;
    border: 1px dashed ${props => props.theme.colorBorder};
    border-radius: 4px;
    color: ${props => props.theme.colorTextTertiary};
    font-size: 12px;
    text-align: center;
  }

  @media (max-width: 720px) {
    .snapshot-toolbar,
    .editor-toolbar,
    .snapshot-header {
      align-items: stretch;
      flex-direction: column;
    }

    .snapshot-actions {
      align-self: flex-end;
    }

    .snapshot-name-input {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tab-row {
      transition: none;
    }
  }
`;

export default StyledSnapshotsPage;
