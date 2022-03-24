export enum SupportedOS {
  Windows = 'win32',
  MacOS = 'darwin',
  Linux = 'linux',
}

export function getOS(): SupportedOS {
  const os = process.platform;

  if (!Object.values(SupportedOS).includes(os as any)) {
    throw new Error(`Unsupported OS ${os}`);
  }

  return os as SupportedOS;
}

export function getOSName(): string {
  const os = getOS();

  switch (os) {
    case SupportedOS.Windows:
      return 'Windows';
    case SupportedOS.MacOS:
      return 'macOS';
    case SupportedOS.Linux:
      return 'Linux';
  }
}
