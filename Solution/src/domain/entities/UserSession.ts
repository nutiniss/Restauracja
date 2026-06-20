export type UserRole = 'waiter' | 'admin';

export type UserSession = {
  username: string;
  displayName: string;
  role: UserRole;
};

export const users: Array<UserSession & { password: string }> = [
  {
    username: 'kelner',
    password: 'kelner123',
    displayName: 'Konto kelnera',
    role: 'waiter',
  },
  {
    username: 'admin',
    password: 'admin123',
    displayName: 'Konto administratora',
    role: 'admin',
  },
];

export const authenticateUser = (
  username: string,
  password: string,
): UserSession | undefined => {
  const user = users.find(
    account =>
      account.username === username.trim().toLowerCase() &&
      account.password === password,
  );

  if (!user) {
    return undefined;
  }

  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
};
