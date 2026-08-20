"use client";

import * as React from "react";

export interface ToastProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

type ActionType =
  | { type: "ADD_TOAST"; toast: ToastProps }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToastProps[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string, duration = 4000) => {
  if (toastTimeouts.has(toastId)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, duration);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: ActionType): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, 5),
      };

    case "DISMISS_TOAST":
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: ActionType) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

function sanitizeToastMessage(msg: React.ReactNode): React.ReactNode {
  if (typeof msg !== "string") return msg;
  const lower = msg.toLowerCase();
  if (
    lower.includes("status code") ||
    lower.includes("request failed") ||
    lower.includes("network error") ||
    lower.includes("axioserror") ||
    lower.includes("internal server error") ||
    msg.trim().startsWith("{") ||
    msg.trim().startsWith("[")
  ) {
    return "Failed to process request. Please check your inputs and try again.";
  }
  return msg;
}

export function toast(options: ToastOptions | string) {
  const id = Math.random().toString(36).substring(2, 9);
  let toastObj: ToastProps = typeof options === "string" ? { id, title: options } : { id, ...options };

  if (toastObj.variant === "destructive") {
    toastObj = {
      ...toastObj,
      title: sanitizeToastMessage(toastObj.title),
      description: toastObj.description ? sanitizeToastMessage(toastObj.description) : undefined,
    };
  }

  dispatch({ type: "ADD_TOAST", toast: toastObj });
  addToRemoveQueue(id, toastObj.duration || 4000);

  return id;
}

toast.success = (title: string, description?: string) => {
  return toast({ title, description, variant: "success" });
};

toast.error = (title: string, description?: string) => {
  return toast({ title: sanitizeToastMessage(title), description: description ? sanitizeToastMessage(description) : undefined, variant: "destructive" });
};

toast.dismiss = (toastId?: string) => {
  dispatch({ type: "DISMISS_TOAST", toastId });
};

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}
