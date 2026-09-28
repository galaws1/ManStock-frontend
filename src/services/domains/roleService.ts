import { ApiService } from '../ApiService';
import type { Role, RoleRequest } from '../../types/role';

export const roleService = new ApiService<Role, RoleRequest>('roles');
