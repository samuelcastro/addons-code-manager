import { Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';

import { ErrorResponseType } from '../api';

export const actions = {
  error: createAction('NOTIFICATIONS_ERROR', (resolve) => {
    return (payload: { error: ErrorResponseType }) => resolve(payload);
  }),
  close: createAction('NOTIFICATIONS_CLOSE', (resolve) => {
    return (payload: { id: string }) => resolve(payload);
  }),
};

export type Notification = {
  id: string;
  message: string;
  variant: 'primary' | 'success' | 'danger' | 'warning';
};

export type NotificationsState = {
  notifications: Notification[];
};

export const initialState: NotificationsState = {
  notifications: [],
};

const reducer: Reducer<NotificationsState, ActionType<typeof actions>> = (
  state = initialState,
  action,
): NotificationsState => {
  switch (action.type) {
    case getType(actions.error): {
      return {
        ...state,
        notifications: state.notifications.concat({
          id: Math.random()
            .toString(36)
            .substr(2, 9),
          message: `${action.payload.error.error}`,
          variant: 'danger',
        }),
      };
    }
    case getType(actions.close): {
      const notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload.id,
      );

      return {
        ...state,
        notifications,
      };
    }
    default:
      return state;
  }
};

export default reducer;
