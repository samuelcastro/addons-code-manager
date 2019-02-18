import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Col } from 'react-bootstrap';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import { ApiState } from '../../reducers/api';
import { isErrorResponse, getVersionFile } from '../../api';
import FileTree from '../../components/FileTree';
import {
  actions as versionActions,
  Version,
  getVersionInfo,
} from '../../reducers/versions';
import { actions as notificationActions } from '../../reducers/notifications';

type PropsFromRouter = {
  addonId: string;
  versionId: string;
};

type PropsFromState = {
  apiState: ApiState;
  version: Version;
};

/* eslint-disable @typescript-eslint/indent */
type Props = RouteComponentProps<PropsFromRouter> &
  PropsFromState &
  ConnectedReduxProps;
/* eslint-enable @typescript-eslint/indent */

export class BrowseBase extends React.Component<Props> {
  async componentDidMount() {
    const { apiState, dispatch, match } = this.props;
    const { addonId, versionId } = match.params;

    const response = await getVersionFile({
      addonId: parseInt(addonId, 10),
      apiState,
      versionId: parseInt(versionId, 10),
    });

    if (isErrorResponse(response)) {
      dispatch(notificationActions.error({ error: response }));
    } else {
      dispatch(versionActions.loadVersionInfo({ version: response }));
    }
  }

  render() {
    const { version } = this.props;

    return (
      <React.Fragment>
        <Col md="3">{version && <FileTree version={version} />}</Col>
        <Col>
          <p>Version ID: {this.props.match.params.versionId}</p>
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
  const { versionId } = match.params;

  return {
    apiState: state.api,
    version: getVersionInfo(state.versions, parseInt(versionId, 10)),
  };
};

export default connect(mapStateToProps)(BrowseBase);
