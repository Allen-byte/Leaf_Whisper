import React from 'react';
import { View } from 'react-native';
import { Toast, ConfirmDialog } from './ui/Toast';

export const ToastContainer = ({ toasts, dialogs, onHideToast }) => {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' }}>
      {/* Toast消息 */}
      {toasts.map((toast, index) => (
        <View key={toast.id} style={{ position: 'absolute', top: 60 + index * 60, left: 0, right: 0, pointerEvents: 'box-none' }}>
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onHide={() => onHideToast(toast.id)}
          />
        </View>
      ))}

      {/* 确认对话框 */}
      {dialogs.map(dialog => (
        <ConfirmDialog
          key={dialog.id}
          visible={dialog.visible}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          type={dialog.type}
          onConfirm={dialog.onConfirm}
          onCancel={dialog.onCancel}
        />
      ))}
    </View>
  );
};