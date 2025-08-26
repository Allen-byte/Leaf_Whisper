import { useState, useCallback } from 'react';
import { TOAST_TYPES } from '../components/ui/Toast';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const [dialogs, setDialogs] = useState([]);

  const showToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 3000) => {
    const id = Date.now().toString();
    const toast = {
      id,
      message,
      type,
      duration,
      visible: true,
    };

    setToasts(prev => [...prev, toast]);

    // 自动移除
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration + 500); // 额外500ms用于动画
  }, []);

  const showSuccess = useCallback((message, duration) => {
    showToast(message, TOAST_TYPES.SUCCESS, duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    showToast(message, TOAST_TYPES.ERROR, duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    showToast(message, TOAST_TYPES.WARNING, duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration) => {
    showToast(message, TOAST_TYPES.INFO, duration);
  }, [showToast]);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, visible: false } : toast
    ));
  }, []);

  const showConfirm = useCallback((options) => {
    const {
      title,
      message,
      confirmText = '确定',
      cancelText = '取消',
      onConfirm,
      onCancel,
      type = 'default'
    } = options;

    const id = Date.now().toString();
    const dialog = {
      id,
      title,
      message,
      confirmText,
      cancelText,
      type,
      visible: true,
      onConfirm: () => {
        setDialogs(prev => prev.filter(d => d.id !== id));
        onConfirm && onConfirm();
      },
      onCancel: () => {
        setDialogs(prev => prev.filter(d => d.id !== id));
        onCancel && onCancel();
      },
    };

    setDialogs(prev => [...prev, dialog]);
  }, []);

  // 简化的Alert替代方法
  const alert = useCallback((title, message, buttons) => {
    if (!buttons || buttons.length === 1) {
      // 简单提示
      showInfo(message || title);
    } else {
      // 确认对话框
      const confirmButton = buttons.find(b => b.style !== 'cancel');
      const cancelButton = buttons.find(b => b.style === 'cancel');
      
      showConfirm({
        title,
        message,
        confirmText: confirmButton?.text || '确定',
        cancelText: cancelButton?.text || '取消',
        onConfirm: confirmButton?.onPress,
        onCancel: cancelButton?.onPress,
        type: confirmButton?.style === 'destructive' ? 'danger' : 'default'
      });
    }
  }, [showInfo, showConfirm]);

  return {
    toasts,
    dialogs,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    showConfirm,
    alert, // Alert的替代方法
  };
};