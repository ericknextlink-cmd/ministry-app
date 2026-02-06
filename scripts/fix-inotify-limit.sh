#!/usr/bin/env bash
# Fix "OS file watch limit reached" on Linux when running Next.js (Turbopack) dev.
# Run once with: sudo ./scripts/fix-inotify-limit.sh
# Or run the commands below manually.

set -e
echo "Current inotify limits:"
echo "  max_user_watches=$(cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null || echo 'N/A')"
echo "  max_user_instances=$(cat /proc/sys/fs/inotify/max_user_instances 2>/dev/null || echo 'N/A')"

# Apply until reboot
sysctl -w fs.inotify.max_user_watches=524288 2>/dev/null || true
sysctl -w fs.inotify.max_user_instances=512  2>/dev/null || true

# Make permanent (create drop-in file)
CONF="/etc/sysctl.d/99-inotify-nextjs.conf"
if [ -w /etc/sysctl.d ] 2>/dev/null; then
  echo "Writing $CONF for persistence across reboots..."
  printf '%s\n' 'fs.inotify.max_user_watches=524288' 'fs.inotify.max_user_instances=512' > "$CONF"
  sysctl -p "$CONF" 2>/dev/null || true
else
  echo "To make permanent, run as root:"
  echo "  echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.d/99-inotify-nextjs.conf"
  echo "  echo 'fs.inotify.max_user_instances=512'   | sudo tee -a /etc/sysctl.d/99-inotify-nextjs.conf"
  echo "  sudo sysctl -p /etc/sysctl.d/99-inotify-nextjs.conf"
fi

echo "Done. Restart 'pnpm dev' and the watch errors should be gone."
