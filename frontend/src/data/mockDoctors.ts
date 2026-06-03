// ============================================================
// CLEAN DATA CONFIGURATION - HealthChain AI (Doctor Side)
// ============================================================

export const currentDoctor = {
  id: '',
  name: '',
  email: '',
  phone: '',
  avatar: null,
  licenseNumber: '',
  hospital: '',
  department: '',
  specialty: '',
  walletAddress: '',
  verified: false,
  totalPatients: 0,
  totalAccessGranted: 0,
  pendingRequests: 0,
  joinedAt: '',
};

export const doctorPatients: any[] = [];

export const doctorAccessLogs: any[] = [];

export const doctorNotifications: any[] = [];