from __future__ import annotations
from typing import Literal, Optional, List
from pydantic import BaseModel


VehicleSize = Literal['SMALL', 'MEDIUM', 'LARGE']
VehicleType = Literal['VAN_S', 'TRUCK_M', 'TRUCK_L']
BayType = Literal['GOODS_IN', 'GOODS_OUT', 'DYNAMIC', 'PARKING']
BayStatus = Literal['EMPTY', 'RESERVED', 'VEHICLE_PRESENT', 'MAINTENANCE']


class BayReservedFor(BaseModel):
    ref: str
    direction: Literal['IN', 'OUT']
    eta: Optional[str] = None


class BayVehicle(BaseModel):
    reg: str
    type: VehicleType
    carrier: Optional[str] = None
    vendor: Optional[str] = None


class Bay(BaseModel):
    id: str
    name: str
    warehouse_id: str
    type: BayType
    dynamicMode: Optional[Literal['GOODS_IN', 'GOODS_OUT']] = None
    capacity: int
    vehicleCompat: List[VehicleSize]
    status: BayStatus
    reserved_for: Optional[BayReservedFor] = None
    vehicle: Optional[BayVehicle] = None
    operation: Optional[Literal['UNLOADING', 'LOADING']] = None
    progressPct: Optional[int] = None
    utilizationPct: Optional[int] = None
    created_at: str
    updated_at: str


class BayCreate(BaseModel):
    id: str
    name: str
    warehouse_id: str
    type: BayType
    dynamicMode: Optional[Literal['GOODS_IN', 'GOODS_OUT']] = None
    capacity: int
    vehicleCompat: List[VehicleSize]
    status: BayStatus


class BayUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[BayType] = None
    dynamicMode: Optional[Literal['GOODS_IN', 'GOODS_OUT']] = None
    capacity: Optional[int] = None
    vehicleCompat: Optional[List[VehicleSize]] = None
    status: Optional[BayStatus] = None
    reserved_for: Optional[BayReservedFor] = None
    vehicle: Optional[BayVehicle] = None
    operation: Optional[Literal['UNLOADING', 'LOADING']] = None
    progressPct: Optional[int] = None


class BayAssignRequest(BaseModel):
    direction: Literal['IN', 'OUT']
    ref: str
    eta: Optional[str] = None
    vehicle: Optional[BayVehicle] = None
    operation: Optional[Literal['UNLOADING', 'LOADING']] = None


class BayKpis(BaseModel):
    total: int
    occupied: int
    reserved: int
    maintenance: int
    empty: int
    utilization: int
    averageTurnaroundMin: int
    idleRatePct: int
    efficiencyPct: int
