type AccessTokenResponse = {
  access_token: string;
};

type Application = {
  id: string;
  label: string;
  application: string;
  app_version: string;
  app_fqdn: string;
  app_user: string;
  app_password: string;
  sys_user: string;
  sys_password: string;
  cname: string;
  mysql_db_name: string;
  mysql_user: string;
  mysql_password: string;
  aliases: string[];
  symlink: string | null;
  server_id: string;
  project_id: string;
  created_at: string;
  webroot: string | null;
  is_csr_available: boolean;
  lets_encrypt: string | null;
  app_version_id: string;
  cms_app_id: string;
};

type Server = {
  id: string;
  label: string;
  public_ip: string;
  status: string;
  apps: Application[];
};

type ServersResponse = {
  servers: Server[];
};
