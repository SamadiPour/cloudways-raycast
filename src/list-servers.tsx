import { ActionPanel, Action, Icon, List, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import got from "got";

const API_URL = "https://api.cloudways.com/api/v1";
const EMAIL = getPreferenceValues().email;
const API_KEY = getPreferenceValues().apiKey;

async function fetchAccessToken() {
  try {
    const data = await got.post(`${API_URL}/oauth/access_token`, {
      form: {
        email: EMAIL,
        api_key: API_KEY,
      },
    }).json();
    return data.access_token;
  } catch (error) {
    console.error("Error fetching access token:", error);
    throw error;
  }
}

export default function Command() {
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchServers() {
      try {
        const accessToken = await fetchAccessToken();
        const data = await got.get(`${API_URL}/server`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }).json();
        setServers(data.servers);
      } catch (error) {
        if (error.response && error.response.statusCode === 401) {
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
              <Action.CopyToClipboard content={server.label} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
