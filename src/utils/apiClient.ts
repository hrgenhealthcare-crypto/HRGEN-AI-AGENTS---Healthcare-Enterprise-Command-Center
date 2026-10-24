// Robust API Fetch & Error Classification Utility
// Differentiates between valid server agent responses, validation errors, and true service unavailability.

export type ApiResponseClassification =
  | 'valid_agent_response'
  | 'validation_error'
  | 'service_unavailable'
  | 'aborted';

export interface ClassifiedApiResult<T> {
  classification: ApiResponseClassification;
  ok: boolean;
  httpStatus: number;
  data: T | null;
  errorMessage: string | null;
  isLiveGemini: boolean;
  isServerAuthoritative: boolean;
  engineModel?: string;
  latencyMs: number;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function executeAgentApiRequest<T extends Record<string, any>>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ClassifiedApiResult<T>> {
  const { method = 'POST', body, signal: externalSignal, timeoutMs = 12000 } = options;
  const startTime = performance.now();

  const timeoutController = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    timeoutController.abort();
  }, timeoutMs);

  // Link external abort controller if provided
  const onExternalAbort = () => timeoutController.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      return {
        classification: 'aborted',
        ok: false,
        httpStatus: 0,
        data: null,
        errorMessage: 'Request cancelled by user.',
        isLiveGemini: false,
        isServerAuthoritative: false,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: timeoutController.signal,
    });

    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - startTime);

    // Check Content-Type before parsing JSON to avoid HTML error page parse crashes
    const contentType = response.headers.get('content-type') || '';
    let parsedJson: any = null;
    if (contentType.includes('application/json')) {
      try {
        parsedJson = await response.json();
      } catch {
        parsedJson = null;
      }
    } else {
      const rawText = await response.text().catch(() => '');
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        parsedJson = null;
      }
    }

    // 1. Client / Validation Error (HTTP 400, 404, 422)
    if (response.status >= 400 && response.status < 500) {
      return {
        classification: 'validation_error',
        ok: false,
        httpStatus: response.status,
        data: parsedJson,
        errorMessage:
          parsedJson?.error ||
          parsedJson?.message ||
          `Request validation error (HTTP ${response.status}).`,
        isLiveGemini: false,
        isServerAuthoritative: true,
        latencyMs,
      };
    }

    // 2. Server Error / Upstream Unavailability (HTTP 500, 502, 503, 504)
    if (!response.ok || response.status >= 500 || !parsedJson) {
      return {
        classification: 'service_unavailable',
        ok: false,
        httpStatus: response.status || 503,
        data: parsedJson,
        errorMessage:
          parsedJson?.error ||
          parsedJson?.message ||
          `Backend service unavailable (HTTP ${response.status || 503}).`,
        isLiveGemini: false,
        isServerAuthoritative: false,
        latencyMs,
      };
    }

    // 3. Valid Server Agent Response (HTTP 2xx with JSON body)
    if (parsedJson.success === false) {
      return {
        classification:
          parsedJson.errorCode === 'BAD_REQUEST' ? 'validation_error' : 'service_unavailable',
        ok: false,
        httpStatus: response.status,
        data: parsedJson,
        errorMessage: parsedJson.error || parsedJson.message || 'Agent request failed.',
        isLiveGemini: false,
        isServerAuthoritative: true,
        latencyMs,
      };
    }

    const mode = parsedJson.mode || parsedJson.responseOrigin || 'live_server_agent';
    const isLiveGemini = mode === 'live_gemini';

    return {
      classification: 'valid_agent_response',
      ok: true,
      httpStatus: response.status,
      data: parsedJson as T,
      errorMessage: null,
      isLiveGemini,
      isServerAuthoritative: true,
      engineModel: parsedJson.engineModel || parsedJson.selectedModel || 'gemini-3.1-flash-lite',
      latencyMs: parsedJson.latencyMs || parsedJson.durationMs || latencyMs,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - startTime);

    // Differentiate user-initiated cancellation vs timeout / network drop
    if (err?.name === 'AbortError' && !timedOut) {
      return {
        classification: 'aborted',
        ok: false,
        httpStatus: 0,
        data: null,
        errorMessage: 'Request cancelled.',
        isLiveGemini: false,
        isServerAuthoritative: false,
        latencyMs,
      };
    }

    const reason = timedOut
      ? `Backend request timed out after ${Math.round(timeoutMs / 1000)}s.`
      : 'Backend server unreachable. Check network or server connection.';

    return {
      classification: 'service_unavailable',
      ok: false,
      httpStatus: timedOut ? 408 : 503,
      data: null,
      errorMessage: reason,
      isLiveGemini: false,
      isServerAuthoritative: false,
      latencyMs,
    };
  } finally {
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}
