import { ActionPanel, Action, Icon, List, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";

const API_URL = "https://api.cloudways.com/api/v1";
const API_KEY = getPreferenceValues().apiKey;

export default function Command() {
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchServers() {
      try {
        const response = await fetch(`${API_URL}/server`, {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
        });
        const data = await response.json();
        setServers(data.servers);
      } catch (error) {
        console.error("Error fetching servers:", error);
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
          icon={Icon.Server}
          title={server.label}
          subtitle={server.public_ip}
          accessories={[{ icon: Icon.Text, text: server.status }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={server.label} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
