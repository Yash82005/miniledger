const API_URL = "http://192.168.31.80:5000/api";

export async function sendOtp(phone: string) {
  const response = await fetch(`${API_URL}/auth/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send OTP");
  }

  return data;
}

export async function verifyOtp(phone: string, otp: string) {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, otp }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "OTP verification failed");
  }

  return data;
}
export type Loan = {
  id: number;
  friend_name: string;
  amount: string;
  due_date: string;
  is_repaid: boolean;
  is_overdue: boolean;
};

export type Summary = {
  total_lent: string;
  total_repaid: string;
  overdue_amount: string;
};

const API_BASE = "http://192.168.31.80:5000/api";

async function authenticatedRequest(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function getLoans(token: string): Promise<Loan[]> {
  const data = await authenticatedRequest("/loans", token);
  return data.loans;
}

export async function getSummary(token: string): Promise<Summary> {
  const data = await authenticatedRequest("/summary", token);
  return data.summary;
}

export async function addLoan(
  token: string,
  friend_name: string,
  amount: number,
  due_date: string
) {
  return authenticatedRequest("/loans", token, {
    method: "POST",
    body: JSON.stringify({ friend_name, amount, due_date }),
  });
}

export async function repayLoan(token: string, loanId: number) {
  return authenticatedRequest(`/loans/${loanId}/repay`, token, {
    method: "PATCH",
  });
}