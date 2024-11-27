import { Action, ActionPanel, List, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { fetchServers, triggerGitPull } from "./api";
import { launchITermAndSSH } from "./utils";

function ListApplications({ server }: { server: Server }) {
  return (
    <List>
      {server.apps.map((app) => (
        <List.Item
          key={app.id}
          title={app.label}
          subtitle={app.application}
          accessories={[{ text: app.app_version }]}
          actions={
            <ActionPanel>
              <Action title="Trigger Git Pull" onAction={() => triggerGitPull(server.id, app.id)} />
              <Action
                title="Launch in iTerm"
                onAction={() =>
                  launchITermAndSSH(server.public_ip, server.master_user, server.master_password, app.sys_user)
                }
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

export default function ListServers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadServers() {
      try {
        const servers = await fetchServers();
        setServers(servers);
      } catch (error) {
        await showToast(Toast.Style.Failure, "Error Fetching Servers", error?.toString());
      } finally {
        setIsLoading(false);
      }
    }

    loadServers();
  }, []);

  return (
    <List isLoading={isLoading}>
      {servers.map((server) => (
        <List.Item
          key={server.id}
          title={server.label}
          subtitle={server.public_ip}
          accessories={[{ text: server.status }]}
          actions={
            <ActionPanel>
              <Action.Push title="View Applications" target={<ListApplications server={server} />} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
