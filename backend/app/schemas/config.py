from pydantic import BaseModel
from typing import Optional

class SystemConfigSchema(BaseModel):
    appName: str
    logoUrl: Optional[str] = None
    defaultTimeZone: str
    dateFormat: str
    defaultLanguage: str
    defaultCrateSize: Optional[str] = None
    defaultCrateStatus: Optional[str] = None
    defaultRackStatus: Optional[str] = None
    maxStackHeight: Optional[int] = None
    maxBinsPerRack: Optional[int] = None
    sessionTimeoutMins: Optional[int] = None
    passwordPolicy: Optional[str] = None
    roleAccessToggle: Optional[bool] = None
    defaultPrinter: Optional[str] = None
    defaultScanner: Optional[str] = None
    apiBaseUrl: Optional[str] = None
    apiToken: Optional[str] = None
    autoGenerateMissingIds: Optional[bool] = None
    dataSyncIntervalMins: Optional[int] = None

    class Config:
        from_attributes = True

class WarehouseConfigSchema(BaseModel):
    warehouseName: str
    shortCode: str
    nextCrateSeq: int
    cratePrefix: Optional[str] = None
    crateSuffix: Optional[str] = None
    nextRackSeq: int
    rackPrefix: Optional[str] = None
    nextBinSeq: int
    serviceAreaRangeKm: Optional[int] = 0
    dockBayCount: Optional[int] = 0
    maxCratesCapacity: Optional[int] = 0
    maxPalletsCapacity: Optional[int] = 0
    printer: Optional[str] = None
    scanner: Optional[str] = None
    defaultCrateExpiryDays: Optional[int] = 0
    autoCloseEmptyBins: Optional[bool] = False
    utilizationAlertThreshold: Optional[int] = 80
    rackLabelTemplate: Optional[str] = None
    crateLabelTemplate: Optional[str] = None

    class Config:
        from_attributes = True
