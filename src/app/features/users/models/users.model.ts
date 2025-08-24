export interface UserAttributes {
  id: number;
  name: string;
  username: string;
  password: string;
  role: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  username: string;
  password: string;
  role_id: number;
}