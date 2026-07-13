import { TenantFeatures } from '@stores/domain';

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  features?: (keyof TenantFeatures)[];
}
