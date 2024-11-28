import { exec } from "child_process";

export async function launchITermAndSSH(serverIP: string, serverUser: string, serverPassword: string, appDir: string) {
  const appleScript = `
    set sshUser to "${serverUser}@${serverIP}"
    set sshPassword to "${serverPassword}"
    set initialCommand to "cd applications/${appDir}/public_html"

    tell application "System Events"
      set processList to name of every process
      set isRunning to "iTerm2" is in processList
    end tell

    tell application "iTerm"
      activate
      delay (0.25)
      set newWindow to current window
      if isRunning is true or newWindow is missing value then
        if newWindow is missing value then
          set newWindow to (create window with default profile)
        else
          tell newWindow
            create tab with default profile
          end tell
        end if
      end if
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
