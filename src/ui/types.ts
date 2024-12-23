export interface SelectItem<T> {
  label: string;
  value: T;
}

export interface KeyboardInput {
  input: string;
  key: {
    return: boolean;
    escape: boolean;
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
    upArrow: boolean;
    downArrow: boolean;
    leftArrow: boolean;
    rightArrow: boolean;
    pageDown: boolean;
    pageUp: boolean;
    tab: boolean;
    backspace: boolean;
    delete: boolean;
  };
} 