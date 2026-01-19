# Port 5000 Fix - Windows

## Problem
Port 5000 Windows System process (PID 4) use kar raha hai, isliye backend start nahi ho raha.

## Solution: Port Exclusion Add Karein

### Method 1: PowerShell (Admin) - Recommended

1. **PowerShell as Administrator open karein:**
   - Start menu me "PowerShell" search karein
   - Right-click → "Run as Administrator"

2. **Port exclusion add karein:**
   ```powershell
   netsh int ipv4 add excludedportrange protocol=tcp startport=5000 numberofports=1 store=persistent
   ```

3. **Computer restart karein** (important!)

4. **Backend start karein:**
   ```powershell
   cd "C:\Users\FBC\Desktop\optic goal\backend"
   node server.js
   ```

### Method 2: Manual Registry Edit (Advanced)

⚠️ **Warning:** Registry edit risky hai. Backup lein pehle.

1. `Win + R` press karein
2. `regedit` type karein aur Enter
3. Navigate to: `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters`
4. Right-click → New → Multi-String Value
5. Name: `ReservedPorts`
6. Value: `5000-5000`
7. Computer restart karein

### Method 3: Alternative - Different Port Use Karein

Agar port 5000 free nahi kar sakte, to backend ko 5001 pe chala sakte hain:

```bash
# .env file me:
PORT=5001

# Ya environment variable:
$env:PORT="5001"
node server.js
```

## Verification

Port exclusion add karne ke baad verify karein:

```powershell
netsh int ipv4 show excludedportrange protocol=tcp
```

Agar port 5000 excluded list me dikhe, to success hai!

## Current Status

- ✅ Frontend: Port 3000 (Working)
- ❌ Backend: Port 5000 (Blocked by system process)
- ✅ Alternative: Port 5001 (Working)

## Quick Fix (Temporary)

Agar port 5000 free nahi kar sakte, to:

1. Backend port 5001 pe chalaayein
2. Frontend me API URL update karein:
   - `VITE_API_URL=http://localhost:5001`

---

**Note:** Port 5000 ko free karne ke liye admin rights required hain aur computer restart zaroori hai.
