@echo off
echo ============================================
echo  EHSP - Building All Simulation Docker Images
echo ============================================
echo.

cd /d "%~dp0"

set SIMS=sqli-login xss-reflected blind-sqli cmd-injection rce-eval stored-xss ssrf jwt-manipulation idor-profile broken-access-control hardcoded-creds linux-flag-hunt priv-esc

for %%S in (%SIMS%) do (
    echo [*] Building ehsp-%%S ...
    docker build -t ehsp-%%S simulations/%%S
    if errorlevel 1 (
        echo [!] FAILED: ehsp-%%S
    ) else (
        echo [+] SUCCESS: ehsp-%%S
    )
    echo.
)

echo ============================================
echo  All builds complete!
echo ============================================
echo.
echo Run "docker images | findstr ehsp" to verify.
pause
