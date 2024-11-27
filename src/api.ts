import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import got, { HTTPError } from "got";

const API_URL = "https://api.cloudways.com/api/v1";
const EMAIL = getPreferenceValues().email;
const API_KEY = getPreferenceValues().apiKey;

export async function fetchAccessToken(): Promise<string> {
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

export async function triggerGitPull(serverId: string, appId: string) {
  try {
    const accessToken = await fetchAccessToken();

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

    const { branch_name, path } = historyResponse.logs[0];

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

export async function fetchServers(): Promise<Server[]> {
  try {
    const accessToken = await fetchAccessToken();
    const data: ServersResponse = await got
      .get(`${API_URL}/server`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .json();
    return data.servers;
  } catch (error) {
    if (error instanceof HTTPError && error.response.statusCode === 401) {
      console.error("Error fetching servers: 401 Unauthorized - Invalid or missing access token");
    } else {
      console.error("Error fetching servers:", error);
    }
    throw error;
  }
}
