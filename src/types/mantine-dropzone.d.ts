declare module '@mantine/dropzone' {
  import type { MutableRefObject, ReactNode } from 'react';

  export const MIME_TYPES: Record<string, string>;

  export interface DropzoneProps {
    openRef?: MutableRefObject<(() => void) | null>;
    onDrop?: (files: File[]) => void;
    className?: string;
    radius?: number | string;
    accept?: string[];
    maxSize?: number;
    multiple?: boolean;
    loading?: boolean;
    children?: ReactNode;
  }

  export function Dropzone(props: DropzoneProps): JSX.Element;

  export namespace Dropzone {
    function Accept(props: { children?: ReactNode }): JSX.Element;
    function Reject(props: { children?: ReactNode }): JSX.Element;
    function Idle(props: { children?: ReactNode }): JSX.Element;
  }
}
