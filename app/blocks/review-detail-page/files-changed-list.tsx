import { useState } from 'react';
import classnames from 'classnames';
import { IconFileCode, IconChevronDown } from '@tabler/icons-react';
import type { PRFile } from '../../data/types';
import style from './files-changed-list.module.css';

export interface FilesChangedListProps {
  className?: string;
  files: PRFile[];
}

const STATUS_CLS: Record<string, string> = {
  added: style.statusAdded,
  modified: style.statusModified,
  deleted: style.statusDeleted,
  renamed: style.statusModified,
};

function heatmapCells(additions: number, deletions: number) {
  const total = additions + deletions;
  const intensity = Math.min(total / 100, 1);
  const cells = 5;
  return Array.from({ length: cells }, (_, i) => {
    const threshold = (i + 1) / cells;
    const active = intensity >= threshold;
    const alpha = active ? 0.3 + intensity * 0.7 : 0.08;
    return `rgba(59, 130, 246, ${alpha})`;
  });
}

export function FilesChangedList({ className, files }: FilesChangedListProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className={classnames(style.root, className)}>
      <div className={style.header} onClick={() => setOpen((v) => !v)}>
        <div className={style.headerLeft}>
          <IconFileCode size={16} />
          Files Changed ({files.length})
        </div>
        <IconChevronDown size={16} className={classnames(style.chevron, { [style.open]: open })} />
      </div>

      {open && (
        <div className={style.fileList}>
          {files.map((f) => {
            const cells = heatmapCells(f.additions, f.deletions);
            return (
              <div key={f.filename} className={style.fileRow}>
                <span className={classnames(style.statusDot, STATUS_CLS[f.status] ?? style.statusModified)} />
                <span className={style.fileName}>{f.filename}</span>
                <div className={style.heatmap}>
                  {cells.map((bg, i) => (
                    <div key={i} className={style.heatCell} style={{ background: bg }} />
                  ))}
                </div>
                <div className={style.changes}>
                  <span className={style.add}>+{f.additions}</span>
                  <span className={style.del}>-{f.deletions}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
