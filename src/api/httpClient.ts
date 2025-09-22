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

export const apiFetch = async <TResponse = unknown>(path: string, options?: RequestOptions): Promise<TResponse> => {
  const response = await fetch(createApiUrl(path), buildRequestInit(options));

  if (!response.ok) {
    await handleError(response);
  }

  return (await parseResponse(response)) as TResponse;
};
