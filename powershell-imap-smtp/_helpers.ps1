[console]::TreatControlCAsInput = $false
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
function ErrorHandling
{
    Write-Host "ERROR occurred"
    exit 1
}
trap
{
    ErrorHandling
}
function Load-EnvironmentVariables
{
    param(
        [string]$filePath
    )

    if (-Not (Test-Path $filePath))
    {
        Write-Error "File not found: $filePath"
        return
    }

    Get-Content $filePath | ForEach-Object {
        $keyValue = $_.Split('=', 2)
        if ($keyValue.Count -eq 2)
        {
            $envName = $keyValue[0].Trim()
            $envValue = $keyValue[1].Trim()

            # Remove leading and trailing double quotes from the value
            if ($envValue.StartsWith('"') -and $envValue.EndsWith('"'))
            {
                $envValue = $envValue.Substring(1, $envValue.Length - 2)
            }

            [Environment]::SetEnvironmentVariable($envName, $envValue, [System.EnvironmentVariableTarget]::Process)
            Write-Host "Set $envName = ***"
        }
    }
}

function LoadMailKit($scriptPath)
{
    # Function to download and extract packages
    function DownloadAndExtractPackage($packageName, $packageVersion)
    {
        $packageUrl = "https://www.nuget.org/api/v2/package/$packageName/$packageVersion"
        $downloadPath = Join-Path -Path $scriptPath -ChildPath "$packageName.$packageVersion.nupkg"
        $zipPath = Join-Path -Path $scriptPath -ChildPath "$packageName.$packageVersion.zip"
        $extractPath = Join-Path -Path $scriptPath -ChildPath "$packageName.$packageVersion"
        $dllPath = Join-Path -Path $extractPath "lib\netstandard2.0\$packageName.dll"  # Adjust the path if necessary

        # Check if the extracted DLL already exists
        if (Test-Path $dllPath)
        {
            Write-Host "$packageName DLL already exists at $dllPath. Skipping download and extraction."
            return $extractPath
        }
        Write-Host "Downloading $packageName package..."
        Invoke-WebRequest -Uri $packageUrl -OutFile $downloadPath

        Rename-Item -Path $downloadPath -NewName $zipPath
        Write-Host "Extracting $packageName package..."
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

        Remove-Item -Path $zipPath
        return $extractPath
    }

    # Download and extract MimeKit and MailKit
    $mimeKitPath = DownloadAndExtractPackage "MimeKit" "4.5.0"  # Ensure you have the right version
    $mailKitPath = DownloadAndExtractPackage "MailKit" "4.5.0"  # Ensure you have the right version

    # Load MimeKit DLL
    $mimeKitDllPath = Join-Path -Path $mimeKitPath "lib\netstandard2.0\MimeKit.dll"
    if (Test-Path $mimeKitDllPath)
    {
        Add-Type -Path $mimeKitDllPath
        Write-Host "MimeKit has been loaded successfully."
    }
    else
    {
        Write-Error "MimeKit DLL not found in the expected location."
    }

    # Load MailKit DLL
    $mailKitDllPath = Join-Path -Path $mailKitPath "lib\netstandard2.0\MailKit.dll"
    if (Test-Path $mailKitDllPath)
    {
        Add-Type -Path $mailKitDllPath
        Write-Host "MailKit has been loaded successfully and is ready to use!"
    }
    else
    {
        Write-Error "MailKit DLL not found in the expected location."
    }
}
