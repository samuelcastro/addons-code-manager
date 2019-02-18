import log from 'loglevel';

import { ApiState } from '../reducers/api';
import { ExternalUser } from '../reducers/users';
import { ExternalVersion } from '../reducers/versions';

export enum HttpMethod {
  DELETE = 'DELETE',
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
}

type CallApiParams = {
  endpoint: string;
  method?: HttpMethod;
  version?: string;
  apiState: ApiState;
  query?: { [key: string]: string };
};

export type ErrorResponseType = { error: Error };

type CallApiResponse<SuccessResponseType> =
  | SuccessResponseType
  | ErrorResponseType;

// This function below is a user-defined type guard that we use to check
// whether a callApi response object is successful or unsuccessful. We use
// `any` on purpose because we don't know the exact type for
// `SuccessResponseType`.
export const isErrorResponse = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arg: CallApiResponse<any>,
): arg is ErrorResponseType => {
  return arg.error !== undefined;
};

type Headers = {
  [name: string]: string;
};

// For the `extends {}` part, please see:
// https://github.com/Microsoft/TypeScript/issues/4922
export const callApi = async <SuccessResponseType extends {}>({
  apiState,
  endpoint,
  method = HttpMethod.GET,
  version = 'v4',
  query = {},
}: CallApiParams): Promise<CallApiResponse<SuccessResponseType>> => {
  let adjustedEndpoint = endpoint;
  if (!adjustedEndpoint.startsWith('/')) {
    adjustedEndpoint = `/${adjustedEndpoint}`;
  }
  if (!adjustedEndpoint.endsWith('/')) {
    adjustedEndpoint = `${adjustedEndpoint}/`;
  }

  const headers: Headers = {};
  if (apiState.authToken) {
    headers.Authorization = `Bearer ${apiState.authToken}`;
  }

  if (Object.keys(query).length) {
    const queryString = Object.keys(query)
      .map((k) => `${k}=${query[k]}`)
      .join('&');

    adjustedEndpoint = `${adjustedEndpoint}?${queryString}`;
  }

  try {
    const response = await fetch(`/api/${version}${adjustedEndpoint}`, {
      method,
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Unexpected status for ${method} ${adjustedEndpoint}: ${
          response.status
        }`,
      );
    }

    return await response.json();
  } catch (error) {
    log.debug('Error caught in callApi():', error);

    return {
      error,
    };
  }
};

type GetVersionFileParams = {
  addonId: number;
  apiState: ApiState;
  path?: string;
  versionId: number;
};

export const getVersionFile = async ({
  apiState,
  path,
  addonId,
  versionId,
}: GetVersionFileParams) => {
  return callApi<ExternalVersion>({
    apiState,
    endpoint: `reviewers/addon/${addonId}/versions/${versionId}`,
    query: path ? { file: path } : undefined,
  });
};

export const logOutFromServer = async (apiState: ApiState) => {
  return callApi<{}>({
    apiState,
    endpoint: 'accounts/session',
    method: HttpMethod.DELETE,
  });
};

export const getCurrentUserProfile = async (apiState: ApiState) => {
  return callApi<ExternalUser>({
    apiState,
    endpoint: '/accounts/profile/',
  });
};
