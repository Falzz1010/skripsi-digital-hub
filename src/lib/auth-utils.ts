export const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const getAuthErrorMessage = (error: any): string => {
  if (error.message.includes("Invalid login credentials")) {
    return "Email atau password salah";
  }
  if (error.message.includes("User already registered")) {
    return "Email sudah terdaftar";
  }
  if (error.message.includes("Email not confirmed")) {
    return "Silakan verifikasi email Anda terlebih dahulu";
  }
  if (error.message.includes("Password should be at least")) {
    return "Password minimal 6 karakter";
  }
  if (error.message.includes("Invalid email")) {
    return "Format email tidak valid";
  }
  
  return error.message || "Terjadi kesalahan tidak terduga";
};