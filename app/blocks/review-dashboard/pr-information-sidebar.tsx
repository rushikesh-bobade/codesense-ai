import classnames from 'classnames';
import { IconGitBranch, IconCalendar, IconFileCode } from '@tabler/icons-react';
import type { PRData } from '../../data/types';
import style from './pr-information-sidebar.module.css';

export interface PRInformationSidebarProps {
  className?: string;
  prData: PRData;
}

const STATUS_CLS: Record<string, string> = {
  added: style.statusAdded,
  modified: style.statusModified,
  deleted: style.statusDeleted,
  renamed: style.statusModified,
};

export function PRInformationSidebar({ className, prData }: PRInformationSidebarProps) {
  const formattedDate = new Date(prData.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <aside className={classnames(style.root, className)}>
      <div className={style.header}>PR Information</div>
      <div className={style.body}>
        <div className={style.prTitle}>{prData.title}</div>

        <div className={style.author}>
          {prData.authorAvatar ? (
            <img src={prData.authorAvatar} alt={prData.author} className={style.avatar} />
          ) : (
            <div className={style.avatarPlaceholder}>{prData.author[0]?.toUpperCase()}</div>
          )}
          <div className={style.authorInfo}>
            <span className={style.authorName}>{prData.author}</span>
            <span className={style.authorRole}>Author</span>
          </div>
        </div>

        <div className={style.meta}>
          <div className={style.metaRow}>
            <span className={style.metaIcon}><IconFileCode size={14} /></span>
            <span className={style.metaValue}>{prData.repo}</span>
          </div>
          <div className={style.metaRow}>
            <span className={style.metaIcon}><IconCalendar size={14} /></span>
            <span className={style.metaValue}>{formattedDate}</span>
          </div>
        </div>

        <div className={style.branches}>
          <span className={style.metaIcon}><IconGitBranch size={14} /></span>
          <span className={style.branch}>{prData.branch}</span>
          <span className={style.branchArrow}>→</span>
          <span className={style.branch}>{prData.baseBranch}</span>
        </div>

        <div className={style.divider} />

        <div>
          <div className={style.filesTitle}>Changed Files ({prData.changedFiles})</div>
          <div className={style.filesList}>
            {prData.files.slice(0, 8).map((f) => (
              <div key={f.filename} className={style.fileRow}>
                <span className={classnames(style.fileStatus, STATUS_CLS[f.status] ?? style.statusModified)} />
                <span className={style.fileName}>{f.filename.split('/').pop()}</span>
                <div className={style.fileChanges}>
                  <span className={style.add}>+{f.additions}</span>
                  <span className={style.del}>-{f.deletions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={style.divider} />

        <div className={style.totalChanges}>
          <div className={classnames(style.changeCard, style.changeCardGreen)}>
            <div className={classnames(style.changeNum, style.changeNumGreen)}>+{prData.additions}</div>
            <div className={style.changeLabel}>Additions</div>
          </div>
          <div className={classnames(style.changeCard, style.changeCardRed)}>
            <div className={classnames(style.changeNum, style.changeNumRed)}>-{prData.deletions}</div>
            <div className={style.changeLabel}>Deletions</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
