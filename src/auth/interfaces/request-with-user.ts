export interface RequestWithUser extends Request {
  user: {
    userId: string; // 👈 coincide con lo que devuelve JwtStrategy
    email: string;
    role: string;
  };
}
