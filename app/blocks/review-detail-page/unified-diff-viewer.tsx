import { useState } from 'react';
import classnames from 'classnames';
import { IconCode, IconChevronDown } from '@tabler/icons-react';
import type { PRFile } from '../../data/types';
import style from './unified-diff-viewer.module.css';

interface DiffLine {
  type: 'add' | 'del' | 'context';
  content: string;
  lineNum: number;
}

function parsePatch(patch: string): DiffLine[] {
  const lines: DiffLine[] = [];
  let lineNum = 0;
  for (const raw of patch.split('\n')) {
    if (raw.startsWith('@@')) {
      const m = raw.match(/@@ -\d+(?:,\d+)? \+(\d+)/);
      if (m) lineNum = parseInt(m[1]) - 1;
      continue;
    }
    if (raw.startsWith('+')) {
      lineNum++;
      lines.push({ type: 'add', content: raw.slice(1), lineNum });
    } else if (raw.startsWith('-')) {
      lines.push({ type: 'del', content: raw.slice(1), lineNum: 0 });
    } else {
      lineNum++;
      lines.push({ type: 'context', content: raw.slice(1), lineNum });
    }
  }
  return lines;
}

function FileDiff({ file }: { file: PRFile }) {
  const [open, setOpen] = useState(true);
  const lines = file.patch ? parsePatch(file.patch) : [];

  return (
    <div className={style.file}>
      <div className={style.fileHeader} onClick={() => setOpen((v) => !v)}>
        <span className={style.fileName}>{file.filename}</span>
        <div className={style.fileChanges}>
          <span className={style.add}>+{file.additions}</span>
          <span className={style.del}>-{file.deletions}</span>
        </div>
        <IconChevronDown size={14} className={classnames(style.chevron, { [style.open]: open })} />
      </div>

      {open && (
        <div className={style.diffBody}>
          {lines.length === 0 ? (
            <div className={style.noPatch}>No diff available for this file.</div>
          ) : (
            <table className={style.diffTable}>
              <tbody>
                {lines.map((line, i) => (
                  <tr
                    key={i}
                    className={classnames({
                      [style.lineAdd]: line.type === 'add',
                      [style.lineDel]: line.type === 'del',
                    })}
                  >
                    <td className={style.lineNum}>{line.lineNum > 0 ? line.lineNum : ''}</td>
                    <td className={classnames(style.lineType, {
                      [style.lineTypeAdd]: line.type === 'add',
                      [style.lineTypeDel]: line.type === 'del',
                    })}>
                      {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
                    </td>
                    <td className={style.lineCode}>{line.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export interface UnifiedDiffViewerProps {
  className?: string;
  files: PRFile[];
}

export function UnifiedDiffViewer({ className, files }: UnifiedDiffViewerProps) {
  return (
    <div className={classnames(style.root, className)}>
      <div className={style.header}>
        <IconCode size={16} />
        Unified Diff Viewer
      </div>
      <div className={style.files}>
        {files.map((f) => (
          <FileDiff key={f.filename} file={f} />
        ))}
      </div>
    </div>
  );
}
