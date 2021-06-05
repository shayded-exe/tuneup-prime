export interface License {
  data: string;
  sig: string;
  isTrial: boolean;
}

export type LicenseData = PurchasedLicenseData | TrialLicenseData;

export interface PurchasedLicenseData {
  success: boolean;
  uses: number;
  purchase: {
    [name: string]: any;
    license_key: string;
  };
}

export interface TrialLicenseData {
  isTrial: true;
  expDate: string;
}

export enum LicenseType {
  Invalid = 'invalid',
  None = 'none',
  Purchased = 'purchased',
  Trial = 'trial',
}

export class LicenseState {
  get exists(): boolean {
    return this.type !== LicenseType.None;
  }

  get isInvalid(): boolean {
    return this.type === LicenseType.Invalid;
  }

  get isLicensed(): boolean {
    return (
      this.type === LicenseType.Purchased ||
      (this.type === LicenseType.Trial && !this.isExpired)
    );
  }

  get isPurchased(): boolean {
    return this.type === LicenseType.Purchased;
  }

  get isTrial(): boolean {
    return this.type === LicenseType.Trial;
  }

  get isExpired(): boolean {
    return !this.expDate || this.expDate > new Date();
  }

  private constructor(
    readonly type: LicenseType,
    readonly license?: License,
    readonly expDate?: Date,
  ) {}

  static invalid(): LicenseState {
    return new this(LicenseType.Invalid);
  }

  static none(): LicenseState {
    return new this(LicenseType.None);
  }

  static purchased(license: License): LicenseState {
    return new this(LicenseType.Purchased, license);
  }

  static trial(license: License, data?: TrialLicenseData): LicenseState {
    data ??= JSON.parse(license.data) as TrialLicenseData;
    const expDate = new Date(data.expDate);

    if (isNaN(expDate.getTime())) {
      return this.invalid();
    }

    return new this(LicenseType.Trial, license, expDate);
  }

  static clone(other: LicenseState): LicenseState {
    return new LicenseState(other.type, other.license, other.expDate);
  }
}

export type ActivateLicenseResult = LicenseState | false;

export const TRIAL_DAYS = 7;
