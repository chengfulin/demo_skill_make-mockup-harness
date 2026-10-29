/**
 * App 狀態 Context（plan「狀態（React Context + useReducer）」「路由（hash）」）。
 * 狀態與 dispatch 分兩個 Context，只需 dispatch 的容器不會因狀態變化重渲染。
 * 視圖與網址 hash 同步（T046；FR-005、AC-P41、AC-S17）：初始視圖取 `readHashView()`（可由 `initialView` 覆寫），
 * `view` 變動以 `replaceState` 寫回 hash，`hashchange` 時 dispatch `setView`。篩選不寫入網址。
 */
import { createContext, useCallback, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { appReducer, createInitialState, type Action, type AppState, type View } from './appReducer';
import { readHashView, useHashSync } from './useHashView';

const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<Dispatch<Action> | null>(null);

export interface AppStateProviderProps {
  /** 初始視圖；未提供時由網址 hash 解析（`readHashView()`，無法辨識→timeline） */
  initialView?: View;
  /** 測試用：直接指定初始狀態（優先於 initialView） */
  initialState?: AppState;
  children: ReactNode;
}

export function AppStateProvider({ initialView, initialState, children }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(
    appReducer,
    initialState ?? initialView ?? null,
    (init: AppState | View | null) =>
      init === null ? createInitialState(readHashView()) : typeof init === 'string' ? createInitialState(init) : init,
  );
  const onHashChange = useCallback((view: View) => dispatch({ type: 'setView', view }), []);
  useHashSync(state.view, onHashChange);
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
