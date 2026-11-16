export type TUser = {
  id: number;
  name: string;
  email: string;
};

export type TSession =
  | {
      user: null;
      status: 'guest';
    }
  | {
      user: TUser;
      status: 'authenticated';
    };

export type TGetSession = () => Promise<TSession>;
