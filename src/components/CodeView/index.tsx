import * as React from 'react';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';
import makeClassName from 'classnames';

import styles from './styles.module.scss';
import LinterMessage from '../LinterMessage';
import { getLines, mapWithDepth } from './utils';
import refractor from '../../refractor';
import { getLanguageFromMimeType } from '../../utils';
import { LinterMessagesByLine } from '../../reducers/linter';

// This function mimics what https://github.com/rexxars/react-refractor does,
// but we need a different layout to inline comments so we cannot use this
// component.
const renderHighlightedCode = (code: string, language: string) => {
  const ast = refractor.highlight(code, language);
  const value = ast.length === 0 ? code : ast.map(mapWithDepth(0));

  return (
    <pre className={styles.highlightedCode}>
      <code className={`language-${language}`}>{value}</code>
    </pre>
  );
};

const isLineSelected = (
  id: string,
  location: RouteComponentProps['location'],
) => {
  return `#${id}` === location.hash;
};

export const scrollToSelectedLine = (element: HTMLTableRowElement | null) => {
  if (element) {
    element.scrollIntoView();
  }
};

export type PublicProps = {
  _scrollToSelectedLine?: typeof scrollToSelectedLine;
  linterMessagesByLine: LinterMessagesByLine | void;
  mimeType: string;
  content: string;
};

type Props = PublicProps & RouteComponentProps;

type RowProps = {
  className: string;
  id: string;
  ref?: typeof scrollToSelectedLine;
};

export const CodeViewBase = ({
  _scrollToSelectedLine = scrollToSelectedLine,
  content,
  location,
  linterMessagesByLine,
  mimeType,
}: Props) => {
  const language = getLanguageFromMimeType(mimeType);

  return (
    <div className={styles.CodeView}>
      <table className={styles.table}>
        <tbody className={styles.tableBody}>
          {getLines(content).map((code, i) => {
            const line = i + 1;

            let rowProps: RowProps = {
              id: `L${line}`,
              className: styles.line,
            };

            if (isLineSelected(rowProps.id, location)) {
              rowProps = {
                ...rowProps,
                className: makeClassName(
                  rowProps.className,
                  styles.selectedLine,
                ),
                ref: _scrollToSelectedLine,
              };
            }

            return (
              <React.Fragment key={`fragment-${line}`}>
                <tr {...rowProps}>
                  <td className={styles.lineNumber}>
                    <Link to={`#L${line}`}>{`${line}`}</Link>
                  </td>

                  <td className={styles.code}>
                    {renderHighlightedCode(code, language)}
                  </td>
                </tr>
                {linterMessagesByLine && linterMessagesByLine[line] && (
                  <tr>
                    <td
                      id={`line-${line}-messages`}
                      className={styles.linterMessages}
                      colSpan={2}
                    >
                      {linterMessagesByLine[line].map((msg) => {
                        return <LinterMessage key={msg.uid} message={msg} />;
                      })}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default withRouter(CodeViewBase);
