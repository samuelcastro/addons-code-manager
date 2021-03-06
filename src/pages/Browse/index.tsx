import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Col, Row } from 'react-bootstrap';
import log from 'loglevel';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import { ApiState } from '../../reducers/api';
import {
  LinterMessageMap,
  fetchLinterMessages,
  selectMessageMap,
} from '../../reducers/linter';
import FileTree from '../../components/FileTree';
import LinterMessage from '../../components/LinterMessage';
import {
  Version,
  VersionFile,
  fetchVersion,
  fetchVersionFile,
  getVersionFile,
  getVersionInfo,
} from '../../reducers/versions';
import { gettext } from '../../utils';
import Loading from '../../components/Loading';
import CodeView from '../../components/CodeView';
import FileMetadata from '../../components/FileMetadata';
import styles from './styles.module.scss';

export type PublicProps = {
  _fetchLinterMessages: typeof fetchLinterMessages;
  _fetchVersion: typeof fetchVersion;
  _fetchVersionFile: typeof fetchVersionFile;
  _log: typeof log;
};

type PropsFromRouter = {
  addonId: string;
  versionId: string;
};

type PropsFromState = {
  apiState: ApiState;
  file: VersionFile | null | void;
  linterMessages: LinterMessageMap | void;
  linterMessagesAreLoading: boolean;
  version: Version;
};

export type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  PublicProps &
  ConnectedReduxProps;

export class BrowseBase extends React.Component<Props> {
  static defaultProps = {
    _fetchLinterMessages: fetchLinterMessages,
    _fetchVersion: fetchVersion,
    _fetchVersionFile: fetchVersionFile,
    _log: log,
  };

  componentDidMount() {
    const { _fetchVersion, dispatch, match } = this.props;
    const { addonId, versionId } = match.params;

    dispatch(
      _fetchVersion({
        addonId: parseInt(addonId, 10),
        versionId: parseInt(versionId, 10),
      }),
    );
  }

  componentDidUpdate() {
    const {
      _fetchLinterMessages,
      dispatch,
      version,
      linterMessages,
      linterMessagesAreLoading,
    } = this.props;

    if (version && linterMessages === undefined && !linterMessagesAreLoading) {
      dispatch(
        _fetchLinterMessages({
          versionId: version.id,
          url: version.validationURL,
        }),
      );
    }
  }

  onSelectFile = (path: string) => {
    const { _fetchVersionFile, dispatch, match } = this.props;
    const { addonId, versionId } = match.params;

    dispatch(
      _fetchVersionFile({
        addonId: parseInt(addonId, 10),
        versionId: parseInt(versionId, 10),
        path,
      }),
    );
  };

  render() {
    const { file, linterMessages, version } = this.props;

    if (!version) {
      return (
        <Col>
          <Loading message={gettext('Loading version...')} />
        </Col>
      );
    }

    let messageMap;
    if (linterMessages && version) {
      messageMap = linterMessages[version.selectedPath];
    }

    return (
      <React.Fragment>
        <Col md="3">
          <Row>
            <Col>
              <FileTree
                linterMessages={linterMessages}
                onSelect={this.onSelectFile}
                version={version}
              />
            </Col>
          </Row>
          {file && (
            <Row>
              <Col className={styles.metadata}>
                <FileMetadata file={file} />
              </Col>
            </Row>
          )}
        </Col>
        <Col md="9">
          {messageMap &&
            messageMap.global.map((message) => {
              return <LinterMessage key={message.uid} message={message} />;
            })}
          {file ? (
            <CodeView
              linterMessagesByLine={messageMap && messageMap.byLine}
              mimeType={file.mimeType}
              content={file.content}
            />
          ) : (
            <Loading message={gettext('Loading content...')} />
          )}
        </Col>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: RouteComponentProps<PropsFromRouter>,
): PropsFromState => {
  const { match } = ownProps;
  const versionId = parseInt(match.params.versionId, 10);

  const version = getVersionInfo(state.versions, versionId);
  const file = version
    ? getVersionFile(state.versions, versionId, version.selectedPath)
    : null;

  const linterMessages = version
    ? selectMessageMap(state.linter, version.id)
    : undefined;

  return {
    apiState: state.api,
    file,
    linterMessages,
    linterMessagesAreLoading: state.linter.isLoading,
    version,
  };
};

export default connect(mapStateToProps)(BrowseBase);
