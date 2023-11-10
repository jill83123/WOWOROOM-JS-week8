const Toast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  width: 'auto',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export function showToast(status, msg) {
  Toast.fire({
    icon: status,
    title: msg,
  });
}

export function showCheck(icon, title, onConfirm) {
  Swal.fire({
    icon,
    title,
    showCancelButton: true,
    confirmButtonText: '確認',
    cancelButtonText: '取消',
    customClass: {
      confirmButton: 'swal-btn-check',
      cancelButton: 'swal-btn-cancel',
    },
  }).then((result) => {
    if (result.isConfirmed && typeof onConfirm === 'function') {
      onConfirm();
    }
  });
}
