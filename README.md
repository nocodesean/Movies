<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy StreamLAN

LAN-friendly video library: uploads are stored on disk (host machine) and stream to any device on your network.

## Quick start (Windows PowerShell)
1) Install Node.js 18+  
2) From the project folder run: `.\run.ps1`  
   - Installs deps (first run)  
   - Creates/uses `.\media`, starts media server on 3001 and UI on 3000  
   - Shows the detected host IP; open `http://<shown-host>:3000` from any device on your LAN

## Quick start (Raspberry Pi/Linux)
1) Install Node.js 18+ and npm  
2) Make script executable: `chmod +x run.sh`  
3) Run: `HOST_IP=media.local MEDIA_DIR=/mnt/media/movies ./run.sh` (or replace `media.local` with your Pi IP)  
   - Defaults: media at `./media`, API port 3001, UI port 3000, host IP auto-detected  
   - View logs: `/tmp/streamlan-server.log`, `/tmp/streamlan-ui.log`
4) Open on any LAN device: `http://media.local:3000` (or your IP)

### Optional: make the hostname “media”
- **Raspberry Pi:** `sudo hostnamectl set-hostname media` and ensure `avahi-daemon` is installed/running (mDNS). Then use `media.local`.
- **Windows host:** install Bonjour/mDNS (e.g., Bonjour Print Services) or add a static entry to `C:\Windows\System32\drivers\etc\hosts`: `192.168.x.x media`.
- Any client can also use hosts file (`/etc/hosts` on macOS/Linux) to pin `media` or `media.local` to the host IP.

## Manual start (Windows, Pi, or any Node box)
1) Install deps: `npm install`  
2) Set the API base in [.env.local](.env.local): `VITE_API_URL=http://<host-ip>:3001`  
3) Start media server (stores files):  
   - Windows PowerShell: `$env:MEDIA_DIR='D:\Media\Movies'; npm run server`  
   - Raspberry Pi/Linux: `MEDIA_DIR=/mnt/media/movies npm run server`  
4) Start web app: `npm run dev -- --host 0.0.0.0 --port 3000`  
5) Open from any LAN device: `http://<host-ip>:3000`

## Notes
- No Gemini/AI dependency; metadata is manual (title/description/genres input when uploading).  
- Build for production: `npm run build` then `npm run preview` (keep `npm run server` running for media files).
