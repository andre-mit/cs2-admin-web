export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let cachedToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    // In Server Components, we'd need a different way to get the token if we wanted to call the external API directly.
    return null;
  }

  if (cachedToken) return cachedToken;
  if (tokenPromise) return tokenPromise;

  tokenPromise = fetch("/api/auth/token")
    .then(async res => {
      if (!res.ok) {
        const errText = await res.text();
        console.error("[getAuthToken] Fail to get token:", res.status, errText);
        throw new Error("Unauthorized");
      }
      return res.json();
    })
    .then(data => {
      console.log("[getAuthToken] Token obtained successfully.");
      cachedToken = data.token;
      return cachedToken;
    })
    .catch((err) => {
      console.error("[getAuthToken] Error on request:", err);
      return null;
    })
    .finally(() => {
      tokenPromise = null;
    });

  return tokenPromise;
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = await getAuthToken();

  const isFormData = options?.body instanceof FormData;

  const headers: HeadersInit = {
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  if (!isFormData) {
    (headers as Record<string, string>)["Content-Type"] = (options?.headers as Record<string, string>)?.[
      "Content-Type"
    ] || "application/json";
  }

  const defaultOptions: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      try {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      } catch { }
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const swrFetcher = async (url: string) => {
  const token = await getAuthToken();
  const fetchUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const res = await fetch(fetchUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    }
  });

  if (!res.ok) throw new Error('Falha ao buscar dados');
  return res.json();
};
