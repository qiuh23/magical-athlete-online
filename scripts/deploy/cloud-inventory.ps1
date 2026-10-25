[CmdletBinding()]
param(
  [string]$AliyunCli = (Join-Path $PSScriptRoot '..\..\.local\aliyun-cli\aliyun.exe'),
  [string]$Profile = 'magical-athlete',
  [string[]]$Regions = @('cn-hangzhou', 'cn-shanghai')
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $AliyunCli -PathType Leaf)) {
  throw 'Pass -AliyunCli with the path to an already installed Alibaba Cloud CLI.'
}

# This script only calls these read APIs. It does not read credential files,
# create resources, submit orders, renew resources or change auto-renewal.
function Invoke-CloudRead {
  param([string]$Product, [string]$Action, [hashtable]$Parameters)
  $allowed = @(
    'ecs/DescribeInstances', 'ecs/DescribeSecurityGroups', 'ecs/DescribeImages',
    'ecs/DescribePrice', 'ecs/DescribeAvailableResource',
    'vpc/DescribeVpcs', 'swas-open/ListInstances', 'swas-open/ListPlans',
    'swas-open/DescribePrice'
  )
  if ("$Product/$Action" -notin $allowed) { throw 'Only the documented read API allowlist is supported.' }
  $cliArguments = @($Product, $Action, '--profile', $Profile)
  foreach ($item in $Parameters.GetEnumerator()) {
    $cliArguments += @("--$($item.Key)", [string]$item.Value)
  }
  $raw = & $AliyunCli @cliArguments 2>$null
  if ($LASTEXITCODE -ne 0) { throw "Read API $Product/$Action failed; check local CLI authorization." }
  try { $result = $raw -join "`n" | ConvertFrom-Json }
  catch { throw "Read API $Product/$Action returned an invalid response." }
  if (-not $result -or $result.error_code -or $result.Code -or ($result.status_code -and [int]$result.status_code -ge 400)) {
    throw "Read API $Product/$Action reported an error."
  }
  return $result
}

$observations = foreach ($region in $Regions) {
  try {
    $ecs = Invoke-CloudRead ecs DescribeInstances @{ RegionId = $region; PageSize = 1 }
    $light = Invoke-CloudRead swas-open ListInstances @{ RegionId = $region; PageSize = 1 }
    $vpcs = Invoke-CloudRead vpc DescribeVpcs @{ RegionId = $region; PageSize = 1 }
    $groups = Invoke-CloudRead ecs DescribeSecurityGroups @{ RegionId = $region; PageSize = 1 }
    $images = Invoke-CloudRead ecs DescribeImages @{
      RegionId = $region; ImageOwnerAlias = 'system'; OSType = 'linux';
      Architecture = 'x86_64'; ImageName = 'ubuntu_24*'; Status = 'Available'; PageSize = 100
    }
    $image = $images.Images.Image | Where-Object ImageName -Match '^ubuntu_24_04_x64_20G_alibase_' |
      Sort-Object CreationTime -Descending | Select-Object -First 1
    if (-not $image) { throw 'No available plain Ubuntu 24.04 x86_64 public image was returned.' }
    $ecsPrice = Invoke-CloudRead ecs DescribePrice @{
      RegionId = $region; InstanceType = 'ecs.e-c1m1.large'; ImageId = $image.ImageId;
      ResourceType = 'instance'; InstanceNetworkType = 'vpc'; InternetChargeType = 'PayByBandwidth';
      InternetMaxBandwidthOut = 3; 'SystemDisk.Category' = 'cloud_essd_entry';
      'SystemDisk.Size' = 40; PriceUnit = 'Year'; Period = 1; Amount = 1
    }
    $stock = Invoke-CloudRead ecs DescribeAvailableResource @{
      RegionId = $region; DestinationResource = 'InstanceType'; InstanceType = 'ecs.e-c1m1.large';
      InstanceChargeType = 'PrePaid'; SystemDiskCategory = 'cloud_essd_entry'
    }
    $plans = Invoke-CloudRead swas-open ListPlans @{ RegionId = $region }
    $plan = $plans.Plans | Where-Object PlanId -EQ 'swas.s.c2m2s40b1.linux' | Select-Object -First 1
    $lightPrice = if ($plan) {
      Invoke-CloudRead swas-open DescribePrice @{
        RegionId = $region; CommodityType = 'Server'; PlanId = $plan.PlanId;
        Period = 1; PriceUnit = 'Year'; Amount = 1
      }
    } else { $null }
    [pscustomobject]@{
      Region = $region
      Counts = @{ Ecs = $ecs.TotalCount; SimpleApplicationServer = $light.TotalCount; Vpc = $vpcs.TotalCount; SecurityGroup = $groups.TotalCount }
      EcsQuote = @{
        Type = 'ecs.e-c1m1.large'; Cpu = 2; MemoryGiB = 2; FixedBandwidthMbps = 3;
        DiskCategory = 'cloud_essd_entry'; DiskGiB = 40; TermMonths = 12; ImageId = $image.ImageId;
        Currency = $ecsPrice.PriceInfo.Price.Currency; FirstYear = $ecsPrice.PriceInfo.Price.TradePrice;
        OriginalYear = $ecsPrice.PriceInfo.Price.OriginalPrice;
        PromotionDescriptions = @($ecsPrice.PriceInfo.Rules.Rule | ForEach-Object Description);
        InStockZones = @($stock.AvailableZones.AvailableZone | Where-Object StatusCategory -EQ 'WithStock' | ForEach-Object ZoneId)
      }
      SimpleApplicationServerQuote = if ($plan) { @{
        PlanId = $plan.PlanId; Cpu = $plan.Core; MemoryGiB = $plan.Memory; DiskGiB = $plan.DiskSize;
        PeakBandwidthMbps = $plan.Bandwidth; Currency = $lightPrice.PriceInfo.Price.Currency;
        FirstYear = $lightPrice.PriceInfo.Price.TradePrice; OriginalYear = $lightPrice.PriceInfo.Price.OriginalPrice;
        PromotionDescriptions = @($lightPrice.PriceInfo.Rules | ForEach-Object Description)
      } } else { $null }
      RenewalQuote = 'Not queried: the renewal price API requires an existing instance ID; first-year prices are not renewal guarantees.'
    }
  } catch {
    # Do not echo raw API output, account identifiers, resource IDs or credentials.
    [pscustomobject]@{ Region = $region; Available = $false; Error = 'One or more read queries failed. Check CLI authorization and region support locally.' }
  }
}

[pscustomobject]@{
  CheckedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
  ReadOnly = $true
  Observations = @($observations)
  Note = 'Quotes are time-sensitive. Recheck the final order and obtain approval before any purchase; keep automatic renewal disabled unless explicitly approved.'
} | ConvertTo-Json -Depth 12
