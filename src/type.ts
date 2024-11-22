type AccessTokenResponse = {
  access_token: string;
};

type Server = {
  id: string;
  label: string;
  public_ip: string;
  status: string;
};

type ServersResponse = {
  servers: Server[];
};
