import { ensureValidAccessToken, getStoredAccessToken } from '../auth/tokenStorage';
import { createApiUrl } from './config';

export type JsonBody = Record<string, unknown> | Array<unknown>;

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /**
   * Automatically stringifies objects passed to the request body and attaches the JSON header.
   */
  json?: JsonBody;
  /**
   * Use this when you need to supply a pre-built body instead of the helper `json` option.
   */
  body?: BodyInit | null;
}

export interface ApiErrorMetadata {
  status: number;
  statusText: string;
  body: unknown;
}

export class ApiError extends Error {
  readonly metadata: ApiErrorMetadata;

  constructor(message: string, metadata: ApiErrorMetadata) {
    super(message);
    this.metadata = metadata;
  }
}

const buildRequestInit = ({ json, headers, body, ...rest }: RequestOptions = {}): RequestInit => {
  const requestHeaders = new Headers(headers);
  const accessToken = getStoredAccessToken();

  if (accessToken && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  if (json !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  return {
    ...rest,
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : body,
  } satisfies RequestInit;
};

const parseResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return response.json();
  }

  if (contentType?.includes('text/')) {
    return response.text();
  }

  return response.arrayBuffer();
};

const handleError = async (response: Response): Promise<never> => {
  const body = await parseResponse(response).catch(() => undefined);

  throw new ApiError('Request failed', {
    status: response.status,
    statusText: response.statusText,
    body,
  });
};

const fetchWithAuthRetry = async (
  path: string,
  options: RequestOptions | undefined,
  attempt: number,
): Promise<Response> => {
  const response = await fetch(createApiUrl(path), buildRequestInit(options));

  if (response.status === 401 && attempt === 0) {
    const refreshedToken = await ensureValidAccessToken({ forceRefresh: true });

    if (refreshedToken) {
      return fetchWithAuthRetry(path, options, attempt + 1);
    }
  }

  return response;
};

export const apiFetchResponse = async (path: string, options?: RequestOptions) => {
  await ensureValidAccessToken();

  const response = await fetchWithAuthRetry(path, options, 0);

  if (!response.ok) {
    await handleError(response);
  }

  return response;
};

export const apiFetch = async <TResponse = unknown>(path: string, options?: RequestOptions): Promise<TResponse> => {
  const response = await apiFetchResponse(path, options);

  return (await parseResponse(response)) as TResponse;
};
