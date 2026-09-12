import type { SnapshotLocaleKey } from './zhCN';

const ruRU: Record<SnapshotLocaleKey, string> = {
  'snapshots.title': 'Снимки',
  'snapshots.manual': 'Ручные снимки',
  'snapshots.auto': 'Последний автоматический снимок',
  'snapshots.create': 'Снимок текущего окна',
  'snapshots.empty': 'Нет снимков',
  'snapshots.autoEmpty': 'Автоматический снимок ещё не создан',
  'snapshots.tip.list': 'Список снимков хранит только последние 50 записей.',
  'snapshots.stats': `{tabs, plural,
    =0 {Нет вкладок}
    one {# вкладка}
    few {# вкладки}
    many {# вкладок}
    other {# вкладки}
  } · {groups, plural,
    =0 {Нет групп}
    one {# группа}
    few {# группы}
    many {# групп}
    other {# группы}
  } · {pinned, plural,
    =0 {Нет закреплённых}
    one {# закреплённая}
    few {# закреплённые}
    many {# закреплённых}
    other {# закреплённые}
  }`,
  'snapshots.restoreNewWindow': 'Восстановить в новом окне',
  'snapshots.restoreCurrentWindow': 'Заменить текущее окно',
  'snapshots.restoreCurrentConfirm': 'Вкладки в текущем окне будут заменены этой снимком. Продолжить?',
  'snapshots.deleteConfirm': 'Вы уверены, что хотите удалить этот снимок?',
  'snapshots.pinned': 'Закреплённая',
  'snapshots.created': 'Снимок создан',
};

export default ruRU;
