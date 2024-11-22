import { Action, ActionPanel, getPreferenceValues, List, Detail, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import got, { HTTPError } from "got";
import { exec } from "child_process";

const API_URL = "https://api.cloudways.com/api/v1";
const EMAIL = getPreferenceValues().email;
const API_KEY = getPreferenceValues().apiKey;

async function fetchAccessToken(): Promise<string> {
  try {
    const data: AccessTokenResponse = await got
      .post(`${API_URL}/oauth/access_token`, {
        form: {
          email: EMAIL,
          api_key: API_KEY,
        },
      })
      .json();
    return data.access_token;
  } catch (error) {
    console.error("Error fetching access token:", error);
    throw error;
  }
}

async function triggerGitPull(serverId: string, appId: string) {
  try {
    const accessToken = await fetchAccessToken();

    // Fetch the Git deployment history
    const historyResponse: GitDeploymentHistoryResponse = await got
      .get(`${API_URL}/git/history`, {
        searchParams: {
          server_id: serverId,
          app_id: appId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .json();

    if (historyResponse.logs.length === 0) {
      throw new Error("No deployment history found");
    }

    // Get the most recent deployment details
    const { branch_name, path } = historyResponse.logs[0];

    // Trigger the Git pull using the retrieved branch and path
    const pullResponse: GitPullResponse = await got
      .post(`${API_URL}/git/pull`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        form: {
          server_id: serverId,
          app_id: appId,
          branch_name,
          deploy_path: path,
        },
      })
      .json();

    await showToast(Toast.Style.Success, "Git Pull Triggered", `Operation ID: ${pullResponse.operation_id}`);
  } catch (error) {
    console.error("Error triggering git pull:", error);
    await showToast(Toast.Style.Failure, "Error Triggering Git Pull", error?.toString());
  }
}

async function launchITermAndSSH(serverIP: string, serverUser: string, serverPassword: string, appDir: string) {
  const appleScript = `
    set sshUser to "${serverUser}@${serverIP}"
    set sshPassword to "${serverPassword}"
    set initialCommand to "cd applications/${appDir}/public_html"

    tell application "iTerm"
      activate
      set newWindow to (create window with default profile)
      tell current session of newWindow
        write text "ssh -tt " & sshUser
        delay 0.2 -- Give it a moment to start the SSH command
        repeat
          delay 0.2 -- Polling interval
          set sessionOutput to get contents
          if sessionOutput contains "password:" then
            write text sshPassword
            exit repeat
          end if
        end repeat
        delay 0.2 -- Wait for the SSH session to establish
        repeat
          delay 0.2 -- Polling interval
          set sessionOutput to get contents
          if sessionOutput contains "~" then
            write text initialCommand
            exit repeat
          end if
        end repeat
      end tell
    end tell
  `;

  exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing AppleScript: ${error}`);
      return;
    }
    console.log(`AppleScript output: ${stdout}`);
  });
}

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
                onAction={() => launchITermAndSSH(server.public_ip, server.master_user, server.master_password, app.sys_user)}
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
    async function fetchServers() {
      try {
        const accessToken = await fetchAccessToken();
        const data: ServersResponse = await got
          .get(`${API_URL}/server`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
          .json();
        setServers(data.servers);
      } catch (error) {
        if (error instanceof HTTPError && error.response.statusCode === 401) {
          console.error("Error fetching servers: 401 Unauthorized - Invalid or missing access token");
        } else {
          console.error("Error fetching servers:", error);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchServers();
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
