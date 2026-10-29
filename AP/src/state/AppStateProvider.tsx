/**
 * App 狀態 Context（plan「狀態（React Context + useReducer）」）。
 * 狀態與 dispatch 分兩個 Context，只需 dispatch 的容器不會因狀態變化重渲染。
 */
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { appReducer, createInitialState, type Action, type AppState, type View } from './appReducer';

const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<Dispatch<Action> | null>(null);

export interface AppStateProviderProps {
  /** 初始視圖（由 hash 解析；預設 timeline） */
  initialView?: View;
  /** 測試用：直接指定初始狀態（優先於 initialView） */
  initialState?: AppState;
  children: ReactNode;
}

export function AppStateProvider({ initialView = 'timeline', initialState, children }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(
    appReducer,
    initialState ?? initialView,
    (init: AppState | View) => (typeof init === 'string' ? createInitialState(init) : init),
  );
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (state === null) throw new Error('useAppState 必須在 AppStateProvider 內使用');
  return state;
}

export function useAppDispatch(): Dispatch<Action> {
  const dispatch = useContext(AppDispatchContext);
  if (dispatch === null) throw new Error('useAppDispatch 必須在 AppStateProvider 內使用');
  return dispatch;
}
