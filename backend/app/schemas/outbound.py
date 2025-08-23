from __future__ import annotations
from typing import List, Literal, Optional
from pydantic import BaseModel

UUID = str

# Picking
PickStatus = Literal['pending', 'in_progress', 'completed', 'exception']

class PickTask(BaseModel):
    id: UUID
    tote_id: str
    order_id: UUID
    sku_count: int
    picker: Optional[str] = None
    status: PickStatus
    exceptions: Optional[List[str]] = None
    updated_at: Optional[str] = None

class ReassignPickPayload(BaseModel):
    picker: str

class SplitPickPayload(BaseModel):
    pickers: List[str]

# Tote location
class ToteLocation(BaseModel):
    tote_id: str
    location: Literal['storage', 'on_cart', 'staging']
    last_seen_at: str

# Packing
ValidationStatus = Literal['waiting', 'scanning', 'pass', 'mismatch']

class ScanLog(BaseModel):
    ts: str
    code: str
    ok: bool
    note: Optional[str] = None

class PackingTote(BaseModel):
    tote_id: str
    order_id: UUID
    arrived_at: str
    status: ValidationStatus
    scan_logs: List[ScanLog]

class ReassignTotePayload(BaseModel):
    order_id: str

class OverridePayload(BaseModel):
    note: str

# Route binning
class RouteBin(BaseModel):
    bin_id: str
    capacity: int
    totes: List[str]
    locked: Optional[bool] = None

class RouteSummary(BaseModel):
    route_id: str
    name: str
    bins: List[RouteBin]
    auto_slotting: bool

class ForceReassignPayload(BaseModel):
    tote_id: str
    to_bin: str

# Dispatch
RouteState = Literal['pending', 'waiting', 'ready', 'dispatched', 'hold']

class LoadingLog(BaseModel):
    ts: str
    tote_id: str
    ok: bool
    note: Optional[str] = None

class DispatchRoute(BaseModel):
    route_id: str
    name: str
    status: RouteState
    driver: Optional[str] = None
    vehicle: Optional[str] = None
    totes_loaded: int
    totes_expected: int
    loading_logs: List[LoadingLog]

class AssignDriverPayload(BaseModel):
    driver: str
    vehicle: Optional[str] = None
