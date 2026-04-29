import { UserRole } from '../../modules/user/user.entity';

export interface RequestUser {
  userId: number;
  studentNo: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
