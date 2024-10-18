import type {
  SyncConfigItemProps,
  SyncRemoteType,
  SyncStatus,
  SyncResultItemProps,
} from '~/entrypoints/types';

export type RemoteOptionProps = {
  key: SyncRemoteType;
  label: string;
  pageUrl: string;
};

export type BaseCardItemProps<T = RemoteOptionProps> = {
  option: T;
  isActive?: boolean;
  syncConfig?: SyncConfigItemProps;
  syncStatus: SyncStatus;
  syncResult: SyncResultItemProps[];
  cardTitle?: JSX.Element;
  onAction?: (option: T, actionType: string) => void;
  validator?: (params: T) => boolean;
};

export type ExtendedCardItemProps = Pick<
  BaseCardItemProps,
  'option' | 'isActive' | 'onAction'
> & {
  cardTitle: JSX.Element;
  description: JSX.Element;
  actions: JSX.Element[];
};
